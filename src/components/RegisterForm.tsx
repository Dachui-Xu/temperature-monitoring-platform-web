import React, { useState } from 'react';
import { User, Lock, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { AuthView } from '../types';

interface RegisterFormProps {
  onChangeView: (view: AuthView) => void;
  onRegisterSuccess: (username: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onChangeView, onRegisterSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    try {
      // Call backend register; send only non-empty optional fields
      const res = await (await import('../services/authService')).authService.register({
        username: formData.username,
        password: formData.password,
        ...(formData.email ? { email: formData.email } : {}),
        ...(formData.phone ? { phone: formData.phone } : {}),
      });
      // 如果后端返回成功（或 200/201），显示等待管理员通过提示
      setIsSuccess(true);
    } catch (e) {
      // 尝试提取后端返回的友好错误信息
      const err: any = e;
      let msg = '注册失败，请稍后重试';
      if (err?.message) msg = err.message;
      if (err?.response?.data?.message) msg = err.response.data.message;
      if (err?.data?.message) msg = err.data.message;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
     return (
      <div className="text-center space-y-6 py-4">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">注册成功</h3>
          <p className="text-sm text-gray-500 px-4">
            请等待管理员通过
          </p>
        </div>
        <Button 
          type="button" 
          variant="primary" 
          fullWidth 
          onClick={() => onChangeView('login')}
        >
          返回登录页面
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="用户名"
          placeholder="设置用户名"
          icon={User}
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
        <Input
          label="电子邮箱 (可选)"
          placeholder="you@example.com"
          type="email"
          icon={Mail}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="手机号 (可选)"
          placeholder="13800138000"
          type="tel"
          icon={User}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input
          label="密码"
          placeholder="••••••••"
          type="password"
          icon={Lock}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <Input
          label="确认密码"
          placeholder="••••••••"
          type="password"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
      </div>

      {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">{error}</div>}

      <Button type="submit" isLoading={isLoading} fullWidth>
        提交注册申请
      </Button>

      <div className="text-center">
        <Button 
          type="button" 
          variant="link" 
          onClick={() => onChangeView('login')}
          className="text-sm"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          返回登录
        </Button>
      </div>
    </form>
  );
};