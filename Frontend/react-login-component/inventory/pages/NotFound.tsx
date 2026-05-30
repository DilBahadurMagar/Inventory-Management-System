"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Boxes } from 'lucide-react';

export function NotFoundPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-600/25 flex items-center justify-center mb-6">
        <Boxes size={28} className="text-blue-400" />
      </div>
      <p className="text-7xl font-bold text-gradient mb-3">404</p>
      <h1 className="text-xl font-semibold text-gray-300 mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 mb-8 max-w-xs">The page you're looking for doesn't exist or has been moved.</p>
      <button onClick={() => router.push('/dashboard')} className="btn-primary">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>
    </div>
  );
}
