# Integration Guide: Supabase Database Layer

This guide explains how the QuickFuel application integrates with Supabase and how to use the data services throughout the application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   React Components                      │
│  (Admin, Driver, Operator dashboards, etc.)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              AuthContext & Services                     │
│  (Authentication, Data Services Layer)                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Supabase Client (Mock/Real)                  │
│  • Auto-detects mode based on .env                     │
│  • Mock: Uses localStorage                             │
│  • Real: Uses PostgreSQL via Supabase                  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴───────────┐
        │                        │
┌───────▼──────┐        ┌────────▼────────┐
│  localStorage│        │    Supabase     │
│  (Mock Mode) │        │   PostgreSQL    │
└──────────────┘        └─────────────────┘
```

## Core Components

### 1. Configuration (`/lib/supabase/config.ts`)

Handles environment configuration and mode detection:

```typescript
import { supabaseConfig, isMockMode, STORAGE_KEYS } from './lib/supabase/config';

// Check current mode
if (isMockMode) {
  console.log('Running in mock mode');
} else {
  console.log('Running in production mode with Supabase');
}
```

### 2. Storage Layer (`/lib/supabase/storage.ts`)

Provides localStorage abstraction for mock mode:

```typescript
import { LocalStorage } from './lib/supabase/storage';

// Get data
const users = LocalStorage.getArray('quickfuel_users');

// Add item
LocalStorage.addToArray('quickfuel_users', newUser);

// Update item
LocalStorage.updateInArray('quickfuel_users', userId, updates);

// Query items
const activeUsers = LocalStorage.queryArray('quickfuel_users', 
  user => user.isActive === true
);
```

### 3. Supabase Client (`/lib/supabase/client.ts`)

Unified client that works in both modes:

```typescript
import { supabase } from './lib/supabase/client';

// Authentication
const { user, error } = await supabase.auth.signIn(email, password);

// Database operations
const { data, error } = await supabase.from('stations').select('*');

// Real-time subscriptions
supabase
  .channel('reservations')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'reservations'
  }, (payload) => {
    console.log('New reservation:', payload.new);
  })
  .subscribe();
```

### 4. Data Services (`/lib/supabase/services.ts`)

High-level API for data operations:

```typescript
import { db } from './lib/supabase/services';

// Users
const allUsers = await db.users.getAll();
const drivers = await db.users.getByRole('driver');
await db.users.update(userId, { isActive: false });

// Stations
const allStations = await db.stations.getAll();
const verifiedStations = await db.stations.getVerified();
await db.stations.updateStock(stationId, 5000, 3000);

// Reservations
const driverReservations = await db.reservations.getByDriver(driverId);
await db.reservations.complete(reservationId, operatorId);

// Fuel Prices
const currentPrices = await db.fuelPrices.getCurrent();
await db.fuelPrices.update(priceId, { pricePerLiter: 65.50 });

// Analytics
const analytics = await db.fuelAnalytics.getAll();
const stationAnalytics = await db.fuelAnalytics.getByStation(stationId);
```

## Using Data Services in Components

### Example 1: Fetching Data in a Component

```typescript
import { useEffect, useState } from 'react';
import { db } from './lib/supabase/services';
import { Station } from './types';

export function StationList() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStations() {
      try {
        const data = await db.stations.getVerified();
        setStations(data);
      } catch (error) {
        console.error('Error loading stations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStations();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {stations.map(station => (
        <div key={station.id}>{station.name}</div>
      ))}
    </div>
  );
}
```

### Example 2: Creating Data

```typescript
import { db } from './lib/supabase/services';
import { toast } from 'sonner@2.0.3';

async function createReservation(data) {
  try {
    const reservation = await db.reservations.create({
      driverId: user.id,
      driverName: user.fullName,
      driverPhone: user.phone,
      stationId: data.station.id,
      stationName: data.station.name,
      date: data.date,
      timeSlot: data.timeSlot,
      fuelType: data.fuelType,
      quantity: data.quantity,
      totalCost: data.quantity * fuelPrice,
      status: 'confirmed',
      paymentMethod: data.paymentMethod,
      distance: data.station.distance,
      plateNumber: user.plateNumber,
    });

    toast.success('Reservation created successfully!');
    return reservation;
  } catch (error) {
    toast.error('Failed to create reservation');
    console.error(error);
  }
}
```

### Example 3: Real-time Updates

```typescript
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase/client';
import { Reservation } from './types';

