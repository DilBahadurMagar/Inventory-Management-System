"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MapPin, Package, Users, Edit, Trash2, Building2, Warehouse, LayoutGrid, List } from 'lucide-react';
import { useApp } from '../store/appStore';
import { fetchLocations as apiFetchLocations, fetchItems as apiFetchItems, createLocation as apiCreateLocation, updateLocation as apiUpdateLocation, deleteLocation as apiDeleteLocation } from '../api';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { Breadcrumb } from '../layouts/Breadcrumb';
import type { Location, LocationType, InventoryItem } from '../types';

const LOCATION_TYPE_OPTIONS: LocationType[] = ['warehouse', 'office', 'floor', 'storage', 'external'];

const typeConfig: Record<LocationType, { label: string; icon: React.ReactNode; color: string }> = {
  warehouse: { label: 'Warehouse', icon: <Warehouse size={14} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  office: { label: 'Office', icon: <Building2 size={14} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  floor: { label: 'Floor', icon: <LayoutGrid size={14} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  storage: { label: 'Storage', icon: <Package size={14} />, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
  external: { label: 'External', icon: <MapPin size={14} />, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

const emptyForm: Omit<Location, 'id' | 'currentCount' | 'createdAt'> = {
  name: '',
  type: 'warehouse',
  address: '',
  capacity: 100,
  manager: '',
  description: '',
};

function CapacityBar({ current, total }: { current: number; total: number }) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  const color = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-500">Capacity</span>
        <span className={`font-semibold ${pct >= 90 ? 'text-rose-400' : pct >= 70 ? 'text-amber-400' : 'text-gray-300'}`}>
          {current} / {total} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function LocationsPage() {
  const { toast } = useApp();
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Location, 'id' | 'currentCount' | 'createdAt'>>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [locsRes, itemsRes] = await Promise.all([apiFetchLocations(search), apiFetchItems()]);
      setLocations(locsRes);
      setItems(itemsRes.items);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (loc: Location) => {
    setForm({ name: loc.name, type: loc.type, address: loc.address, capacity: loc.capacity, manager: loc.manager, description: loc.description });
    setFormErrors({});
    setEditingId(loc.id);
    setModalOpen(true);
  };

  const validateForm = () => {
    const errs: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) errs.name = 'Location name is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (form.capacity < 1) errs.capacity = 'Capacity must be at least 1';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingId) {
        const existing = locations.find(l => l.id === editingId)!;
        await apiUpdateLocation({ ...existing, ...form });
        toast({ type: 'success', title: 'Location updated', message: `"${form.name}" saved.` });
      } else {
        const newLoc: Location = { ...form, id: `loc-${Date.now()}`, currentCount: 0, createdAt: new Date().toISOString().split('T')[0] };
        await apiCreateLocation(newLoc);
        toast({ type: 'success', title: 'Location added', message: `"${form.name}" created.` });
      }
      setModalOpen(false);
      loadData();
    } catch {
      toast({ type: 'error', title: 'Save failed', message: 'Could not save the location.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await apiDeleteLocation(deleteId);
        toast({ type: 'success', title: 'Location removed', message: `"${deleteName}" deleted.` });
        loadData();
      } catch {
        toast({ type: 'error', title: 'Delete failed', message: 'Could not delete the location.' });
      }
    }
    setDeleteId(null);
  };

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: key === 'capacity' ? Number(e.target.value) : e.target.value }));
    if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const totalItems = items.length;
  const totalCapacity = locations.reduce((a, l) => a + l.capacity, 0);

  const itemCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.locationId] = (counts[i.locationId] ?? 0) + 1; });
    return counts;
  }, [items]);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <Breadcrumb />
        <div className="flex items-start justify-between mt-1">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Locations</h1>
            <p className="text-sm text-gray-500 mt-0.5">{locations.length} locations · {totalItems} assets · {totalCapacity} total capacity</p>
          </div>
          <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Add Location</button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input type="text" placeholder="Search locations..." value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9 h-9" />
          </div>
          <div className="ml-auto flex items-center gap-1 bg-gray-800/60 border border-gray-700/50 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-700 text-gray-200' : 'text-gray-500 hover:text-gray-300'}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-700 text-gray-200' : 'text-gray-500 hover:text-gray-300'}`}><List size={14} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : locations.length === 0 ? (
        <EmptyState
          icon={<MapPin size={28} />}
          title="No locations found"
          description="Try a different search term, or add a new location to get started."
          action={<button onClick={openAdd} className="btn-primary"><Plus size={14} /> Add Location</button>}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {locations.map(loc => {
            const tc = typeConfig[loc.type];
            const itemCount = itemCounts[loc.id] ?? 0;
            return (
              <div key={loc.id} className="glass-card-hover p-5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${tc.color}`}>{tc.icon}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-200">{loc.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tc.color}`}>{tc.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(loc)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"><Edit size={13} /></button>
                    <button onClick={() => { setDeleteId(loc.id); setDeleteName(loc.name); }} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4 flex items-start gap-1.5"><MapPin size={11} className="shrink-0 mt-0.5 text-gray-600" />{loc.address}</p>
                <CapacityBar current={loc.currentCount} total={loc.capacity} />
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-700/50">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mb-0.5"><Package size={11} /> Items</div>
                    <p className="text-lg font-bold text-gray-200 tabular-nums">{itemCount}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mb-0.5"><Users size={11} /> Manager</div>
                    <p className="text-xs font-medium text-gray-300 truncate">{loc.manager || '\u2014'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50 bg-gray-800/30">
                {['Location', 'Type', 'Address', 'Capacity', 'Manager', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {locations.map(loc => {
                const tc = typeConfig[loc.type];
                const itemCount = itemCounts[loc.id] ?? 0;
                const pct = Math.round((loc.currentCount / loc.capacity) * 100);
                return (
                  <tr key={loc.id} className="table-row-hover group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${tc.color}`}>{tc.icon}</div>
                        <div><p className="text-sm font-medium text-gray-200">{loc.name}</p><p className="text-xs text-gray-600">{itemCount} items</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><span className={`text-xs font-medium px-2 py-1 rounded-full border ${tc.color}`}>{tc.label}</span></td>
                    <td className="px-4 py-3.5"><p className="text-xs text-gray-400 max-w-[200px] truncate">{loc.address}</p></td>
                    <td className="px-4 py-3.5">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">{loc.currentCount}/{loc.capacity}</span>
                          <span className={`font-medium ${pct >= 90 ? 'text-rose-400' : pct >= 70 ? 'text-amber-400' : 'text-gray-400'}`}>{pct}%</span>
                        </div>
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} /></div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><span className="text-sm text-gray-400">{loc.manager || '\u2014'}</span></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(loc)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"><Edit size={13} /></button>
                        <button onClick={() => { setDeleteId(loc.id); setDeleteName(loc.name); }} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Location' : 'Add New Location'}
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Plus size={14} /> {editingId ? 'Save Changes' : 'Add Location'}</>}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Location Name <span className="text-rose-400">*</span></label>
            <input type="text" value={form.name} onChange={setField('name')} placeholder="e.g., Main Warehouse A" className={`input-base ${formErrors.name ? 'border-rose-500/60' : ''}`} />
            {formErrors.name && <p className="text-xs text-rose-400 mt-1">{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label><select value={form.type} onChange={setField('type')} className="input-base">{LOCATION_TYPE_OPTIONS.map(t => <option key={t} value={t}>{typeConfig[t].label}</option>)}</select></div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Capacity <span className="text-rose-400">*</span></label>
              <input type="number" min="1" value={form.capacity} onChange={setField('capacity')} className={`input-base ${formErrors.capacity ? 'border-rose-500/60' : ''}`} />
              {formErrors.capacity && <p className="text-xs text-rose-400 mt-1">{formErrors.capacity}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Address <span className="text-rose-400">*</span></label>
            <input type="text" value={form.address} onChange={setField('address')} placeholder="Full address" className={`input-base ${formErrors.address ? 'border-rose-500/60' : ''}`} />
            {formErrors.address && <p className="text-xs text-rose-400 mt-1">{formErrors.address}</p>}
          </div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Manager</label><input type="text" value={form.manager} onChange={setField('manager')} placeholder="Manager name" className="input-base" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label><textarea rows={2} value={form.description} onChange={setField('description')} placeholder="Brief description of this location..." className="input-base resize-none" /></div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Location"
        message={`Are you sure you want to delete "${deleteName}"? Assets at this location will not be affected.`}
        confirmLabel="Delete Location"
        variant="danger"
      />
    </div>
  );
}
