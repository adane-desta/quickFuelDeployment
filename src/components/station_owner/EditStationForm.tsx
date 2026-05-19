// =====================================================
// EDIT STATION FORM - STATION OWNER COMPONENT
// =====================================================
// Edit station details (NOT prices - admin only!)
// Regenerates time slots on schedule changes
// =====================================================

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Save, RefreshCw } from 'lucide-react';
import { stationService } from '../../lib/supabase/database';
import { notifications, notifyError, notifyWarning } from '../../lib/utils/notifications';
import { validateEthiopianPhone, formatEthiopianPhone } from '../../lib/supabase/config';
import type { Station } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Skeleton } from '../ui/skeleton';

interface EditStationFormProps {
  stationId: string;
  onSuccess?: () => void;
}

export function EditStationForm({ stationId, onSuccess }: EditStationFormProps) {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
    operating_days: [] as string[],
    opening_time: '',
    closing_time: '',
    is_24_hours: false,
    number_of_pumps: '',
    vehicles_per_pump_per_slot: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadStation();
  }, [stationId]);

  const loadStation = async () => {
    setLoading(true);
    try {
      const stations = await stationService.getAllStations();
      const stationData = stations.find((s) => s.id === stationId);
      if (stationData) {
        setStation(stationData);
        setFormData({
          name: stationData?.name,
          address: stationData.address,
          phone: stationData.phone,
          latitude: stationData.latitude?.toString() || '',
          longitude: stationData.longitude?.toString() || '',
          operating_days: stationData.operating_days || [],
          opening_time: stationData.opening_time || '06:00',
          closing_time: stationData.closing_time || '22:00',
          is_24_hours: stationData.is_24_hours || false,
          number_of_pumps: stationData.number_of_pumps?.toString() || '4',
          vehicles_per_pump_per_slot: stationData.vehicles_per_pump_per_slot?.toString() || '2',
        });
      }
    } catch (error) {
      notifyError('Failed to load station', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData?.name || formData?.name.length < 2) {
      newErrors?.name = 'Station name required (min 2 characters)';
    }
    if (!formData.address) {
      newErrors.address = 'Address required';
    }
    if (!formData.phone || !validateEthiopianPhone(formData.phone)) {
      newErrors.phone = 'Valid Ethiopian phone required';
    }

    const lat = parseFloat(formData.latitude);
    if (!formData.latitude || isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = 'Valid latitude required (-90 to 90)';
    }

    const lng = parseFloat(formData.longitude);
    if (!formData.longitude || isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.longitude = 'Valid longitude required (-180 to 180)';
    }

    if (formData.operating_days.length === 0) {
      newErrors.operating_days = 'Select at least one operating day';
    }

    if (!formData.is_24_hours) {
      if (!formData.opening_time) {
        newErrors.opening_time = 'Opening time required';
      }
      if (!formData.closing_time) {
        newErrors.closing_time = 'Closing time required';
      }
      if (formData.opening_time && formData.closing_time && formData.opening_time >= formData.closing_time) {
        newErrors.closing_time = 'Closing time must be after opening time';
      }
    }

    const pumps = parseInt(formData.number_of_pumps);
    if (!formData.number_of_pumps || isNaN(pumps) || pumps < 1 || pumps > 50) {
      newErrors.number_of_pumps = 'Valid number of pumps required (1-50)';
    }

    const vehicles = parseInt(formData.vehicles_per_pump_per_slot);
    if (!formData.vehicles_per_pump_per_slot || isNaN(vehicles) || vehicles < 1 || vehicles > 10) {
      newErrors.vehicles_per_pump_per_slot = 'Valid vehicles per pump required (1-10)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      notifyWarning('Please fix form errors');
      return;
    }

    setSaving(true);
    try {
      const success = await stationService.updateStation(stationId, {
        name: formData?.name,
        address: formData.address,
        phone: formatEthiopianPhone(formData.phone),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        operating_days: formData.operating_days,
        opening_time: formData.is_24_hours ? '00:00' : formData.opening_time,
        closing_time: formData.is_24_hours ? '23:59' : formData.closing_time,
        is_24_hours: formData.is_24_hours,
        number_of_pumps: parseInt(formData.number_of_pumps),
        vehicles_per_pump_per_slot: parseInt(formData.vehicles_per_pump_per_slot),
      });

      if (success) {
        notifications.station.updated();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      notifyError('Failed to update station', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSlots = async () => {
    if (!confirm('Regenerate time slots? This will create new slots for the next 14 days based on updated schedule.')) {
      return;
    }

    setRegenerating(true);
    try {
      const count = await stationService.generateTimeSlots(stationId, 14);
      notifications.station.timeSlotsGenerated(count);
    } catch (error) {
      notifyError('Failed to regenerate time slots', error);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData({
      ...formData,
      operating_days: formData.operating_days.includes(day)
        ? formData.operating_days.filter((d) => d !== day)
        : [...formData.operating_days, day],
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!station) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">Station not found</p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Edit Station Details</h2>
        <p className="text-gray-600">{station?.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Station Name *</Label>
              <Input
                id="name"
                value={formData?.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors?.name ? 'border-red-500' : ''}
              />
              {errors?.name && <p className="text-xs text-red-500 mt-1">{errors?.name}</p>}
            </div>

            <div>
              <Label htmlFor="address">
                <MapPin className="size-4 inline mr-1" />
                Address *
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+251 9XX XXX XXX"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 9.0103"
                  className={errors.latitude ? 'border-red-500' : ''}
                />
                {errors.latitude && <p className="text-xs text-red-500 mt-1">{errors.latitude}</p>}
              </div>
              <div>
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., 38.7620"
                  className={errors.longitude ? 'border-red-500' : ''}
                />
                {errors.longitude && <p className="text-xs text-red-500 mt-1">{errors.longitude}</p>}
              </div>
            </div>
          </div>
        </Card>

        {/* Operating Schedule */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">
            <Clock className="size-4 inline mr-1" />
            Operating Schedule
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Operating Days *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={formData.operating_days.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <Label htmlFor={day} className="cursor-pointer text-sm">
                      {day.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.operating_days && (
                <p className="text-xs text-red-500 mt-1">{errors.operating_days}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_24_hours"
                checked={formData.is_24_hours}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_24_hours: checked as boolean })
                }
              />
              <Label htmlFor="is_24_hours" className="cursor-pointer">
                Open 24 Hours
              </Label>
            </div>

            {!formData.is_24_hours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opening_time">Opening Time *</Label>
                  <Input
                    id="opening_time"
                    type="time"
                    value={formData.opening_time}
                    onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                    className={errors.opening_time ? 'border-red-500' : ''}
                  />
                  {errors.opening_time && (
                    <p className="text-xs text-red-500 mt-1">{errors.opening_time}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="closing_time">Closing Time *</Label>
                  <Input
                    id="closing_time"
                    type="time"
                    value={formData.closing_time}
                    onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                    className={errors.closing_time ? 'border-red-500' : ''}
                  />
                  {errors.closing_time && (
                    <p className="text-xs text-red-500 mt-1">{errors.closing_time}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Capacity Settings */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">
            <Users className="size-4 inline mr-1" />
            Capacity Settings
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="number_of_pumps">Number of Pumps *</Label>
              <Input
                id="number_of_pumps"
                type="number"
                min="1"
                max="50"
                value={formData.number_of_pumps}
                onChange={(e) => setFormData({ ...formData, number_of_pumps: e.target.value })}
                className={errors.number_of_pumps ? 'border-red-500' : ''}
              />
              {errors.number_of_pumps && (
                <p className="text-xs text-red-500 mt-1">{errors.number_of_pumps}</p>
              )}
            </div>

            <div>
              <Label htmlFor="vehicles_per_pump_per_slot">Vehicles per Pump per Slot *</Label>
              <Input
                id="vehicles_per_pump_per_slot"
                type="number"
                min="1"
                max="10"
                value={formData.vehicles_per_pump_per_slot}
                onChange={(e) =>
                  setFormData({ ...formData, vehicles_per_pump_per_slot: e.target.value })
                }
                className={errors.vehicles_per_pump_per_slot ? 'border-red-500' : ''}
              />
              {errors.vehicles_per_pump_per_slot && (
                <p className="text-xs text-red-500 mt-1">{errors.vehicles_per_pump_per_slot}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Total capacity per slot:{' '}
                {parseInt(formData.number_of_pumps || '0') *
                  parseInt(formData.vehicles_per_pump_per_slot || '0')}{' '}
                vehicles
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1" size="lg">
            {saving ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRegenerateSlots}
            disabled={regenerating}
            size="lg"
          >
            {regenerating ? (
              <>
                <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="size-5 mr-2" />
                Regenerate Slots
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
