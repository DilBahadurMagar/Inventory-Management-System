"use client"

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { InventoryItem, Location, ActivityLog, User } from '../types';
import { mockItems, mockLocations, mockActivity } from '../data/mockData';
import { fetchCurrentUser, logout as apiLogout } from '../api/auth';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  items: InventoryItem[];
  locations: Location[];
  activity: ActivityLog[];
  toasts: Toast[];
  sidebarCollapsed: boolean;
  searchQuery: string;
}

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_ITEM'; payload: InventoryItem }
  | { type: 'UPDATE_ITEM'; payload: InventoryItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'ADD_LOCATION'; payload: Location }
  | { type: 'UPDATE_LOCATION'; payload: Location }
  | { type: 'DELETE_LOCATION'; payload: string }
  | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SEARCH'; payload: string };

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  items: mockItems,
  locations: mockLocations,
  activity: mockActivity,
  toasts: [],
  sidebarCollapsed: false,
  searchQuery: '',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    case 'ADD_ITEM':
      return { ...state, items: [action.payload, ...state.items] };
    case 'UPDATE_ITEM':
      return { ...state, items: state.items.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'ADD_LOCATION':
      return { ...state, locations: [action.payload, ...state.locations] };
    case 'UPDATE_LOCATION':
      return { ...state, locations: state.locations.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LOCATION':
      return { ...state, locations: state.locations.filter(l => l.id !== action.payload) };
    case 'ADD_TOAST': {
      const id = `toast-${Date.now()}-${Math.random()}`;
      return { ...state, toasts: [...state.toasts, { ...action.payload, id }] };
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  login: (user: User) => void;
  logout: () => void;
  addItem: (item: InventoryItem) => void;
  updateItem: (item: InventoryItem) => void;
  deleteItem: (id: string) => void;
  addLocation: (location: Location) => void;
  updateLocation: (location: Location) => void;
  deleteLocation: (id: string) => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = useCallback((user: User) => dispatch({ type: 'LOGIN', payload: user }), []);

  const logout = useCallback(() => {
    apiLogout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  useEffect(() => {
    fetchCurrentUser().then(user => {
      if (user) {
        dispatch({ type: 'LOGIN', payload: user });
      }
    });
  }, []);

  const addItem = useCallback((item: InventoryItem) => dispatch({ type: 'ADD_ITEM', payload: item }), []);
  const updateItem = useCallback((item: InventoryItem) => dispatch({ type: 'UPDATE_ITEM', payload: item }), []);
  const deleteItem = useCallback((id: string) => dispatch({ type: 'DELETE_ITEM', payload: id }), []);

  const addLocation = useCallback((location: Location) => dispatch({ type: 'ADD_LOCATION', payload: location }), []);
  const updateLocation = useCallback((location: Location) => dispatch({ type: 'UPDATE_LOCATION', payload: location }), []);
  const deleteLocation = useCallback((id: string) => dispatch({ type: 'DELETE_LOCATION', payload: id }), []);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    dispatch({ type: 'ADD_TOAST', payload: t });
  }, []);

  const dismissToast = useCallback((id: string) => dispatch({ type: 'REMOVE_TOAST', payload: id }), []);
  const toggleSidebar = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []);

  return (
    <AppContext.Provider value={{ state, login, logout, addItem, updateItem, deleteItem, addLocation, updateLocation, deleteLocation, toast, dismissToast, toggleSidebar }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
