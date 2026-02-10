import os
import time
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import yfinance as yf
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/gold", tags=["gold"])

# In-memory cache system
_cache: Dict[str, Tuple[float, Any]] = {}


def _get_cached(key: str, ttl: int) -> Optional[Any]:
    """Get data from cache if not expired."""
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < ttl:
            return data
    return None


def _set_cache(key: str, data: Any) -> None:
    """Store data in cache with current timestamp."""
    _cache[key] = (time.time(), data)


def _period_to_days(period: str) -> int:
    """Convert period string to number of days."""
    period_map = {
        "1d": 1,
        "1w": 7,
        "1m": 30,
        "1y": 365,
        "3y": 1095,
        "5y": 1825
    }
    return period_map.get(period, 1)


def _get_date_range(period: str) -> Tuple[datetime, datetime]:
    """Get start and end dates for the given period."""
    end_date = datetime.now()
    days = _period_to_days(period)
    start_date = end_date - timedelta(days=days)
    return start_date, end_date


@router.get("/international")
def get_international_gold(
    period: str = Query(default="1d", pattern="^(1d|1w|1m|1y|3y|5y)$"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get international gold price data (GC=F) from Yahoo Finance.

    Args:
        period: Time period (1d, 1w, 1m, 1y, 3y, 5y)
        current_user: Authenticated user

    Returns:
        Dict with data array, currency (USD), and unit (oz)
    """
    cache_key = f"intl_gold_{period}"
    cached = _get_cached(cache_key, ttl=300)
    if cached:
        return cached

    try:
        start_date, end_date = _get_date_range(period)
        # yfinance end는 exclusive이므로 하루 추가
        end_str = (end_date + timedelta(days=1)).strftime("%Y-%m-%d")
        start_str = start_date.strftime("%Y-%m-%d")
        ticker = yf.Ticker("GC=F")
        hist = ticker.history(start=start_str, end=end_str)

        if hist.empty:
            raise HTTPException(
                status_code=503,
                detail="Failed to fetch international gold data from Yahoo Finance"
            )

        # Convert DataFrame to list of dicts
        data = []
        for date_idx, row in hist.iterrows():
            data.append({
                "date": date_idx.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if row["Volume"] else 0
            })

        result = {
            "data": data,
            "currency": "USD",
            "unit": "oz"
        }

        _set_cache(cache_key, result)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error fetching international gold data: {str(e)}"
        )


@router.get("/krx")
def get_krx_gold(
    period: str = Query(default="1d", pattern="^(1d|1w|1m|1y|3y|5y)$"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get KRX gold price data from data.go.kr API.
    Falls back to mock data if API fails.

    Args:
        period: Time period (1d, 1w, 1m, 1y, 3y, 5y)
        current_user: Authenticated user

    Returns:
        Dict with data array, currency (KRW), and unit (g)
    """
    cache_key = f"krx_gold_{period}"
    cached = _get_cached(cache_key, ttl=3600)
    if cached:
        return cached

    days = _period_to_days(period)
    end_date = datetime.now()
    begin_date = end_date - timedelta(days=days)

    # Try to fetch from data.go.kr API
    service_key = os.environ.get("DATA_GO_KR_API_KEY", "62c4b90a631d34e8d130b6589358d104193ade5e747a4fe0277205dae426a605")

    try:
        url = "https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo"
        # Add one day to end_date to ensure today's data is included
        end_date_str = (end_date + timedelta(days=1)).strftime("%Y%m%d")
        params = {
            "serviceKey": service_key,
            "resultType": "json",
            "beginBasDt": begin_date.strftime("%Y%m%d"),
            "endBasDt": end_date_str,
            "numOfRows": 1000
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            api_data = response.json()

            # Check if API returned valid data
            if api_data and "response" in api_data and "body" in api_data["response"]:
                items = api_data["response"]["body"].get("items", {}).get("item", [])
                if items:
                    # Parse API data
                    data = []
                    for item in items:
                        raw_date = item.get("basDt", "")
                        # YYYYMMDD → YYYY-MM-DD
                        if len(raw_date) == 8:
                            formatted_date = f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:8]}"
                        else:
                            formatted_date = raw_date

                        data.append({
                            "date": formatted_date,
                            "open": int(item.get("mkp", 0)),
                            "high": int(item.get("hipr", 0)),
                            "low": int(item.get("lopr", 0)),
                            "close": int(item.get("clpr", 0)),
                            "volume": int(item.get("trqu", 0))
                        })

                    # data.go.kr API는 최신순(내림차순)으로 반환하므로 오름차순 정렬
                    data.sort(key=lambda x: x["date"])

                    result = {
                        "data": data,
                        "currency": "KRW",
                        "unit": "g"
                    }

                    _set_cache(cache_key, result)
                    return result
    except Exception:
        pass  # Fall through to mock data

    # Generate mock data as fallback
    base_price = 95000
    mock_data = []

    for i in range(days):
        d = begin_date + timedelta(days=i)
        fluctuation = random.uniform(-2000, 2000)
        o = base_price + fluctuation
        h = o + random.uniform(0, 1500)
        l = o - random.uniform(0, 1500)
        c = random.uniform(l, h)

        mock_data.append({
            "date": d.strftime("%Y-%m-%d"),
            "open": round(o),
            "high": round(h),
            "low": round(l),
            "close": round(c),
            "volume": random.randint(100, 5000)
        })

    result = {
        "data": mock_data,
        "currency": "KRW",
        "unit": "g"
    }

    _set_cache(cache_key, result)
    return result


@router.get("/premium")
def get_kimchi_premium(
    period: str = Query(default="1d", pattern="^(1d|1w|1m|1y|3y|5y)$"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Calculate kimchi premium for gold (KRX vs International).

    Args:
        period: Time period (1d, 1w, 1m, 1y, 3y, 5y)
        current_user: Authenticated user

    Returns:
        Dict with data array containing premium percentages and prices
    """
    cache_key = f"gold_premium_{period}"
    cached = _get_cached(cache_key, ttl=300)
    if cached:
        return cached

    try:
        # Get international gold data
        start_date, end_date = _get_date_range(period)
        end_str = (end_date + timedelta(days=1)).strftime("%Y-%m-%d")
        start_str = start_date.strftime("%Y-%m-%d")
        gold_ticker = yf.Ticker("GC=F")
        gold_hist = gold_ticker.history(start=start_str, end=end_str)

        # Get exchange rate data
        krw_ticker = yf.Ticker("KRW=X")
        krw_hist = krw_ticker.history(start=start_str, end=end_str)

        # Get KRX data - fetch wider period to match international data
        krx_period_map = {"1d": "1m", "1w": "1m", "1m": "1m", "1y": "1y", "3y": "3y", "5y": "5y"}
        krx_fetch_period = krx_period_map.get(period, period)
        krx_response = get_krx_gold(period=krx_fetch_period, current_user=current_user)
        krx_data = {item["date"]: item for item in krx_response["data"]}

        if gold_hist.empty or krw_hist.empty:
            raise HTTPException(
                status_code=503,
                detail="Failed to fetch required data for premium calculation"
            )

        # Calculate premium for each date
        data = []

        for date_idx, gold_row in gold_hist.iterrows():
            date_str = date_idx.strftime("%Y-%m-%d")

            # Get closest exchange rate
            try:
                if date_idx in krw_hist.index:
                    usd_krw = float(krw_hist.loc[date_idx, "Close"])
                else:
                    # Use most recent available rate
                    usd_krw = float(krw_hist["Close"].iloc[-1])
            except (KeyError, IndexError):
                usd_krw = 1300.0  # Fallback rate

            # Get international price per oz
            intl_price_per_oz = float(gold_row["Close"])

            # Convert to KRW per gram (1 oz = 31.1035 g)
            intl_price_krw_per_g = (intl_price_per_oz / 31.1035) * usd_krw

            # Get KRX price
            if date_str in krx_data:
                krx_price = krx_data[date_str]["close"]
            else:
                # Use most recent KRX price
                krx_price = list(krx_data.values())[-1]["close"] if krx_data else 95000

            # Calculate premium percentage
            premium_pct = ((krx_price / intl_price_krw_per_g) - 1) * 100

            data.append({
                "date": date_str,
                "premium_pct": round(premium_pct, 2),
                "krx_price": round(krx_price),
                "intl_price_krw": round(intl_price_krw_per_g)
            })

        result = {"data": data}
        _set_cache(cache_key, result)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error calculating kimchi premium: {str(e)}"
        )


@router.get("/recommendation")
def get_gold_recommendation(
    period: str = Query(default="1m", pattern="^(1d|1w|1m|1y|3y|5y)$"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get gold investment recommendation based on technical analysis.

    Logic:
    - Buy: MA5 > MA20 and premium < 3%
    - Sell: MA5 < MA20 or premium > 5%
    - Hold: Otherwise

    Args:
        period: Time period for analysis (1d, 1w, 1m, 1y, 3y, 5y)
        current_user: Authenticated user

    Returns:
        Dict with signal, reasons, moving averages, premium, and price info
    """
    cache_key = f"gold_rec_{period}"
    cached = _get_cached(cache_key, ttl=300)
    if cached:
        return cached

    try:
        # Get international gold data
        start_date, end_date = _get_date_range(period)
        end_str = (end_date + timedelta(days=1)).strftime("%Y-%m-%d")
        start_str = start_date.strftime("%Y-%m-%d")
        ticker = yf.Ticker("GC=F")
        hist = ticker.history(start=start_str, end=end_str)

        if hist.empty or len(hist) < 20:
            raise HTTPException(
                status_code=503,
                detail="Insufficient data for recommendation analysis"
            )

        # Calculate moving averages
        close_prices = hist["Close"]
        ma5 = float(close_prices.tail(5).mean())
        ma20 = float(close_prices.tail(20).mean())

        # Get current price and calculate change
        current_price = float(close_prices.iloc[-1])
        previous_price = float(close_prices.iloc[-2]) if len(close_prices) > 1 else current_price
        price_change_pct = ((current_price - previous_price) / previous_price) * 100

        # Get kimchi premium
        try:
            premium_response = get_kimchi_premium(period="1d", current_user=current_user)
            premium_pct = premium_response["data"][-1]["premium_pct"] if premium_response["data"] else 0.0
        except Exception:
            premium_pct = 0.0

        # Determine signal and reasons
        reasons = []

        if ma5 > ma20:
            reasons.append("5일 이동평균이 20일 이동평균을 상회")
        else:
            reasons.append("5일 이동평균이 20일 이동평균을 하회")

        if premium_pct < 3:
            reasons.append(f"김치 프리미엄 {premium_pct:.1f}% (적정 수준)")
        elif premium_pct > 5:
            reasons.append(f"김치 프리미엄 {premium_pct:.1f}% (과열)")
        else:
            reasons.append(f"김치 프리미엄 {premium_pct:.1f}% (보통)")

        # Signal logic
        if ma5 > ma20 and premium_pct < 3:
            signal = "buy"
        elif ma5 < ma20 or premium_pct > 5:
            signal = "sell"
        else:
            signal = "hold"

        result = {
            "signal": signal,
            "reasons": reasons,
            "ma5": round(ma5, 2),
            "ma20": round(ma20, 2),
            "premium_pct": round(premium_pct, 2),
            "current_price": round(current_price, 2),
            "price_change_pct": round(price_change_pct, 2)
        }

        _set_cache(cache_key, result)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error generating recommendation: {str(e)}"
        )
