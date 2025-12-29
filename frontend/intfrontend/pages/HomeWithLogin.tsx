'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createPageUrl } from '@/lib/navigation';
import { Button } from '@/intfrontend/components/ui/button';
import LoginForm from '@/components/auth/LoginForm';
import { X } from 'lucide-react';

export default function HomeWithLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const handleClose = () => {
    // Remove login query param and redirect path
    router.push('/home');
  };

  const handleLoginSuccess = () => {
    // After successful login, redirect to the original path or dashboard
    if (redirectPath) {
      router.push(redirectPath);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      
      {/* Login Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 relative">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Sign In Required
              </h2>
              <p className="text-gray-600">
                Please sign in to access this feature
              </p>
            </div>
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}

