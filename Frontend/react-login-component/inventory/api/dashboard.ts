import { wrap } from './helpers';
import { mockActivity } from '../data/mockData';
import type { ActivityLog } from '../types';

export async function fetchActivity(): Promise<ActivityLog[]> {
  return wrap([...mockActivity]);
}
