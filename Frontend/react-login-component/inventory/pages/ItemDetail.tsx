"use client"

import React, { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, Save, X, Calendar, MapPin, User,
  Hash, Tag, DollarSign, FileText, Wrench, Plus, Package, AlertCircle,
  CheckCircle, Clock,
} from 'lucide-react';
import { useApp } from '../store/appStore';
import { fetchItemById as apiFetchItem, updateItem as apiUpdateItem, deleteItem as apiDeleteItem, fetchLocations as apiFetchLocations } from '../api';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Breadcrumb } from '../layouts/Breadcrumb';
import type { InventoryItem, ItemStatus, ItemCategory, Location } from '../types';

const STATUS_OPTIONS: ItemStatus[] = ['active', 'inactive', 'maintenance', 'retired', 'low_stock'];
const CATEGORY_OPTIONS: ItemCategory[] = ['Electronics', 'Furniture', 'Vehicles', 'Tools', 'Office Supplies', 'IT Equipment', 'Safety Equipment'];

function DetailField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </p>
      <p className="text-sm text-gray-200">{value || '\u2014'}</p>
    </div>
  );
}

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useApp();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<Partial<InventoryItem>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pathname?.endsWith('/edit')) {
      setIsEditing(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([apiFetchItem(id), apiFetchLocations()]).then(([itemData, locs]) => {
      if (!cancelled) {
        setItem(itemData);
        setLocations(locs);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading asset details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package size={40} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-gray-300 mb-1">Asset not found</h2>
        <p className="text-sm text-gray-500 mb-6">This asset may have been deleted or moved.</p>
        <button onClick={() => router.push('/items')} className="btn-secondary">
          <ArrowLeft size={14} /> Back to Inventory
        </button>
      </div>
    );
  }

  const startEdit = () => {
    setForm({ ...item });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm({});
    setIsEditing(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const updated: InventoryItem = {
        ...item,
        ...form,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      await apiUpdateItem(updated);
      setItem(updated);
      setIsEditing(false);
      toast({ type: 'success', title: 'Asset updated', message: `"${updated.name}" saved successfully.` });
    } catch {
      toast({ type: 'error', title: 'Update failed', message: 'Could not save changes.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiDeleteItem(item.id);
      toast({ type: 'success', title: 'Asset deleted', message: `"${item.name}" has been removed.` });
      router.push('/items');
    } catch {
      toast({ type: 'error', title: 'Delete failed', message: 'Could not delete the asset.' });
    }
    setDeleteOpen(false);
  };

  const setField = (key: keyof InventoryItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  };

  const currentItem = isEditing ? { ...item, ...form } : item;

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => router.push('/items')} className="text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <Breadcrumb extra={[{ label: item.name }]} />
        </div>
        <div className="flex items-start justify-between mt-2">
          <div className="flex items-start gap-4">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-16 h-16 rounded-xl object-cover border border-gray-700/50"
            />
            <div>
              {isEditing ? (
                <input type="text" value={form.name ?? ''} onChange={setField('name')} className="input-base text-xl font-bold w-auto" />
              ) : (
                <h1 className="text-2xl font-bold text-white tracking-tight">{item.name}</h1>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{item.assetId}</span>
                <StatusBadge status={currentItem.status as ItemStatus} />
                <Badge variant="gray" size="sm">{item.category}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={cancelEdit} className="btn-secondary" disabled={saving}><X size={14} /> Cancel</button>
                <button onClick={saveEdit} className="btn-primary" disabled={saving}>
                  {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setDeleteOpen(true)} className="btn-danger"><Trash2 size={14} /> Delete</button>
                <button onClick={startEdit} className="btn-primary"><Pencil size={14} /> Edit Asset</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-gray-200 mb-5 flex items-center gap-2">
              <FileText size={14} className="text-blue-400" />
              General Information
            </h2>
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label><select value={form.status ?? ''} onChange={setField('status')} className="input-base">{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label><select value={form.category ?? ''} onChange={setField('category')} className="input-base">{CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Quantity</label><input type="number" min="0" value={form.quantity ?? ''} onChange={setField('quantity')} className="input-base" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Assigned To</label><input type="text" value={form.assignedTo ?? ''} onChange={setField('assignedTo')} className="input-base" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Serial Number</label><input type="text" value={form.serialNumber ?? ''} onChange={setField('serialNumber')} className="input-base" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Purchase Price ($)</label><input type="number" min="0" step="0.01" value={form.purchasePrice ?? ''} onChange={setField('purchasePrice')} className="input-base" /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label><textarea rows={3} value={form.description ?? ''} onChange={setField('description')} className="input-base resize-none" /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label><textarea rows={2} value={form.notes ?? ''} onChange={setField('notes')} className="input-base resize-none" /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DetailField label="Description" value={item.description} icon={<FileText size={11} />} />
                <DetailField label="Serial Number" value={item.serialNumber} icon={<Hash size={11} />} />
                <DetailField label="Category" value={item.category} icon={<Tag size={11} />} />
                <DetailField label="Assigned To" value={item.assignedTo} icon={<User size={11} />} />
                <DetailField label="Purchase Date" value={item.purchaseDate} icon={<Calendar size={11} />} />
                <DetailField label="Purchase Price" value={`$${item.purchasePrice.toLocaleString()}`} icon={<DollarSign size={11} />} />
                {item.notes && <div className="sm:col-span-2"><DetailField label="Notes" value={item.notes} icon={<FileText size={11} />} /></div>}
              </div>
            )}
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
              <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2"><Wrench size={14} className="text-amber-400" />Maintenance History</h2>
              <button className="btn-secondary text-xs py-1.5"><Plus size={12} /> Add Record</button>
            </div>
            {item.maintenanceHistory.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle size={20} className="text-emerald-400 mb-2" />
                <p className="text-sm text-gray-400">No maintenance records</p>
                <p className="text-xs text-gray-600 mt-0.5">This asset has a clean maintenance history.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {item.maintenanceHistory.map(record => (
                  <div key={record.id} className="px-6 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-200">{record.type}</span>
                        <Badge variant="amber" size="sm">{record.date}</Badge>
                      </div>
                      {record.cost > 0 && <span className="text-sm font-semibold text-gray-200">${record.cost.toLocaleString()}</span>}
                    </div>
                    <p className="text-sm text-gray-400">{record.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><User size={10} /> {record.technician}</span>
                      {record.nextDue && <span className="flex items-center gap-1"><Clock size={10} /> Next: {record.nextDue}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Asset Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Status</span><StatusBadge status={item.status} /></div>
              <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Quantity</span><span className={`text-sm font-bold tabular-nums ${item.quantity <= 5 ? 'text-rose-400' : item.quantity <= 10 ? 'text-amber-400' : 'text-gray-200'}`}>{item.quantity} units</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Last Updated</span><span className="text-xs text-gray-300">{new Date(item.lastUpdated).toLocaleDateString()}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Total Value</span><span className="text-sm font-bold text-gray-200">${(item.purchasePrice * item.quantity).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5"><MapPin size={12} /> Location</h3>
            {isEditing ? (
              <select
                value={form.locationId ?? ''}
                onChange={e => setForm(prev => ({ ...prev, locationId: e.target.value, locationName: locations.find(l => l.id === e.target.value)?.name ?? '' }))}
                className="input-base"
              >
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            ) : (
              <div>
                <button onClick={() => router.push('/locations')} className="font-semibold text-sm text-blue-400 hover:text-blue-300 transition-colors">{item.locationName}</button>
                <p className="text-xs text-gray-500 mt-1">{locations.find(l => l.id === item.locationId)?.address ?? 'No address on file'}</p>
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Asset Image</h3>
            <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover rounded-lg border border-gray-700/50" />
            {isEditing && <button className="btn-secondary w-full mt-3 text-xs"><Plus size={13} /> Upload New Image</button>}
          </div>

          {item.status === 'low_stock' && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">Low Stock Alert</p>
                  <p className="text-xs text-amber-400/80 mt-0.5 leading-relaxed">This item is running low. Consider reordering to maintain adequate supply levels.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Asset"
        message={`Are you sure you want to permanently delete "${item.name}"? This cannot be undone.`}
        confirmLabel="Delete Asset"
        variant="danger"
      />
    </div>
  );
}
