'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    submit: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // 필드별 검증 함수
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'username':
        if (value.length < 3 || value.length > 50) {
          return '사용자명은 3-50자 사이여야 합니다';
        }
        return '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return '올바른 이메일 형식이 아닙니다';
        }
        return '';
      case 'password':
        if (value.length < 8) {
          return '비밀번호는 최소 8자 이상이어야 합니다';
        }
        return '';
      case 'passwordConfirm':
        if (value !== formData.password) {
          return '비밀번호가 일치하지 않습니다';
        }
        return '';
      default:
        return '';
    }
  };

  // 입력 값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 입력 중에는 에러 메시지 초기화
    setErrors((prev) => ({
      ...prev,
      [name]: '',
      submit: '',
    }));
  };

  // onBlur 검증
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 전체 필드 검증
    const newErrors = {
      username: validateField('username', formData.username),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      passwordConfirm: validateField('passwordConfirm', formData.passwordConfirm),
      submit: '',
    };

    setErrors(newErrors);

    // 에러가 있으면 제출 중단
    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // 성공 시 로그인 페이지로 리다이렉트
      router.push('/login');
    } catch (error) {
      // 에러 메시지 표시
      if (error instanceof Error) {
        setErrors((prev) => ({
          ...prev,
          submit: error.message,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: '네트워크 오류가 발생했습니다',
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username 필드 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                사용자명
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="사용자명 (3-50자)"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Email 필드 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="example@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password 필드 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="최소 8자 이상"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Password Confirmation 필드 */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 확인"
                value={formData.passwordConfirm}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
              />
              {errors.passwordConfirm && (
                <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm}</p>
              )}
            </div>
          </div>

          {/* 제출 에러 메시지 */}
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* 제출 버튼 */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </button>
          </div>

          {/* 로그인 링크 */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                로그인
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
