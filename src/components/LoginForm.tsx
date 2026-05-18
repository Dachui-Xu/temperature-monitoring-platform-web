import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { AuthView, User as UserType } from '../types';
import { authService } from '../services/authService';

interface LoginFormProps {
  onChangeView: (view: AuthView) => void;
  onLoginSuccess: (user: UserType) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onChangeView, onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedCreds = localStorage.getItem('temp_monitor_creds');
    if (savedCreds) {
      try {
        const parsed = JSON.parse(savedCreds);
        setFormData(parsed);
        setRememberMe(true);
      } catch (e) {
        console.error('Error parsing saved credentials', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authService.login({
        username: formData.username,
        password: formData.password
      });

      if (rememberMe) {
        localStorage.setItem('temp_monitor_creds', JSON.stringify(formData));
      } else {
        localStorage.removeItem('temp_monitor_creds');
      }

      if (user && user.token) {
        localStorage.setItem('auth_token', user.token);
      }

      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const user = await authService.guestLogin();
      onLoginSuccess(user);
    } catch (err: any) {
      setError('访客登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="用户名"
          placeholder="请输入用户名"
          icon={User}
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <button
              type="button"
              onClick={() => onChangeView('forgot-password')}
              className="text-sm font-medium text-brand-600 hover:text-brand-500"
            >
              忘记密码?
            </button>
          </div>
          <Input
            placeholder="请输入密码"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 select-none cursor-pointer">
            记住我
          </label>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">{error}</div>}

      <div className="space-y-3">
        <Button type="submit" isLoading={isLoading} fullWidth>
          登录
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">或者</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="outline" 
          fullWidth 
          onClick={handleGuestLogin}
          disabled={isLoading}
        >
          <LogIn className="mr-2 h-4 w-4 text-gray-500" />
          访客登录
        </Button>
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-500">还没有账号? </span>
        <button
          type="button"
          onClick={() => onChangeView('register')}
          className="font-medium text-brand-600 hover:text-brand-500"
        >
          立即注册
        </button>
      </div>
    </form>
  );
};