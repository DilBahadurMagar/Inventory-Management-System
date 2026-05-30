"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { useApp } from '../store/appStore';
import { createItem as apiCreateItem, fetchItems as apiFetchItems, fetchLocations as apiFetchLocations } from '../api';
import { Breadcrumb } from '../layouts/Breadcrumb';
import type { InventoryItem, ItemStatus, ItemCategory, Location } from '../types';

const STATUS_OPTIONS: ItemStatus[] = ['active', 'inactive', 'maintenance', 'retired', 'low_stock'];
const CATEGORY_OPTIONS: ItemCategory[] = ['Electronics', 'Furniture', 'Vehicles', 'Tools', 'Office Supplies', 'IT Equipment', 'Safety Equipment'];

interface FormErrors {
  name?: string;
  assetId?: string;
  quantity?: string;
}

export function ItemNewPage() {
  const { toast } = useApp();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [nextId, setNextId] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([apiFetchItems(), apiFetchLocations()]).then(([itemsRes, locs]) => {
      setNextId(itemsRes.total + 1);
      setLocations(locs);
    });
  }, []);

  const [form, setForm] = useState<Partial<InventoryItem>>({
    name: '',
    assetId: '',
    category: 'IT Equipment',
    quantity: 1,
    status: 'active',
    locationId: '',
    locationName: '',
    description: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    assignedTo: '',
    imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Set defaults after data loads
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      assetId: prev.assetId || `AST-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`,
      locationId: prev.locationId || locations[0]?.id || '',
      locationName: prev.locationName || locations[0]?.name || '',
    }));
  }, [nextId, locations]);

  const set = (key: keyof InventoryItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: key === 'quantity' || key === 'purchasePrice' ? Number(e.target.value) : e.target.value }));
    if (errors[key as keyof FormErrors]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name?.trim()) errs.name = 'Asset name is required';
    if (!form.assetId?.trim()) errs.assetId = 'Asset ID is required';
    if ((form.quantity ?? 0) < 0) errs.quantity = 'Quantity must be 0 or more';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const locationName = locations.find(l => l.id === form.locationId)?.name ?? '';
      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        name: form.name!,
        assetId: form.assetId!,
        category: form.category as ItemCategory,
        quantity: form.quantity ?? 1,
        status: form.status as ItemStatus,
        locationId: form.locationId!,
        locationName,
        lastUpdated: new Date().toISOString().split('T')[0],
        description: form.description ?? '',
        serialNumber: form.serialNumber ?? '',
        purchaseDate: form.purchaseDate ?? '',
        purchasePrice: form.purchasePrice ?? 0,
        assignedTo: form.assignedTo ?? '',
        imageUrl: form.imageUrl ?? '',
        notes: form.notes ?? '',
        maintenanceHistory: [],
      };
      await apiCreateItem(newItem);
      toast({ type: 'success', title: 'Asset created', message: `"${newItem.name}" has been added to inventory.` });
      router.push(`/items/${newItem.id}`);
    } catch {
      toast({ type: 'error', title: 'Create failed', message: 'Could not create the asset.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-[900px]">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => router.push('/items')} className="text-gray-500 hover:text-gray-300 transition-colors"><ArrowLeft size={16} /></button>
          <Breadcrumb extra={[{ label: 'New Asset' }]} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Add New Asset</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fill in the details to register a new asset.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/items')} className="btn-secondary"><ArrowLeft size={14} /> Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save size={14} /> Save Asset</>}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-gray-200 mb-5">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Asset Name <span className="text-rose-400">*</span></label>
                <input type="text" value={form.name ?? ''} onChange={set('name')} placeholder="e.g., Dell XPS 15 Laptop" className={`input-base ${errors.name ? 'border-rose-500/60' : ''}`} />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Asset ID / SKU <span className="text-rose-400">*</span></label>
                <input type="text" value={form.assetId ?? ''} onChange={set('assetId')} className={`input-base font-mono ${errors.assetId ? 'border-rose-500/60' : ''}`} />
                {errors.assetId && <p className="text-xs text-rose-400 mt-1">{errors.assetId}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Serial Number</label>
                <input type="text" value={form.serialNumber ?? ''} onChange={set('serialNumber')} placeholder="Manufacturer serial" className="input-base" />
              </div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label><select value={form.category ?? ''} onChange={set('category')} className="input-base">{CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label><select value={form.status ?? ''} onChange={set('status')} className="input-base">{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Quantity <span className="text-rose-400">*</span></label>
                <input type="number" min="0" value={form.quantity ?? ''} onChange={set('quantity')} className={`input-base ${errors.quantity ? 'border-rose-500/60' : ''}`} />
                {errors.quantity && <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>}
              </div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Assigned To</label><input type="text" value={form.assignedTo ?? ''} onChange={set('assignedTo')} placeholder="Team or person" className="input-base" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label><textarea rows={3} value={form.description ?? ''} onChange={set('description')} placeholder="Brief description of the asset..." className="input-base resize-none" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label><textarea rows={2} value={form.notes ?? ''} onChange={set('notes')} placeholder="Additional notes, reminders..." className="input-base resize-none" /></div>
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-gray-200 mb-5">Purchase Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Purchase Date</label><input type="date" value={form.purchaseDate ?? ''} onChange={set('purchaseDate')} className="input-base" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Purchase Price ($)</label><input type="number" min="0" step="0.01" value={form.purchasePrice ?? ''} onChange={set('purchasePrice')} className="input-base" /></div>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Location</h3>
            <select value={form.locationId ?? ''} onChange={e => setForm(prev => ({ ...prev, locationId: e.target.value, locationName: locations.find(l => l.id === e.target.value)?.name ?? '' }))} className="input-base">
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {form.locationId && (() => {
              const loc = locations.find(l => l.id === form.locationId);
              return loc ? <p className="text-xs text-gray-600 mt-2">{loc.address}</p> : null;
            })()}
          </div>
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Image URL</h3>
            <input type="url" value={form.imageUrl ?? ''} onChange={set('imageUrl')} placeholder="https://..." className="input-base text-xs" />
            {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="w-full h-36 object-cover rounded-lg mt-3 border border-gray-700/50" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 text-center">
              <Package size={16} className="text-gray-500" />
              <p className="text-xs text-gray-500">All fields marked with <span className="text-rose-400">*</span> are required.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
