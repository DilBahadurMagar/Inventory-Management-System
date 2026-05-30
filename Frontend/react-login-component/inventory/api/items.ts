import { api } from './helpers';
import type { InventoryItem, ItemStatus, ItemCategory } from '../types';

// Backend response shape from /items
interface BackendItemFull {
  item_id: number;
  name: string;
  sku: string;
  category_name: string | null;
  category_id: number | null;
  total_quantity: number;
  asset_status: string;
  location_id: number | null;
  location_name: string | null;
  last_updated: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  unit_price: number;
  reorder_level: number;
  notes: string | null;
  assigned_to: string | null;
  image_url: string | null;
}

interface BackendItemList {
  items: BackendItemFull[];
  total: number;
}

const STATUS_MAP: Record<string, ItemStatus> = {
  active: 'active',
  inactive: 'inactive',
  maintenance: 'maintenance',
  retired: 'retired',
  'in stock': 'active',
};

const CATEGORY_MAP: Record<string, ItemCategory> = {
  'it equipment': 'IT Equipment',
  'electronics': 'Electronics',
  'furniture': 'Furniture',
  'vehicles': 'Vehicles',
  'tools': 'Tools',
  'office supplies': 'Office Supplies',
  'safety equipment': 'Safety Equipment',
};

const DEFAULT_IMAGE = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400';

function adaptItem(b: BackendItemFull): InventoryItem {
  const rawStatus = b.asset_status.toLowerCase();
  let status: ItemStatus = STATUS_MAP[rawStatus] ?? 'active';
  // Override with low_stock if quantity is low
  if (b.total_quantity <= b.reorder_level && b.total_quantity > 0) {
    status = 'low_stock';
  }

  const rawCat = (b.category_name ?? '').toLowerCase();
  const category: ItemCategory = CATEGORY_MAP[rawCat] ?? 'IT Equipment';

  return {
    id: String(b.item_id),
    name: b.name,
    assetId: b.sku,
    category,
    quantity: b.total_quantity,
    status,
    locationId: b.location_id ? String(b.location_id) : '',
    locationName: b.location_name ?? 'Unassigned',
    lastUpdated: b.last_updated ? b.last_updated.split('T')[0] : new Date().toISOString().split('T')[0],
    description: '',
    serialNumber: b.serial_number ?? '',
    purchaseDate: b.purchase_date ?? '',
    purchasePrice: b.unit_price,
    assignedTo: b.assigned_to ?? '',
    imageUrl: b.image_url ?? DEFAULT_IMAGE,
    maintenanceHistory: [],
    notes: '',
  };
}

export async function fetchItems(filters?: {
  search?: string;
  status?: ItemStatus | '';
  category?: ItemCategory | '';
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}): Promise<{ items: InventoryItem[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.pageSize) params.set('page_size', String(filters.pageSize));
  if (filters?.sortKey) params.set('sort_key', filters.sortKey);
  if (filters?.sortDir) params.set('sort_dir', filters.sortDir);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await api.get<BackendItemList>(`/items${query}`);
  return {
    items: res.items.map(adaptItem),
    total: res.total,
  };
}

export async function fetchItemById(id: string): Promise<InventoryItem> {
  const res = await api.get<BackendItemFull>(`/items/${id}`);
  return adaptItem(res);
}

export async function createItem(item: InventoryItem): Promise<InventoryItem> {
  const payload = {
    name: item.name,
    sku: item.assetId,
    category_name: item.category,
    quantity: item.quantity,
    status: item.status,
    location_id: item.locationId ? parseInt(item.locationId) : null,
    serial_number: item.serialNumber || null,
    purchase_date: item.purchaseDate || null,
    unit_price: item.purchasePrice ?? 0,
    reorder_level: 10,
    notes: item.notes || null,
    assigned_to: item.assignedTo || null,
    image_url: item.imageUrl || null,
  };
  const res = await api.post<BackendItemFull>('/items', payload);
  return adaptItem(res);
}

export async function updateItem(item: InventoryItem): Promise<InventoryItem> {
  const payload = {
    name: item.name,
    sku: item.assetId,
    category_name: item.category,
    quantity: item.quantity,
    status: item.status,
    location_id: item.locationId ? parseInt(item.locationId) : null,
    serial_number: item.serialNumber || null,
    purchase_date: item.purchaseDate || null,
    unit_price: item.purchasePrice ?? 0,
    notes: item.notes || null,
    assigned_to: item.assignedTo || null,
    image_url: item.imageUrl || null,
  };
  const res = await api.put<BackendItemFull>(`/items/${item.id}`, payload);
  return adaptItem(res);
}

export async function deleteItem(id: string): Promise<{ success: boolean }> {
  await api.delete(`/items/${id}`);
  return { success: true };
}