export function LiveReservations({ stationId }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    // Initial fetch
    async function loadReservations() {
      const data = await db.reservations.getByStation(stationId);
      setReservations(data);
    }
    loadReservations();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`station-${stationId}-reservations`)
      .on('postgres_changes', {
        event: '*', // Listen to all events
        schema: 'public',
        table: 'reservations',
        filter: `station_id=eq.${stationId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setReservations(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setReservations(prev =>
            prev.map(r => r.id === payload.new.id ? payload.new : r)
          );
        } else if (payload.eventType === 'DELETE') {
          setReservations(prev =>
            prev.filter(r => r.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [stationId]);

  return (
    <div>
      {reservations.map(reservation => (
        <ReservationCard key={reservation.id} reservation={reservation} />
      ))}
    </div>
  );
}
```

## Authentication Flow

### Login Flow

```typescript
import { useAuth } from './contexts/AuthContext';

function LoginPage() {
  const { login } = useAuth();

  async function handleLogin(email, password, role) {
    const success = await login(email, password, role);
    
    if (success) {
      // Redirect to dashboard based on role
      if (role === 'driver') navigate('/driver/dashboard');
      if (role === 'operator') navigate('/operator/dashboard');
      if (role === 'admin') navigate('/admin/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  }

  return (
    // ... login form
  );
}
```

### Registration Flow

```typescript
import { useAuth } from './contexts/AuthContext';

function RegisterPage() {
  const { register } = useAuth();

  async function handleRegister(userData) {
    const success = await register({
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      phone: userData.phone,
      role: 'driver',
      vehicleModel: userData.vehicleModel,
      plateNumber: userData.plateNumber,
      // ... other fields
    });

    if (success) {
      toast.success('Registration successful!');
      navigate('/driver/dashboard');
    } else {
      toast.error('Registration failed');
    }
  }

  return (
    // ... registration form
  );
}
```

### Protected Routes

```typescript
import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Usage
<Route path="/admin/*" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminLayout />
  </ProtectedRoute>
} />
```

## Data Validation

### Client-side Validation

```typescript
import { z } from 'zod';

const ReservationSchema = z.object({
  fuelType: z.enum(['Petrol', 'Diesel']),
  quantity: z.number().min(1).max(100),
  date: z.string().refine(date => new Date(date) >= new Date()),
  // ... other fields
});

function validateReservation(data) {
  try {
    return ReservationSchema.parse(data);
  } catch (error) {
    toast.error('Invalid reservation data');
    return null;
  }
}
```

### Database Constraints

The database schema includes constraints:
- NOT NULL constraints for required fields
- CHECK constraints for valid ranges
- UNIQUE constraints for unique values
- FOREIGN KEY constraints for referential integrity

These are automatically enforced by PostgreSQL.

## Error Handling

### Standard Error Handling Pattern

```typescript
import { toast } from 'sonner@2.0.3';

async function performDatabaseOperation() {
  try {
    const result = await db.stations.create(stationData);
    toast.success('Operation successful');
    return result;
  } catch (error) {
    // Log error for debugging
    console.error('Database error:', error);
    
    // Show user-friendly message
    if (error.message.includes('duplicate')) {
      toast.error('This record already exists');
    } else if (error.message.includes('permission')) {
      toast.error('You don\'t have permission to perform this action');
    } else {
      toast.error('An error occurred. Please try again.');
    }
    
    return null;
  }
}
```

## Performance Optimization

### 1. Pagination

```typescript
async function getReservationsPaginated(page = 1, pageSize = 20) {
  if (isMockMode) {
    const all = LocalStorage.getArray(STORAGE_KEYS.RESERVATIONS);
    const start = (page - 1) * pageSize;
    return all.slice(start, start + pageSize);
  }
  
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .range((page - 1) * pageSize, page * pageSize - 1);
  
  if (error) throw error;
  return data;
}
```

### 2. Caching

```typescript
import { useState, useEffect } from 'react';

const cache = new Map();

function useCachedData(key, fetchFn, ttl = 60000) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttl) {
      setData(cached.data);
      return;
    }

    fetchFn().then(result => {
      cache.set(key, { data: result, timestamp: now });
      setData(result);
    });
  }, [key, fetchFn, ttl]);

  return data;
}
```

### 3. Optimistic Updates

```typescript
async function updateReservationStatus(id, newStatus) {
  // Optimistically update UI
  setReservations(prev =>
    prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
  );

  try {
    // Update database
    await db.reservations.updateStatus(id, newStatus);
  } catch (error) {
    // Revert on error
    const original = await db.reservations.getById(id);
    setReservations(prev =>
      prev.map(r => r.id === id ? original : r)
    );
    toast.error('Update failed');
  }
}
```

## Testing

### Mock Mode Testing

```typescript
// In your test file
import { LocalStorage } from './lib/supabase/storage';
import { STORAGE_KEYS } from './lib/supabase/config';

beforeEach(() => {
  // Clear mock data
  LocalStorage.clearAll();
  
  // Seed test data
  LocalStorage.set(STORAGE_KEYS.USERS, testUsers);
  LocalStorage.set(STORAGE_KEYS.STATIONS, testStations);
});

test('should create reservation', async () => {
  const reservation = await db.reservations.create(testReservationData);
  expect(reservation).toBeDefined();
  expect(reservation.status).toBe('confirmed');
});
```

### Integration Testing with Supabase

```typescript
// Set up test database
beforeAll(async () => {
  // Create test project in Supabase
  // Or use test schema
});

afterAll(async () => {
  // Clean up test data
  await supabase.from('reservations').delete().neq('id', '');
});

test('should sync data across clients', async () => {
  // Create subscription
  const updates = [];
  supabase.channel('test').on('postgres_changes', 
    { event: '*', schema: 'public', table: 'stations' },
    (payload) => updates.push(payload)
  ).subscribe();

  // Make change
  await db.stations.update('test-id', { petrolStock: 5000 });

  // Wait for real-time update
  await new Promise(resolve => setTimeout(resolve, 1000));

  expect(updates.length).toBeGreaterThan(0);
});
```

## Best Practices

### 1. Always Use Service Layer

❌ Don't:
```typescript
const { data } = await supabase.from('users').select('*');
```

✅ Do:
```typescript
const users = await db.users.getAll();
```

### 2. Handle Loading States

```typescript
function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await db.stations.getAll();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <DataDisplay data={data} />;
}
```

### 3. Clean Up Subscriptions

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('my-channel')
    .on('postgres_changes', config, handler)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 4. Type Safety

```typescript
import { Station, Reservation } from './types';

async function getStation(id: string): Promise<Station | null> {
  return await db.stations.getById(id);
}

async function createReservation(
  data: Omit<Reservation, 'id' | 'pickupCode' | 'qrCode'>
): Promise<Reservation> {
  return await db.reservations.create(data);
}
```

## Migration Checklist

When migrating from mock to production:

- [ ] Supabase project created
- [ ] Database schema applied
- [ ] .env file configured
- [ ] Authentication tested
- [ ] Data operations tested
- [ ] Real-time subscriptions working
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Type safety verified
- [ ] Performance optimized

## Troubleshooting

### "Service not found"
- Verify imports: `import { db } from './lib/supabase/services'`
- Check file paths are correct

### "Cannot read property of undefined"
- Check if data is loaded before accessing
- Add loading states
- Use optional chaining: `data?.property`

### "RLS policy violation"
- Verify user is authenticated
- Check user role matches policy requirements
- Review RLS policies in Supabase dashboard

### Real-time not working
- Check subscription is active
- Verify RLS allows SELECT on table
- Check network tab for WebSocket connection

---

**Need more help?**  
- Review DATABASE_SETUP.md for database issues
- Check MIGRATION_GUIDE.md for switching modes
- See README.md for project overview
