import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeStorage from '../utils/safeStorage';

// Use safe storage for web environment to handle localStorage issues
const isWeb = typeof window !== 'undefined';
const storage = isWeb ? SafeStorage : AsyncStorage;

// Supabase configuration
const supabaseUrl = 'https://dbwoaiihjffzfqsozgjn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid29haWloamZmemZxc296Z2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzYyODEsImV4cCI6MjA3MDIxMjI4MX0.cUbY2rL8Qjqio_D59hp4mAT8oMhhNDjrPRPpfRFwnok';

// Create Supabase client with React Native configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    },
  },
});

// Helper function to set user context for RLS
export const setUserContext = async (userId: number) => {
  // Skip in demo mode
  if (isDemoMode) {
    console.log('Demo mode: Skipping user context setup for user ID:', userId);
    return;
  }

  try {
    const { error } = await supabase.rpc('set_user_context', {
      user_id: userId
    });

    if (error) {
      console.error('Error setting user context:', error);
      throw error;
    }

    console.log('User context set successfully for user ID:', userId);
  } catch (error) {
    console.error('Failed to set user context:', error);
    throw error;
  }
};

// Helper function to clear user context
export const clearUserContext = async () => {
  // Skip in demo mode
  if (isDemoMode) {
    console.log('Demo mode: Skipping user context clear');
    return;
  }

  try {
    const { error } = await supabase.rpc('clear_user_context');

    if (error) {
      console.error('Error clearing user context:', error);
    } else {
      console.log('User context cleared successfully');
    }
  } catch (error) {
    console.error('Failed to clear user context:', error);
  }
};

// Check if we're in demo mode
const isDemoMode = process.env.DEMO_MODE === 'true' || process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

// Demo users data
const demoUsers: User[] = [
  {
    id: 1,
    name: 'Super Admin',
    email: 'admin@serranotex.com',
    role: 'super_admin',
    status: 'active',
    permissions: {},
    assigned_location_id: undefined,
    can_add_sales_managers: true,
    profile_picture: undefined,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Sales Manager',
    email: 'sales1@serranotex.com',
    role: 'sales_manager',
    status: 'active',
    permissions: {},
    assigned_location_id: 1,
    can_add_sales_managers: false,
    profile_picture: undefined,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Investor',
    email: 'investor@serranotex.com',
    role: 'investor',
    status: 'active',
    permissions: {},
    assigned_location_id: undefined,
    can_add_sales_managers: false,
    profile_picture: undefined,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Test authentication function
export const testAuth = async (email: string): Promise<{ data: User | null; error: any }> => {
  try {
    console.log('Testing authentication for:', email);

    // If in demo mode, use mock data
    if (isDemoMode) {
      console.log('Demo mode: Using mock authentication');
      const user = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        console.log('Demo user found:', user);
        return { data: user, error: null };
      } else {
        return { data: null, error: { message: 'User not found in demo data' } };
      }
    }

    // Production mode: Connect to Supabase
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, permissions, assigned_location_id, can_add_sales_managers, profile_picture, last_login, created_at, updated_at, password_hash')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    console.log('Auth test result:', { data, error });
    console.log('Full user data:', JSON.stringify(data, null, 2));
    return { data, error };
  } catch (error) {
    console.error('Auth test failed:', error);
    return { data: null, error };
  }
};

// TypeScript interfaces for database entities
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'sales_manager' | 'investor';
  permissions?: any;
  assigned_location_id?: number;
  can_add_sales_managers: boolean;
  status: 'active' | 'inactive';
  profile_picture?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  password_hash?: string;
}

export interface Product {
  id: number;
  name: string;
  product_code: string;
  category_id?: number;
  description?: string;
  // Pricing fields - optional since pricing is primarily stored in lots
  purchase_price?: number | null;
  selling_price?: number | null;
  per_meter_price?: number | null;
  supplier_id?: number;
  location_id?: number;
  minimum_threshold: number;
  current_stock: number; // Keep for backward compatibility
  total_stock: number; // New field - sum of all lot quantities
  quantity?: number;
  current_lot_number?: number;
  last_lot_no?: number; // Tracks the actual lot number (not ID)
  total_purchased: number;
  total_sold: number;
  wastage_status: boolean;
  product_status: 'active' | 'slow' | 'inactive';
  unit_of_measurement?: string;
  images?: any;
  created_by?: number;
  created_at: string;
  updated_at: string;
  last_sold?: string;
}

export interface ProductLot {
  id: number;
  product_id: number;
  lot_number: number;
  quantity: number;
  purchase_price?: number | null;
  selling_price?: number | null;
  per_unit_price?: number | null; // Automatically calculated as selling_price / quantity
  supplier_id?: number;
  location_id?: number;
  received_date?: string;
  expiry_date?: string;
  status?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: number;
  name: string;
  type: 'warehouse' | 'showroom';
  address: string;
  city?: string;
  capacity?: number;
  manager_name?: string;
  manager_phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  delivery_address?: string;
  customer_type: 'vip' | 'wholesale' | 'regular';
  total_purchases: number;
  total_due: number;
  last_purchase_date?: string;
  red_list_status: boolean;
  red_list_since?: string;
  fixed_coupon?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  sale_number: string;
  customer_id?: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  due_date?: string;
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'mobile_banking';
  payment_status: 'paid' | 'partial' | 'pending' | 'overdue';
  sale_status: 'draft' | 'finalized' | 'cancelled';
  delivery_person?: string;
  delivery_photo?: string;
  location_id?: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
}
