// =====================================================
// OWNER DASHBOARD MAIN - NAVIGATION HUB
// =====================================================
// Main dashboard with quick access to all features
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Users, 
  Truck, 
  BarChart3, 
  Settings, 
  LogOut,
  TrendingUp,
  Fuel,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService, userService, inventoryService } from '../../lib/supabase/database';
import { deliveryService } from '../../lib/supabase/database-advanced';
import { notifyError } from '../../lib/utils/notifications';
import type { Station, User as UserType, StationFuelInventory, FuelDelivery } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

export function OwnerDashboardMain() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [operators, setOperators] = useState<UserType[]>([]);
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<FuelDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get owner's station
      const allStations = await stationService.getAllStations();
      const ownedStation = allStations.find((s) => s.owner_id === user.id);
      
      if (ownedStation) {
        setStation(ownedStation);
        
        // Load operators, inventory, and deliveries
        const [ops, inv, deliveries] = await Promise.all([
          userService.getStationOperators(ownedStation.id),
          inventoryService.getStationInventory(ownedStation.id),
          deliveryService.getStationDeliveries(ownedStation.id),
        ]);
        
        setOperators(ops);
        setInventory(inv);
        setPendingDeliveries(deliveries.filter((d) => d.status === 'pending'));
      }
    } catch (error) {
      notifyError('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">No station assigned to your account</p>
            <Button onClick={handleLogout}>Logout</Button>
          </Card>
        </div>
      </div>
    );
  }

  const lowStockCount = inventory.filter((inv) => inv.stock_status === 'low').length;
  const activeOperators = operators.filter((op) => op.operator_status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{station.name}</h1>
              <p className="text-sm text-gray-600">Station Owner Dashboard</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="size-8 text-blue-600" />
              {lowStockCount > 0 && <Badge className="bg-red-600">{lowStockCount}</Badge>}
            </div>
            <p className="text-2xl font-bold">{activeOperators}</p>
            <p className="text-sm text-gray-600">Active Operators</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Fuel className="size-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{inventory.length}</p>
            <p className="text-sm text-gray-600">Fuel Types</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Truck className="size-8 text-purple-600" />
              {pendingDeliveries.length > 0 && (
                <Badge className="bg-yellow-600">{pendingDeliveries.length}</Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{pendingDeliveries.length}</p>
            <p className="text-sm text-gray-600">Pending Deliveries</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="size-8 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold">
              {station.is_active ? 'Active' : 'Inactive'}
            </p>
            <p className="text-sm text-gray-600">Station Status</p>
          </Card>
        </div>

        {/* Alerts */}
        {lowStockCount > 0 && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <Fuel className="size-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Low Stock Alert!</p>
                <p className="text-sm text-red-800">
                  {lowStockCount} fuel type{lowStockCount !== 1 ? 's are' : ' is'} running low.
                </p>
              </div>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => navigate('/owner/request-delivery')}
              >
                Request Delivery
              </Button>
            </div>
          </Card>
        )}

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/owner/analytics')}
          >
            <BarChart3 className="size-12 mb-3 text-primary" />
            <h3 className="font-semibold text-lg mb-1">Analytics Dashboard</h3>
            <p className="text-sm text-gray-600">View revenue, reservations, and trends</p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/owner/operators')}
          >
            <Users className="size-12 mb-3 text-blue-600" />
            <h3 className="font-semibold text-lg mb-1">Manage Operators</h3>
            <p className="text-sm text-gray-600">Add, block, or remove operators</p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/owner/request-delivery')}
          >
            <Truck className="size-12 mb-3 text-purple-600" />
            <h3 className="font-semibold text-lg mb-1">Request Fuel Delivery</h3>
            <p className="text-sm text-gray-600">Submit delivery request for approval</p>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/owner/edit-station')}
          >
            <Settings className="size-12 mb-3 text-gray-600" />
            <h3 className="font-semibold text-lg mb-1">Station Settings</h3>
            <p className="text-sm text-gray-600">Edit operating hours and capacity</p>
          </Card>
        </div>

        {/* Quick Info */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Station Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Address</p>
              <p className="font-medium">{station.address}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone</p>
              <p className="font-medium">{station.phone}</p>
            </div>
            <div>
              <p className="text-gray-600">Operating Hours</p>
              <p className="font-medium">
                {station.is_24_hours ? '24 Hours' : `${station.opening_time} - ${station.closing_time}`}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Number of Pumps</p>
              <p className="font-medium">{station.number_of_pumps}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
