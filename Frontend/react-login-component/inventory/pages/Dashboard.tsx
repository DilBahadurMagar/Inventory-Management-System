"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, CheckCircle, AlertTriangle, Wrench, TrendingUp, TrendingDown,
  Plus, ArrowRight, Activity, DollarSign, Percent, BarChart3,
  RefreshCw, Clock, Move, UserCheck, Trash2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useApp } from '../store/appStore';
import { fetchItems, fetchActivity } from '../api';
import { mockKPI, mockInventoryChart, mockCategoryBreakdown } from '../data/mockData';
import { StatusBadge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { Breadcrumb } from '../layouts/Breadcrumb';
import type { ActivityType, InventoryItem, ActivityLog } from '../types';

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#60a5fa', '#34d399', '#fbbf24'];

const activityIconMap: Record<ActivityType, React.ReactNode> = {
  added: <Plus size={13} className="text-emerald-400" />,
  updated: <RefreshCw size={13} className="text-blue-400" />,
  moved: <Move size={13} className="text-amber-400" />,
  retired: <Trash2 size={13} className="text-rose-400" />,
  maintenance: <Wrench size={13} className="text-orange-400" />,
  assigned: <UserCheck size={13} className="text-blue-400" />,
};

const activityColors: Record<ActivityType, string> = {
  added: 'bg-emerald-500/10 border-emerald-500/20',
  updated: 'bg-blue-500/10 border-blue-500/20',
  moved: 'bg-amber-500/10 border-amber-500/20',
  retired: 'bg-rose-500/10 border-rose-500/20',
  maintenance: 'bg-orange-500/10 border-orange-500/20',
  assigned: 'bg-blue-500/10 border-blue-500/20',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-gray-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <span className="text-white font-medium">{p.value}</span></p>
      ))}
    </div>
  );
};

export function DashboardPage() {
  const { state } = useApp();
  const router = useRouter();
  const kpi = mockKPI;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchItems(), fetchActivity()]).then(([itemsRes, activityRes]) => {
      if (!cancelled) {
        setItems(itemsRes.items);
        setActivity(activityRes);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const lowStockItems = items.filter(i => i.status === 'low_stock');
  const maintenanceItems = items.filter(i => i.status === 'maintenance');

  const statCards = [
    {
      label: 'Total Assets',
      value: kpi.totalAssets.toString(),
      icon: <Package size={20} />,
      iconBg: 'bg-blue-500/15 text-blue-400',
      trend: '+12 this month',
      trendUp: true,
      borderColor: 'border-blue-500/15',
    },
    {
      label: 'Active Items',
      value: kpi.activeItems.toString(),
      icon: <CheckCircle size={20} />,
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      trend: `${((kpi.activeItems / kpi.totalAssets) * 100).toFixed(1)}% of total`,
      trendUp: true,
      borderColor: 'border-emerald-500/15',
    },
    {
      label: 'Low Stock',
      value: kpi.lowStock.toString(),
      icon: <AlertTriangle size={20} />,
      iconBg: 'bg-amber-500/15 text-amber-400',
      trend: '3 critical',
      trendUp: false,
      borderColor: 'border-amber-500/15',
    },
    {
      label: 'Maintenance Due',
      value: kpi.maintenanceDue.toString(),
      icon: <Wrench size={20} />,
      iconBg: 'bg-rose-500/15 text-rose-400',
      trend: '2 overdue',
      trendUp: false,
      borderColor: 'border-rose-500/15',
    },
    {
      label: 'Total Value',
      value: formatCurrency(kpi.totalValue),
      icon: <DollarSign size={20} />,
      iconBg: 'bg-blue-500/15 text-blue-400',
      trend: '+8.2% YTD',
      trendUp: true,
      borderColor: 'border-blue-500/15',
    },
    {
      label: 'Utilization Rate',
      value: `${kpi.utilizationRate}%`,
      icon: <Percent size={20} />,
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      trend: '+2.1% vs last month',
      trendUp: true,
      borderColor: 'border-emerald-500/15',
    },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <Breadcrumb />
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Good morning, {state.user?.name?.split(' ')[0]}. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/items/new')} className="btn-primary">
              <Plus size={15} />
              Add Asset
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map(card => (
            <div key={card.label} className={`glass-card-hover p-5 border ${card.borderColor}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                  {card.icon}
                </div>
                {card.trendUp
                  ? <TrendingUp size={14} className="text-emerald-400" />
                  : <TrendingDown size={14} className="text-rose-400" />
                }
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              <p className={`text-xs mt-1 font-medium ${card.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {card.trend}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Activity size={15} className="text-blue-400" />
                Inventory Overview
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Asset trends over the past 5 months</p>
            </div>
            <select className="input-base w-auto text-xs py-1.5">
              <option>Last 5 months</option>
              <option>Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockInventoryChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="maintenanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="active" name="Active" stroke="#3b82f6" fill="url(#activeGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="maintenance" name="Maintenance" stroke="#f59e0b" fill="url(#maintenanceGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-200">Assets by Category</h2>
            <p className="text-xs text-gray-500 mt-0.5">Distribution breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={mockCategoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {mockCategoryBreakdown.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {mockCategoryBreakdown.slice(0, 4).map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i] }} />
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className="text-gray-300 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
            <h2 className="text-sm font-semibold text-gray-200">Recent Activity</h2>
            <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg shimmer-base bg-gray-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 shimmer-base rounded bg-gray-800" />
                    <div className="h-2.5 w-1/2 shimmer-base rounded bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {activity.slice(0, 6).map(log => (
                <div key={log.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-gray-800/30 transition-colors">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${activityColors[log.type]}`}>
                    {activityIconMap[log.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate">{log.itemName}</p>
                    <p className="text-xs text-gray-500 truncate">{log.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-gray-600 text-xs">
                      <Clock size={10} />
                      {timeAgo(log.timestamp)}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{log.user}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card">
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h2 className="text-sm font-semibold text-gray-200">Alerts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Items requiring attention</p>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 shimmer-base rounded-lg bg-gray-800" />
                ))}
              </div>
            ) : (
              <>
                {lowStockItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={12} /> Low Stock ({lowStockItems.length})
                    </p>
                    {lowStockItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => router.push(`/items/${item.id}`)}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors mb-1"
                      >
                        <span className="text-xs text-gray-300 truncate">{item.name}</span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
                {maintenanceItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-orange-400 flex items-center gap-1.5 mb-2">
                      <Wrench size={12} /> In Maintenance ({maintenanceItems.length})
                    </p>
                    {maintenanceItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => router.push(`/items/${item.id}`)}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors mb-1"
                      >
                        <span className="text-xs text-gray-300 truncate">{item.name}</span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
                {lowStockItems.length === 0 && maintenanceItems.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <CheckCircle size={24} className="text-emerald-400 mb-2" />
                    <p className="text-sm font-medium text-gray-300">All clear!</p>
                    <p className="text-xs text-gray-500">No alerts at this time.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-gray-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add New Asset', icon: <Plus size={18} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', action: () => router.push('/items/new') },
            { label: 'View Inventory', icon: <Package size={18} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', action: () => router.push('/items') },
            { label: 'Manage Locations', icon: <Activity size={18} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', action: () => router.push('/locations') },
            { label: 'Run Report', icon: <BarChart3 size={18} />, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', action: () => router.push('/reports') },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border ${item.color} hover:brightness-125 transition-all duration-200 active:scale-95`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
