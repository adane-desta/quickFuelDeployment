import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService, inventoryService, userService } from '../../lib/supabase/database';
import { analyticsService, deliveryService, reservationService } from '../../lib/supabase/database-advanced';
import { supabase } from '../../lib/supabase/client';
import { Star, MessageSquare, FileText } from 'lucide-react';
import { notifyError, notifySuccess } from '../../lib/utils/notifications';
import type { Station, StationFuelInventory, User as UserType, Reservation, FuelDelivery } from '../../types/advanced';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Building2, MapPin, Phone, Clock, Calendar, Fuel, Users, DollarSign, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, XCircle, RefreshCw, Edit2, Save, X,
  Eye, Settings, User, Mail, Lock, Shield, Bell, Globe, LogOut, Trash2, Download,
  ChevronRight, Plus, Truck, BarChart3, Activity, Droplet, Gauge, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type DateRange = 'today' | 'week' | 'month';

interface DashboardStats {
  total_reservations: number;
  completed_reservations: number;
  cancelled_reservations: number;
  total_revenue: number;
  total_fuel_dispensed: number;
  average_rating: number;
  total_reviews: number;
}

export function OwnerDashboard() {
  const { user, updateUser } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [inventory, setInventory] = useState<StationFuelInventory[]>([]);
  const [operators, setOperators] = useState<UserType[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<FuelDelivery[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [editingStation, setEditingStation] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [stationForm, setStationForm] = useState<Partial<Station>>({});
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    business_license_number: user?.business_license_number || '',
    tax_identification_number: user?.tax_identification_number || '',
    business_address: user?.business_address || '',
  });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, dateRange]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get owner's stations
      const stationsData = await stationService.getOwnerStations(user.id);
      if (stationsData.length === 0) {
        setLoading(false);
        return;
      }
      const ownerStation = stationsData[0];
      setStation(ownerStation);
      setStationForm(ownerStation);

      // Load inventory
      const inventoryData = await inventoryService.getStationInventory(ownerStation.id);
      setInventory(inventoryData);

      // Load operators
      const operatorsData = await userService.getStationOperators(ownerStation.id);
      setOperators(operatorsData);

      // Load pending deliveries
      const deliveriesData = await deliveryService.getStationDeliveries(ownerStation.id);
      setPendingDeliveries(deliveriesData.filter(d => d.status === 'pending'));

      // Calculate date range
      const today = new Date();
      let startDate = new Date();
      let endDate = new Date();
      if (dateRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (dateRange === 'week') {
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate.setMonth(today.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // Fetch reservations
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('station_id', ownerStation.id)
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (resError) throw resError;

      // Fetch refund fees for the same period
      const { data: refundFees, error: feeError } = await supabase
        .from('station_refund_fees')
        .select('fee_amount, created_at')
        .eq('station_id', ownerStation.id)
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (feeError) {
        console.error('Error fetching refund fees:', feeError);
      }

      const totalRefundFees = refundFees?.reduce((sum, fee) => sum + (fee.fee_amount || 0), 0) || 0;

      const totalReservations = reservations.length;
      const completedReservations = reservations.filter(r => r.status === 'completed').length;
      const cancelledReservations = reservations.filter(r => r.status === 'cancelled' || r.status === 'expired').length;
      const completedReservationsRevenue = reservations.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.total_price || 0), 0);
      const totalRevenue = completedReservationsRevenue + totalRefundFees;
      const totalFuelDispensed = reservations.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.quantity || 0), 0);

      setStats({
        total_reservations: totalReservations,
        completed_reservations: completedReservations,
        cancelled_reservations: cancelledReservations,
        total_revenue: totalRevenue,
        total_fuel_dispensed: totalFuelDispensed,
        average_rating: ownerStation.average_rating || 0,
        total_reviews: ownerStation.total_reviews || 0,
      });
    } catch (error) {
      notifyError('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStation = async () => {
    if (!station) return;
    try {
      const { error } = await supabase
        .from('stations')
        .update(stationForm)
        .eq('id', station.id);
      if (error) throw error;
      setStation({ ...station, ...stationForm });
      notifySuccess('Station information updated');
      setEditingStation(false);
    } catch (error) {
      notifyError('Failed to update station', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          address: profileForm.address,
          business_license_number: profileForm.business_license_number,
          tax_identification_number: profileForm.tax_identification_number,
          business_address: profileForm.business_address,
        })
        .eq('id', user?.id);
      if (error) throw error;
      await updateUser(profileForm);
      notifySuccess('Profile updated');
      setEditingProfile(false);
    } catch (error) {
      notifyError('Failed to update profile', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new.length < 6) {
      notifyError('Password must be at least 6 characters');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      notifyError('Passwords do not match');
      return;
    }
    // Password update requires Supabase auth update
    const { error } = await supabase.auth.updateUser({ password: passwordData.new });
    if (error) {
      notifyError('Failed to update password', error);
    } else {
      notifySuccess('Password updated successfully');
      setShowChangePassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    }
  };

  const getStockPercentage = (current: number, max: number) => Math.min((current / max) * 100, 100);
  const getStockStatus = (current: number, min: number) => {
    if (current <= min) return { label: 'Low', color: 'text-red-600', bg: 'bg-red-100' };
    if (current <= min * 2) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <Building2 className="size-20 mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold mb-2">No Station Assigned</h3>
            <p className="text-gray-600 mb-4">You don't have any stations assigned to your account yet.</p>
            <p className="text-sm text-gray-500">Please contact the system administrator.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Station Owner Dashboard</h1>
            <p className="text-gray-600">Manage your station and track performance</p>
          </div>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Date Range Selector for Analytics */}
        <div className="flex justify-end">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="size-8 text-blue-600" />
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{stats?.total_reservations || 0}</p>
            <p className="text-sm text-gray-600">Total Reservations</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="size-8 text-green-600" />
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">ETB {(stats?.total_revenue || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Revenue</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Droplet className="size-8 text-blue-600" />
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{stats?.total_fuel_dispensed || 0} L</p>
            <p className="text-sm text-gray-600">Fuel Dispensed</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="size-8 text-purple-600" />
              <span className="text-sm font-medium">{operators.filter(o => o.operator_status === 'active').length} Active</span>
            </div>
            <p className="text-2xl font-bold">{operators.length}</p>
            <p className="text-sm text-gray-600">Total Operators</p>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="station">Station Info</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => window.location.href = '/station-owner/operators'}>
                <Users className="size-6 text-blue-600" />
                <span className="text-xs">Manage Operators</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => window.location.href = '/station-owner/deliveries'}>
                <Truck className="size-6 text-purple-600" />
                <span className="text-xs">Request Fuel</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => window.location.href = '/station-owner/reservations'}>
                <Calendar className="size-6 text-green-600" />
                <span className="text-xs">View Reservations</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => window.location.href = '/station-owner/analytics'}>
                <BarChart3 className="size-6 text-orange-600" />
                <span className="text-xs">Analytics</span>
              </Button>
            </div>

            {/* Alerts */}
            {(pendingDeliveries.length > 0 || inventory.some(i => i.stock_status === 'low')) && (
              <div className="space-y-3">
                {pendingDeliveries.length > 0 && (
                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="size-6 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-900">Pending Deliveries</p>
                        <p className="text-sm text-yellow-800">{pendingDeliveries.length} delivery request(s) awaiting admin approval.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.location.href = '/station-owner/deliveries'}>View</Button>
                    </div>
                  </Card>
                )}
                {inventory.some(i => i.stock_status === 'low') && (
                  <Card className="p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="size-6 text-red-600" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900">Low Fuel Stock</p>
                        <p className="text-sm text-red-800">Some fuel types are running low. Please request a delivery.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.location.href = '/station-owner/deliveries'}>Request</Button>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Performance Metrics */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="size-5 text-primary" />
                <h3 className="font-semibold text-lg">Performance Overview ({dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month'})</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="size-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{stats?.completed_reservations || 0}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="size-8 mx-auto mb-2 text-red-600" />
                  <p className="text-2xl font-bold">{stats?.cancelled_reservations || 0}</p>
                  <p className="text-sm text-gray-600">Cancelled/Expired</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Star className="size-8 mx-auto mb-2 text-yellow-600" />
                  <p className="text-2xl font-bold">{stats?.average_rating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <MessageSquare className="size-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{stats?.total_reviews}</p>
                  <p className="text-sm text-gray-600">Reviews</p>
                </div>
              </div>
            </Card>

            {/* Fuel Inventory Summary */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Fuel className="size-5 text-primary" />
                  <h3 className="font-semibold text-lg">Fuel Inventory Summary</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => document.querySelector('[data-value="inventory"]')?.click()}>View All</Button>
              </div>
              {inventory.length === 0 ? (
                <div className="text-center py-8">
                  <Fuel className="size-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No fuel inventory configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inventory.slice(0, 3).map(item => {
                    const percentage = getStockPercentage(item.current_stock, item.maximum_capacity);
                    const status = getStockStatus(item.current_stock, item.minimum_stock_threshold);
                    return (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.fuel_type_name}</p>
                            <p className="text-xs text-gray-500">{item.current_stock.toLocaleString()} / {item.maximum_capacity.toLocaleString()} L</p>
                          </div>
                          <Badge className={status.bg + ' ' + status.color}>{status.label}</Badge>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                  {inventory.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">+{inventory.length - 3} more fuel types</p>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Full Fuel Inventory</h3>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/station-owner/deliveries'}>Request Delivery</Button>
              </div>
              {inventory.length === 0 ? (
                <div className="text-center py-12">
                  <Fuel className="size-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No fuel inventory configured for this station.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {inventory.map(item => {
                    const percentage = getStockPercentage(item.current_stock, item.maximum_capacity);
                    const status = getStockStatus(item.current_stock, item.minimum_stock_threshold);
                    return (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg">{item.fuel_type_name}</h4>
                            <p className="text-xs text-gray-500">{item.fuel_type_code}</p>
                          </div>
                          <Badge className={status.bg + ' ' + status.color}>{status.label}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Current Stock</span>
                            <span className="font-medium">{item.current_stock.toLocaleString()} L</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-500">Min Threshold:</span> {item.minimum_stock_threshold.toLocaleString()} L</div>
                            <div><span className="text-gray-500">Max Capacity:</span> {item.maximum_capacity.toLocaleString()} L</div>
                            <div><span className="text-gray-500">Price/L:</span> ETB {item.effective_price?.toFixed(2)}</div>
                            <div><span className="text-gray-500">Status:</span> {item.is_available ? 'Available' : 'Unavailable'}</div>
                          </div>
                          {item.stock_status === 'low' && (
                            <div className="mt-2 p-2 bg-red-50 rounded-lg text-red-700 text-sm flex items-center gap-2">
                              <AlertTriangle className="size-4" /> Below minimum threshold
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Station Info Tab */}
          <TabsContent value="station" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Station Information</h3>
                {!editingStation ? (
                  <Button variant="outline" size="sm" onClick={() => setEditingStation(true)}>
                    <Edit2 className="size-4 mr-1" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingStation(false)}><X className="size-4" /> Cancel</Button>
                    <Button variant="default" size="sm" onClick={handleSaveStation}><Save className="size-4 mr-1" /> Save</Button>
                  </div>
                )}
              </div>
              {!editingStation ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3"><Building2 className="size-5 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{station?.name}</p></div></div>
                  <div className="flex items-start gap-3"><MapPin className="size-5 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Address</p><p className="font-medium">{station.address}</p></div></div>
                  <div className="flex items-start gap-3"><Phone className="size-5 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{station.phone}</p></div></div>
                  <div className="flex items-start gap-3"><Clock className="size-5 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Operating Hours</p><p className="font-medium">{station.is_24_hours ? '24/7' : `${station.opening_time} - ${station.closing_time}`}</p></div></div>
                  <div className="flex items-start gap-3"><Calendar className="size-5 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Operating Days</p><p className="font-medium">{station.operating_days?.join(', ')}</p></div></div>
                  <div className="flex items-start gap-3"><Fuel className="size-5 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Number of Pumps</p><p className="font-medium">{station.number_of_pumps}</p></div></div>
                  <div className="flex items-start gap-3"><FileText className="size-5 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-500">Business License</p><p className="font-medium">{station.business_license_number}</p></div></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div><Label>Station Name</Label><Input value={stationForm?.name || ''} onChange={e => setStationForm({...stationForm, name: e.target.value})} /></div>
                  <div><Label>Address</Label><Input value={stationForm.address || ''} onChange={e => setStationForm({...stationForm, address: e.target.value})} /></div>
                  <div><Label>Phone</Label><Input value={stationForm.phone || ''} onChange={e => setStationForm({...stationForm, phone: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Opening Time</Label><Input type="time" value={stationForm.opening_time?.slice(0,5) || '06:00'} onChange={e => setStationForm({...stationForm, opening_time: e.target.value})} /></div>
                    <div><Label>Closing Time</Label><Input type="time" value={stationForm.closing_time?.slice(0,5) || '22:00'} onChange={e => setStationForm({...stationForm, closing_time: e.target.value})} /></div>
                  </div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={stationForm.is_24_hours || false} onChange={e => setStationForm({...stationForm, is_24_hours: e.target.checked})} /> <Label>24/7 Operation</Label></div>
                  <div><Label>Number of Pumps</Label><Input type="number" value={stationForm.number_of_pumps || 0} onChange={e => setStationForm({...stationForm, number_of_pumps: parseInt(e.target.value)})} /></div>
                  <div><Label>Business License Number</Label><Input value={stationForm.business_license_number || ''} onChange={e => setStationForm({...stationForm, business_license_number: e.target.value})} /></div>
                </div>
              )}
            </Card>

            {/* Operators Section */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Station Operators</h3>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/station-owner/operators'}>
                  <Plus className="size-4 mr-1" /> Manage
                </Button>
              </div>
              {operators.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No operators assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {operators.slice(0, 5).map(op => (
                    <div key={op.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div><p className="font-medium">{op.full_name}</p><p className="text-xs text-gray-500">{op.email}</p></div>
                      <Badge className={op.operator_status === 'active' ? 'bg-green-600' : 'bg-red-600'}>{op.operator_status}</Badge>
                    </div>
                  ))}
                  {operators.length > 5 && <p className="text-sm text-gray-500 text-center">+{operators.length - 5} more operators</p>}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Owner Profile</h3>
                {!editingProfile ? (
                  <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                    <Edit2 className="size-4 mr-1" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)}><X className="size-4" /> Cancel</Button>
                    <Button variant="default" size="sm" onClick={handleSaveProfile}><Save className="size-4 mr-1" /> Save</Button>
                  </div>
                )}
              </div>
              {!editingProfile ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3"><User className="size-5 text-gray-400" /><div><p className="text-xs text-gray-500">Full Name</p><p className="font-medium">{user?.full_name}</p></div></div>
                  <div className="flex items-start gap-3"><Mail className="size-5 text-gray-400" /><div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{user?.email}</p></div></div>
                  <div className="flex items-start gap-3"><Phone className="size-5 text-gray-400" /><div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{user?.phone}</p></div></div>
                  <div className="flex items-start gap-3"><MapPin className="size-5 text-gray-400" /><div><p className="text-xs text-gray-500">Address</p><p className="font-medium">{user?.address || 'Not set'}</p></div></div>
                  <div className="flex items-start gap-3"><FileText className="size-5 text-gray-400" /><div><p className="text-xs text-gray-500">Business License</p><p className="font-medium">{user?.business_license_number}</p></div></div>
                  <div className="flex items-start gap-3"><FileText className="size-5 text-gray-400" /><div><p className="text-xs text-gray-500">Tax ID</p><p className="font-medium">{user?.tax_identification_number || 'Not set'}</p></div></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div><Label>Full Name</Label><Input value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} /></div>
                  <div><Label>Email</Label><Input value={profileForm.email} disabled /></div>
                  <div><Label>Phone</Label><Input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} /></div>
                  <div><Label>Address</Label><Input value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} /></div>
                  <div><Label>Business License Number</Label><Input value={profileForm.business_license_number} onChange={e => setProfileForm({...profileForm, business_license_number: e.target.value})} /></div>
                  <div><Label>Tax Identification Number</Label><Input value={profileForm.tax_identification_number} onChange={e => setProfileForm({...profileForm, tax_identification_number: e.target.value})} /></div>
                  <div><Label>Business Address</Label><Input value={profileForm.business_address} onChange={e => setProfileForm({...profileForm, business_address: e.target.value})} /></div>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-lg mb-4">Security</h3>
              <Button variant="outline" onClick={() => setShowChangePassword(true)} className="w-full justify-start">
                <Lock className="size-4 mr-2" /> Change Password
              </Button>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-lg mb-4">Danger Zone</h3>
              <Button variant="destructive" onClick={() => {/* logout or delete account */}} className="w-full justify-start">
                <LogOut className="size-4 mr-2" /> Sign Out
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Change Password</h3>
              <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="size-5" /></button>
            </div>
            <div className="space-y-4">
              <div><Label>Current Password</Label><Input type="password" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} /></div>
              <div><Label>New Password</Label><Input type="password" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} /></div>
              <div><Label>Confirm New Password</Label><Input type="password" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} /></div>
              <Button onClick={handleChangePassword} className="w-full">Update Password</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}