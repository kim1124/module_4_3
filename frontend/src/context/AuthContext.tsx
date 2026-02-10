'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, getCurrentUser } from '@/lib/api/auth';

// User 인터페이스
interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
}

// AuthContext 인터페이스
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기화: localStorage에서 토큰 읽어오고 자동 로그인 시도
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        try {
          // 토큰으로 사용자 정보 가져오기
          const userData = await getCurrentUser(savedToken);
          setUser(userData);
        } catch (error) {
          // 토큰이 유효하지 않으면 삭제
          console.error('토큰 검증 실패:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 로그인 함수
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginUser(email, password);
      const accessToken = response.access_token;

      // 토큰 저장
      localStorage.setItem('token', accessToken);
      setToken(accessToken);

      // 사용자 정보 가져오기
      const userData = await getCurrentUser(accessToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
