// =====================================================
// CREATE STATION ADVANCED - ADMIN COMPONENT
// =====================================================
// Complete station registration with owner assignment
// Sets up inventory and generates time slots automatically
// =====================================================

import React, { useState, useEffect } from 'react';
import { Building, User, MapPin, Clock, Fuel, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService, inventoryService, fuelTypeService, userService } from '../../lib/supabase/database';
import { notifications, notifyError, notifyWarning } from '../../lib/utils/notifications';
import { validateEthiopianPhone, formatEthiopianPhone } from '../../lib/supabase/config';
import type { User as UserType, FuelType } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';

export function CreateStationAdvanced() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [owners, setOwners] = useState<UserType[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdStationId, setCreatedStationId] = useState<string | null>(null);

  const [stationData, setStationData] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
    owner_id: '',
    operating_days: [] as string[],
    opening_time: '06:00',
    closing_time: '22:00',
    is_24_hours: false,
    number_of_pumps: '4',
    vehicles_per_pump_per_slot: '2',
    business_license_number: '',
    operating_license_number: '',
  });

  const [inventoryData, setInventoryData] = useState<
    { fuel_type_id: string; initial_stock: string; min_threshold: string; max_capacity: string }[]
  >([]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadOwners();
    loadFuelTypes();
  }, []);

  const loadOwners = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setOwners(allUsers.filter((u) => u.role === 'station_owner'));
    } catch (error) {
      notifyError('Failed to load station owners', error);
    }
  };

  const loadFuelTypes = async () => {
    try {
      const types = await fuelTypeService.getActiveFuelTypes();
      setFuelTypes(types);
      setInventoryData(
        types.map((t) => ({
          fuel_type_id: t.id,
          initial_stock: '',
          min_threshold: '1000',
          max_capacity: '10000',
        }))
      );
    } catch (error) {
      notifyError('Failed to load fuel types', error);
    }
  };

  const validateStep1 = (): boolean => {
    if (!stationData?.name || stationData?.name.length < 2) {
      notifyWarning('Station name required');
      return false;
    }
    if (!stationData.address) {
      notifyWarning('Address required');
      return false;
    }
    if (!stationData.phone || !validateEthiopianPhone(stationData.phone)) {
      notifyWarning('Valid Ethiopian phone required');
      return false;
    }
    const lat = parseFloat(stationData.latitude);
    const lng = parseFloat(stationData.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      notifyWarning('Valid coordinates required');
      return false;
    }
    if (!stationData.owner_id) {
      notifyWarning('Please select a station owner');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (stationData.operating_days.length === 0) {
      notifyWarning('Select at least one operating day');
      return false;
    }
    const pumps = parseInt(stationData.number_of_pumps);
    if (isNaN(pumps) || pumps < 1) {
      notifyWarning('Valid number of pumps required');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    const hasAtLeastOne = inventoryData.some((inv) => {
      const stock = parseFloat(inv.initial_stock);
      return !isNaN(stock) && stock > 0;
    });
    if (!hasAtLeastOne) {
      notifyWarning('Add at least one fuel type with initial stock');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    
    if (step < 4) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Step 1: Create station
      const stationId = await stationService.createStation({
        ...stationData,
        phone: formatEthiopianPhone(stationData.phone),
        latitude: parseFloat(stationData.latitude),
        longitude: parseFloat(stationData.longitude),
        number_of_pumps: parseInt(stationData.number_of_pumps),
        vehicles_per_pump_per_slot: parseInt(stationData.vehicles_per_pump_per_slot),
      });

      if (!stationId) throw new Error('Failed to create station');
      setCreatedStationId(stationId);

      // Step 2: Add fuel inventory
      for (const inv of inventoryData) {
        const stock = parseFloat(inv.initial_stock);
        if (!isNaN(stock) && stock > 0) {
          await inventoryService.addFuelToStation(
            stationId,
            inv.fuel_type_id,
            stock,
            parseFloat(inv.min_threshold),
            parseFloat(inv.max_capacity)
          );
        }
      }

      // Step 3: Verify station
      await stationService.verifyStation(stationId, user.id);

      // Step 4: Generate time slots
      const slotsCount = await stationService.generateTimeSlots(stationId, 14);

      notifications.station.created(stationData?.name);
      notifications.station.timeSlotsGenerated(slotsCount);
      setStep(4);
    } catch (error) {
      notifyError('Failed to create station', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setStationData({
      ...stationData,
      operating_days: stationData.operating_days.includes(day)
        ? stationData.operating_days.filter((d) => d !== day)
        : [...stationData.operating_days, day],
    });
  };

  const progress = (step / 4) * 100;

  if (step === 4 && createdStationId) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center border-2 border-green-500 bg-green-50">
          <CheckCircle className="size-16 mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Station Created Successfully!</h2>
          <p className="text-green-700 mb-6">{stationData?.name} is now ready to accept reservations.</p>
          <div className="space-y-3 text-left mb-6">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">✅ Station registered</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">✅ Fuel inventory configured</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">✅ Station verified and activated</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">✅ Time slots generated for 14 days</p>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/admin'}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Create New Station</h2>
        <p className="text-gray-600">Complete station setup with owner and inventory</p>
      </div>

      {/* Progress */}
      <Card className="p-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Step {step} of 3</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </Card>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Building className="size-5" />
            Basic Station Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Station Name *</Label>
              <Input
                value={stationData?.name}
                onChange={(e) => setStationData({ ...stationData, name: e.target.value })}
                placeholder="e.g., QuickFuel Bole"
              />
            </div>
            <div>
              <Label>Address *</Label>
              <Input
                value={stationData.address}
                onChange={(e) => setStationData({ ...stationData, address: e.target.value })}
                placeholder="e.g., Bole Road, Addis Ababa"
              />
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={stationData.phone}
                onChange={(e) => setStationData({ ...stationData, phone: e.target.value })}
                placeholder="+251 9XX XXX XXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude *</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={stationData.latitude}
                  onChange={(e) => setStationData({ ...stationData, latitude: e.target.value })}
                  placeholder="9.0103"
                />
              </div>
              <div>
                <Label>Longitude *</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={stationData.longitude}
                  onChange={(e) => setStationData({ ...stationData, longitude: e.target.value })}
                  placeholder="38.7620"
                />
              </div>
            </div>
            <div>
              <Label>Station Owner *</Label>
              <select
                value={stationData.owner_id}
                onChange={(e) => setStationData({ ...stationData, owner_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select station owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.full_name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Business License</Label>
                <Input
                  value={stationData.business_license_number}
                  onChange={(e) => setStationData({ ...stationData, business_license_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Operating License</Label>
                <Input
                  value={stationData.operating_license_number}
                  onChange={(e) => setStationData({ ...stationData, operating_license_number: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Operating Schedule */}
      {step === 2 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="size-5" />
            Operating Schedule & Capacity
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Operating Days *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={stationData.operating_days.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <Label htmlFor={day} className="cursor-pointer">{day.slice(0, 3)}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_24_hours"
                checked={stationData.is_24_hours}
                onCheckedChange={(checked) => setStationData({ ...stationData, is_24_hours: checked as boolean })}
              />
              <Label htmlFor="is_24_hours" className="cursor-pointer">Open 24 Hours</Label>
            </div>
            {!stationData.is_24_hours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Opening Time</Label>
                  <Input
                    type="time"
                    value={stationData.opening_time}
                    onChange={(e) => setStationData({ ...stationData, opening_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Closing Time</Label>
                  <Input
                    type="time"
                    value={stationData.closing_time}
                    onChange={(e) => setStationData({ ...stationData, closing_time: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Number of Pumps *</Label>
                <Input
                  type="number"
                  min="1"
                  value={stationData.number_of_pumps}
                  onChange={(e) => setStationData({ ...stationData, number_of_pumps: e.target.value })}
                />
              </div>
              <div>
                <Label>Vehicles per Pump per Slot *</Label>
                <Input
                  type="number"
                  min="1"
                  value={stationData.vehicles_per_pump_per_slot}
                  onChange={(e) => setStationData({ ...stationData, vehicles_per_pump_per_slot: e.target.value })}
                />
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                Total capacity per slot:{' '}
                <strong>
                  {parseInt(stationData.number_of_pumps) * parseInt(stationData.vehicles_per_pump_per_slot)} vehicles
                </strong>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Fuel Inventory */}
      {step === 3 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Fuel className="size-5" />
            Initial Fuel Inventory
          </h3>
          <div className="space-y-4">
            {fuelTypes.map((fuelType, index) => {
              const inv = inventoryData[index];
              return (
                <Card key={fuelType.id} className="p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">{fuelType?.name} ({fuelType.code})</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Initial Stock (L)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={inv.initial_stock}
                        onChange={(e) => {
                          const newInv = [...inventoryData];
                          newInv[index].initial_stock = e.target.value;
                          setInventoryData(newInv);
                        }}
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Min Threshold</Label>
                      <Input
                        type="number"
                        min="0"
                        value={inv.min_threshold}
                        onChange={(e) => {
                          const newInv = [...inventoryData];
                          newInv[index].min_threshold = e.target.value;
                          setInventoryData(newInv);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Capacity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={inv.max_capacity}
                        onChange={(e) => {
                          const newInv = [...inventoryData];
                          newInv[index].max_capacity = e.target.value;
                          setInventoryData(newInv);
                        }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {step > 1 && step < 4 && (
          <Button onClick={() => setStep(step - 1)} variant="outline">
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button onClick={handleNext} className="flex-1">
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? 'Creating Station...' : 'Create Station'}
          </Button>
        )}
      </div>
    </div>
  );
}
