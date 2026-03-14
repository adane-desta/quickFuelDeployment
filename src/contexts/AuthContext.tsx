import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

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

// Map database fields (snake_case) to TypeScript fields (camelCase)
const mapDatabaseUserToUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    fullName: dbUser.full_name || '',
    email: dbUser.email || '',
    phone: dbUser.phone || '',
    role: dbUser.role as UserRole,
    address: dbUser.address || '',
    joinedDate: dbUser.created_at ? new Date(dbUser.created_at).toLocaleDateString() : '',
    isActive: dbUser.is_active ?? true,
    // Driver fields
    vehicleModel: dbUser.vehicle_model,
    plateNumber: dbUser.plate_number,
    preferredFuelType: dbUser.preferred_fuel_type,
    licenseNumber: dbUser.license_number,
    // Operator fields
    stationId: dbUser.station_id,
    stationName: dbUser.station_name,
    businessLicense: dbUser.business_license,
    // Admin fields
    employeeId: dbUser.employee_id,
    department: dbUser.department,
  };
};

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

      return mapDatabaseUserToUser(data);
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
      const { email, password, ...profileData } = userData;

      // Validate required fields
      if (!email || !password) {
        toast.error('Missing required fields', {
          description: 'Email and password are required',
        });
        return false;
      }

      if (password.length < 8) {
        toast.error('Weak password', {
          description: 'Password must be at least 8 characters',
        });
        return false;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Email already registered', {
            description: 'Please use a different email or login',
          });
        } else {
          toast.error('Registration failed', {
            description: authError.message,
          });
        }
        return false;
      }

      if (!authData.user) {
        toast.error('Registration failed', {
          description: 'No user data returned',
        });
        return false;
      }

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        full_name: profileData.fullName?.trim() || '',
        phone: profileData.phone?.trim() || '',
        role: profileData.role || 'driver',
        address: profileData.address?.trim() || '',
        is_active: true,
        // Driver fields
        vehicle_model: profileData.vehicleModel?.trim(),
        plate_number: profileData.plateNumber?.trim().toUpperCase(),
        preferred_fuel_type: profileData.preferredFuelType,
        license_number: profileData.licenseNumber?.trim().toUpperCase(),
        // Operator fields (shouldn't be set during driver registration)
        station_id: profileData.stationId,
        station_name: profileData.stationName,
        business_license: profileData.businessLicense,
        // Admin fields (shouldn't be set during driver registration)
        employee_id: profileData.employeeId,
        department: profileData.department,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // Note: Can't delete auth user with anon key
        // The auth user will remain but without a profile
        // Admin will need to clean up manually if needed
        
        toast.error('Profile creation failed', {
          description: profileError.message || 'Please try again',
        });
        return false;
      }

      // Fetch the created profile
      const profile = await fetchUserProfile(authData.user);
      
      if (profile) {
        setUser(profile);
        toast.success('Registration successful!', {
          description: 'Welcome to QuickFuel',
        });
      } else {
        toast.warning('Registration completed', {
          description: 'Please login to continue',
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Registration failed', {
        description: error.message || 'An unexpected error occurred',
      });
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
      if (data.stationName !== undefined) dbData.station_name = data.stationName;
      if (data.businessLicense !== undefined) dbData.business_license = data.businessLicense;
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