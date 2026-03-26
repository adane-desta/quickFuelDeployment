// =====================================================
// STATION OWNER DASHBOARD - COMPLETE
// =====================================================
// Real-time dashboard with fuel inventory, analytics,
// operator management, and delivery tracking
// =====================================================
// fRAnjhTNDnmu


import React, { useState, useEffect } from 'react';
import {
  Fuel,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Package,
  DollarSign,
  Activity,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService, inventoryService } from '../../lib/supabase/database';
import { analyticsService, deliveryService } from '../../lib/supabase/database-advanced';
import { notifyError } from '../../lib/utils/notifications';
import type { Station, StationFuelInventory, FuelDelivery, StationDashboardOverview } from '../../types/advanced';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';

export function OwnerDashboard() {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [dashboard, setDashboard] = useState<StationDashboardOverview | null>(null);
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
  const [deliveries, setDeliveries] = useState<FuelDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOwnerData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStation) {
      loadStationDetails();
    }
  }, [selectedStation]);

  const loadOwnerData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const stationsData = await stationService.getOwnerStations(user.id);
      setStations(stationsData);

      if (stationsData.length > 0 && !selectedStation) {
        setSelectedStation(stationsData[0]);
      }
    } catch (error) {
      notifyError('Failed to load stations', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStationDetails = async () => {
    if (!selectedStation) return;

    try {
      const [dashboardData, inventoryData, deliveriesData] = await Promise.all([
        analyticsService.getStationDashboard(selectedStation.id),
        inventoryService.getStationInventory(selectedStation.id),
        deliveryService.getStationDeliveries(selectedStation.id),
      ]);

      setDashboard(dashboardData);
      setInventory(inventoryData);
      setDeliveries(deliveriesData.slice(0, 10)); // Last 10 deliveries
    } catch (error) {
      notifyError('Failed to load station details', error);
    }
  };

  const getInventoryStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return 'text-red-600 bg-red-50';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50';
      case 'good':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Package className="size-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Stations Assigned</h3>
          <p className="text-gray-600 mb-4">
            You don't have any stations assigned to your account yet.
          </p>
          <p className="text-sm text-gray-500">
            Please contact the system administrator.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Station Dashboard</h1>
        <p className="text-gray-600">Manage your fuel station and monitor performance</p>
      </div>

      {/* Station Selector (if multiple stations) */}
      {stations.length > 1 && (
        <Card className="p-4">
          <label className="text-sm font-medium mb-2 block">Select Station</label>
          <select
            value={selectedStation?.id || ''}
            onChange={(e) => {
              const station = stations.find((s) => s.id === e.target.value);
              setSelectedStation(station || null);
            }}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        </Card>
      )}

      {selectedStation && (
        <>
          {/* Station Info */}
          <Card className="p-4 md:p-6 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-1">{selectedStation.name}</h2>
                <p className="text-sm text-gray-600 mb-2">{selectedStation.address}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStation.is_verified && (
                    <Badge className="bg-green-600">
                      <CheckCircle className="size-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {selectedStation.is_active ? (
                    <Badge className="bg-blue-600">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Badge variant="outline">
                    {selectedStation.number_of_pumps} Pumps
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Key Metrics */}
          {dashboard && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Today's Revenue */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="size-8 text-green-600" />
                  <Badge className="bg-green-600">Today</Badge>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ETB {dashboard.today_revenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Today's Revenue</p>
              </Card>

              {/* Today's Reservations */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="size-8 text-blue-600" />
                  <Badge className="bg-blue-600">Today</Badge>
                </div>
                <p className="text-2xl font-bold">{dashboard.today_reservations}</p>
                <p className="text-sm text-gray-600">Total Reservations</p>
                <p className="text-xs text-green-600 mt-1">
                  {dashboard.today_completed} completed
                </p>
              </Card>

              {/* Active Reservations */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="size-8 text-orange-600" />
                  <Badge className="bg-orange-600">Live</Badge>
                </div>
                <p className="text-2xl font-bold">{dashboard.active_reservations}</p>
                <p className="text-sm text-gray-600">Active Now</p>
              </Card>

              {/* Station Rating */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="size-8 text-yellow-600" />
                  <Badge className="bg-yellow-600">Rating</Badge>
                </div>
                <p className="text-2xl font-bold">{dashboard.average_rating.toFixed(1)} / 5.0</p>
                <p className="text-sm text-gray-600">{dashboard.total_reviews} reviews</p>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inventory">
                <Fuel className="size-4 mr-2" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="deliveries">
                <Package className="size-4 mr-2" />
                Deliveries
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <TrendingUp className="size-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Fuel Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Fuel Inventory</h3>
                <Button size="sm">Request Delivery</Button>
              </div>

              {inventory.length === 0 ? (
                <Card className="p-8 text-center">
                  <Fuel className="size-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No fuel inventory configured</p>
                  <Button variant="link" className="mt-2">Add Fuel Types</Button>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {inventory.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{item.fuel_type_name}</h4>
                          <p className="text-sm text-gray-500">{item.fuel_type_code}</p>
                        </div>
                        <Badge className={getInventoryStatusColor(item.stock_status!)}>
                          {item.stock_status?.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Stock Level */}
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current Stock</span>
                          <span className="font-medium">
                            {item.current_stock.toLocaleString()}L
                          </span>
                        </div>
                        <Progress 
                          value={getStockPercentage(item.current_stock, item.maximum_capacity)} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Min: {item.minimum_stock_threshold}L</span>
                          <span>Max: {item.maximum_capacity}L</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-gray-600">Price/Liter</span>
                        <span className="font-semibold text-green-600">
                          ETB {item.effective_price?.toFixed(2)}
                        </span>
                      </div>

                      {/* Alert for low stock */}
                      {item.stock_status === 'low' && (
                        <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="size-4 text-red-600" />
                          <span className="text-xs text-red-700">Low stock - Request delivery</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Deliveries Tab */}
            <TabsContent value="deliveries" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Fuel Deliveries</h3>
                <Button size="sm">New Request</Button>
              </div>

              {deliveries.length === 0 ? (
                <Card className="p-8 text-center">
                  <Package className="size-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No delivery records</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <Card key={delivery.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{delivery.fuel_type_name}</p>
                          <p className="text-sm text-gray-500">{delivery.delivery_reference}</p>
                        </div>
                        <Badge
                          className={
                            delivery.status === 'delivered'
                              ? 'bg-green-600'
                              : delivery.status === 'approved'
                              ? 'bg-blue-600'
                              : delivery.status === 'rejected'
                              ? 'bg-red-600'
                              : 'bg-yellow-600'
                          }
                        >
                          {delivery.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Quantity:</span>
                          <span className="ml-2 font-medium">{delivery.quantity}L</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Supplier:</span>
                          <span className="ml-2 font-medium">{delivery.supplier_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Expected:</span>
                          <span className="ml-2 font-medium">
                            {delivery.expected_delivery_date ? 
                              new Date(delivery.expected_delivery_date).toLocaleDateString() : 
                              'N/A'
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Requested:</span>
                          <span className="ml-2 font-medium">
                            {new Date(delivery.requested_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {delivery.status === 'approved' && (
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          Mark as Delivered
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <Card className="p-8 text-center">
                <BarChart3 className="size-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  Detailed charts and reports coming soon
                </p>
                <Button variant="outline">View Full Report</Button>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
