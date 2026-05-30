"use client"

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../store/appStore';

const iconMap = {
  success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  error: <XCircle size={16} className="text-rose-400 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
};

const borderMap = {
  success: 'border-emerald-500/30',
  error: 'border-rose-500/30',
  warning: 'border-amber-500/30',
  info: 'border-blue-500/30',
};

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

function ToastItem({ id, type, title, message }: ToastItemProps) {
  const { dismissToast } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(id), 4500);
    return () => clearTimeout(timer);
  }, [id, dismissToast]);

  return (
    <div className={`flex items-start gap-3 bg-gray-800/95 backdrop-blur-sm border ${borderMap[type]} rounded-xl p-4 shadow-2xl w-80 animate-slide-up`}>
      {iconMap[type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-100">{title}</p>
        {message && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button
        onClick={() => dismissToast(id)}
        className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { state } = useApp();

  if (state.toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {state.toasts.map(t => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
}
