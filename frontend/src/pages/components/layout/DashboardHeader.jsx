// DashboardHeader.jsx
import React from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function DashboardHeader({ title }) {
  const { auth } = useAuth();

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <h1 id="page-title" className="mt-10 text-4xl sm:text-6xl font-bold text-gray-800 capitalize">{title}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <div className="font-medium">{auth?.user?.username || auth?.user?.email}</div>
            <div className="text-xs text-gray-400">{auth?.user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
