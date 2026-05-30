"use client"

import React from 'react';
import type { ItemStatus } from '../../types';

const statusConfig: Record<ItemStatus, { label: string; classes: string; dot: string }> = {
  active: { label: 'Active', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  inactive: { label: 'Inactive', classes: 'bg-gray-600/30 text-gray-400 border-gray-500/30', dot: 'bg-gray-400' },
  maintenance: { label: 'Maintenance', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/25', dot: 'bg-amber-400' },
  retired: { label: 'Retired', classes: 'bg-rose-500/15 text-rose-400 border-rose-500/25', dot: 'bg-rose-400' },
  low_stock: { label: 'Low Stock', classes: 'bg-orange-500/15 text-orange-400 border-orange-500/25', dot: 'bg-orange-400' },
};

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 border font-medium rounded-full
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      ${config.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse-soft`} />
      {config.label}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'gray';
  size?: 'sm' | 'md';
}

const variantClasses = {
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  gray: 'bg-gray-600/30 text-gray-400 border-gray-500/30',
};

export function Badge({ children, variant = 'gray', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center border font-medium rounded-full
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
