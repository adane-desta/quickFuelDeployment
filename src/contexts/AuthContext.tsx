import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { db } from '../lib/supabase/services';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load user profile', {
          description: error.message,
        });
        return null;
      }

      if (!data) {
        toast.error('User profile not found', {
          description: 'Please contact administrator',
        });
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile', {
        description: error.message || 'Unknown error',
      });
      return null;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user);
          setUser(profile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchUserProfile(session.user);
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const profile = await fetchUserProfile(session.user);
        setUser(profile);
      } else if (event === 'USER_UPDATED' && session?.user) {
        const profile = await fetchUserProfile(session.user);
        setUser(profile);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // Validate inputs
      if (!email || !password) {
        toast.error('Missing credentials', {
          description: 'Please enter both email and password',
        });
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid credentials', {
            description: 'Please check your email and password',
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Email not confirmed', {
            description: 'Please verify your email address',
          });
        } else {
          toast.error('Login failed', {
            description: error.message,
          });
        }
        return false;
      }

      if (!data.user) {
        toast.error('Login failed', {
          description: 'No user data returned',
        });
        return false;
      }

      const profile = await fetchUserProfile(data.user);
      
      if (!profile) {
        // Sign out if profile fetch fails
        await supabase.auth.signOut();
        return false;
      }

      setUser(profile);
      
      toast.success('Login successful', {
        description: `Welcome back, ${profile.fullName}!`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: error.message || 'An unexpected error occurred',
      });
      return false;
    }
  }, []);

  const register = useCallback(async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    try {
      const { email, password, fullName, phone, role, ...extra } = userData;
      const result = await db.users.createUserViaEdge({
        email: email!,
        password,
        full_name: fullName!,
        phone: phone!,
        role: role || 'driver',
        address: extra.address,
        vehicle_model: extra.vehicleModel,
        plate_number: extra.plateNumber,
        preferred_fuel_type: extra.preferredFuelType,
        license_number: extra.licenseNumber,
        ...(role === 'operator' && { station_id: extra.stationId }),
        ...(role === 'station_owner' && { business_license_number: extra.businessLicenseNumber }),
      });
      if (result.success) {
        toast.success('Registration successful! Please login.');
        return true;
      }
      throw new Error(result.error);
    } catch (error: any) {
      toast.error('Registration failed', { description: error.message });
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Logout failed', {
          description: error.message,
        });
        return;
      }
      
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Logout failed', {
        description: error.message || 'An unexpected error occurred',
      });
    }
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) {
      toast.error('Not authenticated', {
        description: 'Please login first',
      });
      return;
    }

    try {
      // Map camelCase to snake_case for database
      const dbData: any = {};
      if (data.fullName !== undefined) dbData.full_name = data.fullName;
      if (data.phone !== undefined) dbData.phone = data.phone;
      if (data.address !== undefined) dbData.address = data.address;
      if (data.vehicleModel !== undefined) dbData.vehicle_model = data.vehicleModel;
      if (data.plateNumber !== undefined) dbData.plate_number = data.plateNumber?.toUpperCase();
      if (data.preferredFuelType !== undefined) dbData.preferred_fuel_type = data.preferredFuelType;
      if (data.licenseNumber !== undefined) dbData.license_number = data.licenseNumber?.toUpperCase();
      if (data.stationId !== undefined) dbData.station_id = data.stationId;          // for operator
      if (data.businessLicense !== undefined) dbData.business_license_number = data.businessLicense;
      if (data.department !== undefined) dbData.department = data.department;

      const { error } = await supabase
        .from('users')
        .update(dbData)
        .eq('id', user.id);

      if (error) {
        toast.error('Update failed', {
          description: error.message,
        });
        return;
      }

      // Update local state
      setUser(prev => prev ? { ...prev, ...data } : null);
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Update user error:', error);
      toast.error('Update failed', {
        description: error.message || 'An unexpected error occurred',
      });
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}