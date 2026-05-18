import React, { useState } from 'react';
import { AuthCard } from './components/AuthCard';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { AuthView, User } from './types';
import { Thermometer } from 'lucide-react';
import { DashboardLayout } from './components/DashboardLayout';
import { GuestBigScreen } from './components/dashboard/GuestBigScreen';

export default function App() {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [user, setUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  // If user is logged in, show the appropriate Dashboard
  if (user) {
    if (user.role === 'guest') {
      return <GuestBigScreen onLogout={handleLogout} />;
    }
    return <DashboardLayout user={user} onLogout={handleLogout} />;
  }

  // Render Auth Screens
  const getTitle = () => {
    switch (currentView) {
      case 'login': return '欢迎回来';
      case 'register': return '创建新账号';
      case 'forgot-password': return '重置密码';
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'login': return '请输入您的账号信息以继续';
      case 'register': return '注册以访问温度监控平台';
      case 'forgot-password': return '';
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative">
      {/* Decorative Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-0"></div>
      
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg">
              <Thermometer className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-tight">温度监控平台</span>
          </div>
        </div>

        <AuthCard title={getTitle()} subtitle={getSubtitle()}>
          {currentView === 'login' && (
            <LoginForm 
              onChangeView={setCurrentView} 
              onLoginSuccess={handleLoginSuccess} 
            />
          )}
          {currentView === 'register' && (
            <RegisterForm 
              onChangeView={setCurrentView}
              onRegisterSuccess={(name) => handleLoginSuccess({ username: name, role: 'user' })}
            />
          )}
          {currentView === 'forgot-password' && (
            <ForgotPasswordForm 
              onChangeView={setCurrentView} 
            />
          )}
        </AuthCard>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            &copy; 2024 嘉善复旦研究院. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}