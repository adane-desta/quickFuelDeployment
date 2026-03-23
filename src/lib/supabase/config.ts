// Supabase Configuration
// This file contains the configuration for connecting to Supabase

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Load from environment variables
export const supabaseConfig: SupabaseConfig = { 
  url: import.meta.env.VITE_SUPABASE_URL || 'https://xqpjqpfpghqorziluumr.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcGpxcGZwZ2hxb3J6aWx1dW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTIzMTIsImV4cCI6MjA4OTE4ODMxMn0.gGqbiDWRNj_Ux3H9csmb2itPq6wZ2-l3qihgFYdOoG8',
};

// Validate configuration on load
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  console.error('❌ SUPABASE CONFIGURATION ERROR!');
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  console.error('Please check your .env.local file');
  console.error('See FIX_AUTH_ISSUE.md for instructions');
}

// Warn if using default/incomplete keys
if (supabaseConfig.anonKey.length < 100) {
  console.warn('⚠️  WARNING: Supabase anon key appears incomplete!');
  console.warn('Please verify your VITE_SUPABASE_ANON_KEY in .env.local');
  console.warn('Get the full key from: https://djfzgxnquxzbnxfjvkcp.supabase.co → Settings → API');
}

// Validation helpers
export const validateEthiopianPhone = (phone: string): boolean => {
  // Ethiopian phone format: +251 9XX XXX XXX or 09XX XXX XXX
  const regex = /^(\+251|0)?9\d{8}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

export const formatEthiopianPhone = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 251, add +
  if (digits.startsWith('251')) {
    return '+' + digits;
  }
  
  // If starts with 0, replace with +251
  if (digits.startsWith('0')) {
    return '+251' + digits.substring(1);
  }
  
  // If starts with 9, add +251
  if (digits.startsWith('9')) {
    return '+251' + digits;
  }
  
  return phone;
};

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePlateNumber = (plate: string): boolean => {
  // Ethiopian plate format: AA-3-12345 or similar
  const regex = /^[A-Z]{1,3}-\d{1}-\d{5}$/i;
  return regex.test(plate);
};

export const STORAGE_KEYS = {
  SESSION: 'quickfuel_session',
  USERS: 'quickfuel_users',
  STATIONS: 'quickfuel_stations',
  RESERVATIONS: 'quickfuel_reservations',
  NOTIFICATIONS: 'quickfuel_notifications',
  FUEL_PRICES: 'quickfuel_fuel_prices',
  FUEL_ANALYTICS: 'quickfuel_fuel_analytics',
  QUEUE_REPORTS: 'quickfuel_queue_reports',
  SYSTEM_ACTIVITY: 'quickfuel_system_activity',
  REVIEWS: 'quickfuel_reviews',
  PAYMENT_TRANSACTIONS: 'quickfuel_payment_transactions',
};