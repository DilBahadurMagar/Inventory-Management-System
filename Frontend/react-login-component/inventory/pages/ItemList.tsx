"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Plus, ChevronUp, ChevronDown, ChevronsUpDown,
  MoreHorizontal, Eye, Pencil, Trash2, Download, SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../store/appStore';
import { fetchItems as apiFetchItems, deleteItem as apiDeleteItem } from '../api';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import { Breadcrumb } from '../layouts/Breadcrumb';
import type { InventoryItem, ItemStatus, ItemCategory } from '../types';

type SortKey = keyof Pick<InventoryItem, 'name' | 'assetId' | 'category' | 'quantity' | 'status' | 'locationName' | 'lastUpdated'>;

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: ItemStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'retired', label: 'Retired' },
];

const CATEGORY_OPTIONS: { value: ItemCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Vehicles', label: 'Vehicles' },
  { value: 'Tools', label: 'Tools' },
  { value: 'Office Supplies', label: 'Office Supplies' },
  { value: 'IT Equipment', label: 'IT Equipment' },
  { value: 'Safety Equipment', label: 'Safety Equipment' },
];

function SortIcon({ field, sortKey, direction }: { field: SortKey; sortKey: SortKey; direction: 'asc' | 'desc' }) {
  if (sortKey !== field) return <ChevronsUpDown size={13} className="text-gray-600" />;
  return direction === 'asc' ? <ChevronUp size={13} className="text-blue-400" /> : <ChevronDown size={13} className="text-blue-400" />;
}

export function ItemListPage() {
  const { toast } = useApp();
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('lastUpdated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetchItems({
        search,
        status: statusFilter,
        category: categoryFilter,
        sortKey,
        sortDir,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items);
      setTotalItems(res.total);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, sortKey, sortDir, page]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setOpenMenuId(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await apiDeleteItem(deleteId);
        toast({ type: 'success', title: 'Asset deleted', message: `"${deleteName}" has been removed.` });
        loadItems();
      } catch {
        toast({ type: 'error', title: 'Delete failed', message: 'Could not delete the asset.' });
      }
    }
    setDeleteId(null);
  };

  const colHeader = (label: string, key: SortKey) => (
    <th
      onClick={() => handleSort(key)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors select-none"
    >
      <div className="flex items-center gap-1.5">
        {label}
        <SortIcon field={key} sortKey={sortKey} direction={sortDir} />
      </div>
    </th>
  );

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div>
        <Breadcrumb />
        <div className="flex items-start justify-between mt-1">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">{totalItems} total assets across all locations</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Download size={14} /> Export
            </button>
            <button onClick={() => router.push('/items/new')} className="btn-primary">
              <Plus size={14} /> Add Asset
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, SKU (Asset ID), or serial number..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input-base pl-9 h-9"
            />
            {search && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-medium">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as ItemStatus | ''); setPage(1); }}
              className="input-base w-auto h-9 pr-8"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value as ItemCategory | ''); setPage(1); }}
              className="input-base w-auto h-9 pr-8"
            >
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {(search || statusFilter || categoryFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setPage(1); }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-800"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="ml-auto">
            <button className="btn-secondary h-9">
              <SlidersHorizontal size={14} /> Columns
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={5} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No assets found"
            description="Try adjusting your search or filter criteria to find what you're looking for."
            action={<button onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }} className="btn-secondary">Clear filters</button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-gray-800/30">
                    {colHeader('Item Name', 'name')}
                    {colHeader('Asset ID / SKU', 'assetId')}
                    {colHeader('Category', 'category')}
                    {colHeader('Quantity', 'quantity')}
                    {colHeader('Status', 'status')}
                    {colHeader('Location', 'locationName')}
                    {colHeader('Last Updated', 'lastUpdated')}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {items.map(item => (
                    <tr key={item.id} className="table-row-hover group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-8 h-8 rounded-lg object-cover border border-gray-700/50"
                          />
                          <div>
                            <button
                              onClick={() => router.push(`/items/${item.id}`)}
                              className="text-sm font-medium text-gray-200 hover:text-blue-400 transition-colors"
                            >
                              {item.name}
                            </button>
                            <p className="text-xs text-gray-600">{item.assignedTo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <span className="text-xs font-mono text-gray-300 bg-gray-800/60 px-2 py-1 rounded">{item.assetId}</span>
                          <p className="text-[10px] text-gray-600 mt-1 font-mono">S/N: {item.serialNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="gray" size="sm">{item.category}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-semibold tabular-nums ${item.quantity <= 5 ? 'text-rose-400' : item.quantity <= 10 ? 'text-amber-400' : 'text-gray-200'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-400">{item.locationName}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">
                          {new Date(item.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push(`/items/${item.id}`)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => router.push(`/items/${item.id}/edit`)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {openMenuId === item.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-20 overflow-hidden animate-scale-in">
                                <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
                                  <Eye size={13} /> View Details
                                </button>
                                <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
                                  <Pencil size={13} /> Edit Asset
                                </button>
                                <div className="border-t border-gray-800 my-1" />
                                <button
                                  onClick={() => confirmDelete(item.id, item.name)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 size={13} /> Delete Asset
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-700/50">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
        confirmLabel="Delete Asset"
        variant="danger"
      />
    </div>
  );
}
