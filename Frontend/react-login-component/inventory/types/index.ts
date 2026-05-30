export type ItemStatus = 'active' | 'inactive' | 'maintenance' | 'retired' | 'low_stock';
export type ItemCategory = 'Electronics' | 'Furniture' | 'Vehicles' | 'Tools' | 'Office Supplies' | 'IT Equipment' | 'Safety Equipment';
export type LocationType = 'warehouse' | 'office' | 'floor' | 'storage' | 'external';
export type ActivityType = 'added' | 'updated' | 'moved' | 'retired' | 'maintenance' | 'assigned';

export interface InventoryItem {
  id: string;
  name: string;
  assetId: string;
  category: ItemCategory;
  quantity: number;
  status: ItemStatus;
  locationId: string;
  locationName: string;
  lastUpdated: string;
  description: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  assignedTo: string;
  imageUrl: string;
  maintenanceHistory: MaintenanceRecord[];
  notes: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  technician: string;
  cost: number;
  nextDue: string;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address: string;
  capacity: number;
  currentCount: number;
  manager: string;
  description: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: ActivityType;
  itemName: string;
  itemId: string;
  description: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  avatar: string;
  department: string;
}

export interface KPIData {
  totalAssets: number;
  activeItems: number;
  lowStock: number;
  maintenanceDue: number;
  totalValue: number;
  utilizationRate: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  active?: number;
  inactive?: number;
  maintenance?: number;
}
