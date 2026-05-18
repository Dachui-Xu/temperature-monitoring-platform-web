import React from 'react';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ title, subtitle, children }) => {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="px-8 pt-8 pb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-gray-600">
            {subtitle}
          </p>
        )}
      </div>
      <div className="px-8 pb-8">
        {children}
      </div>
    </div>
  );
};