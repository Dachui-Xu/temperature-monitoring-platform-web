import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { AuthView } from '../types';

interface ForgotPasswordFormProps {
  onChangeView: (view: AuthView) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onChangeView }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };

  if (isSent) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">邮件已发送</h3>
          <p className="text-sm text-gray-500">
            重置密码的链接已发送至 <strong>{email}</strong>。请查收您的邮箱。
          </p>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          fullWidth 
          onClick={() => onChangeView('login')}
        >
          返回登入
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        请输入您的注册邮箱地址，我们将向您发送重置密码的链接。
      </div>

      <Input
        label="电子邮箱"
        placeholder="you@example.com"
        type="email"
        icon={Mail}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Button type="submit" isLoading={isLoading} fullWidth>
        发送重置链接
      </Button>

      <div className="text-center">
        <Button 
          type="button" 
          variant="link" 
          onClick={() => onChangeView('login')}
          className="text-sm"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          返回登入
        </Button>
      </div>
    </form>
  );
};