import { api, ApiError } from './helpers';
import type { Location, LocationType } from '../types';

interface BackendLocation {
  location_id: number;
  name: string;
  address: string | null;
  is_active: boolean;
}

function adaptLocation(b: BackendLocation): Location {
  return {
    id: String(b.location_id),
    name: b.name,
    type: 'warehouse' as LocationType, // backend doesn't store type; default
    address: b.address ?? '',
    capacity: 0,
    currentCount: 0,
    manager: '',
    description: '',
    createdAt: '',
  };
}

export async function fetchLocations(search?: string): Promise<Location[]> {
  const locations = await api.get<BackendLocation[]>('/locations');
  let result = locations.map(adaptLocation);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
    );
  }
  return result;
}

export async function fetchLocationById(id: string): Promise<Location> {
  const loc = await api.get<BackendLocation>(`/locations/${id}`);
  return adaptLocation(loc);
}

export async function createLocation(location: Location): Promise<Location> {
  const payload = {
    name: location.name,
    address: location.address || null,
    is_active: true,
  };
  const res = await api.post<BackendLocation>('/locations', payload);
  return adaptLocation(res);
}

export async function updateLocation(location: Location): Promise<Location> {
  const payload = {
    name: location.name,
    address: location.address || null,
    is_active: true,
  };
  const res = await api.put<BackendLocation>(`/locations/${location.id}`, payload);
  return adaptLocation(res);
}

export async function deleteLocation(id: string): Promise<{ success: boolean }> {
  await api.delete(`/locations/${id}`);
  return { success: true };
}
