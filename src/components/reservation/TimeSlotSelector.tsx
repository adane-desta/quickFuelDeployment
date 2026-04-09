// =====================================================
// TIME SLOT SELECTOR - DRIVER COMPONENT
// =====================================================
// Mobile-first time slot selection with date picker
// Shows availability, capacity, and pricing
// =====================================================

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { timeSlotService } from '../../lib/supabase/database-advanced';
import { notifyError } from '../../lib/utils/notifications';
import type { TimeSlot } from '../../types/advanced';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar as CalendarUI } from '../ui/calendar';
import { Skeleton } from '../ui/skeleton';

interface TimeSlotSelectorProps {
  stationId: string;
  onSelectSlot: (slot: TimeSlot) => void;
  selectedSlotId?: string;
}

export function TimeSlotSelector({ stationId, onSelectSlot, selectedSlotId }: TimeSlotSelectorProps) {
  
  console.log('yes TimeSlotSelector has been rendered')

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Load slots when date changes
  useEffect(() => {
    console.log('useEffect triggered. stationId:', stationId, 'selectedDate:', selectedDate);
    if (stationId && selectedDate) {
      loadTimeSlots();
    } else {
      console.log('Skipping loadTimeSlots because stationId or selectedDate is falsy');
    }
  }, [stationId, selectedDate]);

  const loadTimeSlots = async () => {

    console.log('yes loadTimeSlots has been called')
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log('station id = '+stationId+'  selecte date = '+ dateStr)
      const data = await timeSlotService.getAvailableSlots(stationId, dateStr);
      setSlots(data);
    } catch (error) {
      notifyError('Failed to load time slots', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getSlotStatusBadge = (slot: TimeSlot) => {
    if (slot.status === 'full') {
      return <Badge variant="destructive" className="text-xs">Full</Badge>;
    }
    if (slot.status === 'limited') {
      return <Badge variant="secondary" className="text-xs bg-yellow-500 text-white">Limited</Badge>;
    }
    return <Badge variant="default" className="text-xs bg-green-500">Available</Badge>;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Disable past dates
  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Select Date & Time</h3>
        <p className="text-sm text-gray-600">Choose your preferred time slot</p>
      </div>

      {/* Date Picker */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="size-5 text-primary" />
          <span className="font-medium">Select Date</span>
        </div>
        <CalendarUI
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          disabled={disabledDates}
          className="rounded-md border w-full"
        />
        <p className="text-xs text-gray-500 mt-2">
          Selected: {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </Card>

      {/* Time Slots */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            <span className="font-medium">Available Time Slots</span>
          </div>
          {!loading && slots.length > 0 && (
            <span className="text-xs text-gray-500">{slots.length} slots</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="size-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-700 mb-1">No Available Slots</p>
            <p className="text-sm text-gray-500">
              Please select a different date
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <Card
                key={slot.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedSlotId === slot.id
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border border-gray-200'
                } ${slot.status === 'full' ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => slot.status !== 'full' && onSelectSlot(slot)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </p>
                      <p className="text-xs text-gray-500">1 hour slot</p>
                    </div>
                  </div>
                  {getSlotStatusBadge(slot)}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="size-4 text-gray-400" />
                    <span className="text-gray-600">
                      <span className="font-medium text-gray-900">
                        {slot.available_spots}
                      </span>
                      {' '}/{' '}{slot.max_capacity} spots available
                    </span>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          slot.occupancy_percentage! >= 100
                            ? 'bg-red-500'
                            : slot.occupancy_percentage! >= 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${slot.occupancy_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 min-w-[40px]">
                      {Math.round(slot.occupancy_percentage!)}%
                    </span>
                  </div>
                </div>

                {selectedSlotId === slot.id && (
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <div className="size-2 bg-primary rounded-full animate-pulse" />
                      <span className="font-medium">Selected</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <Card className="p-3 bg-gray-50">
        <p className="text-xs font-medium text-gray-700 mb-2">Status Legend:</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="size-3 bg-green-500 rounded-full" />
            <span className="text-gray-600">Available (&lt;75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 bg-yellow-500 rounded-full" />
            <span className="text-gray-600">Limited (≥75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 bg-red-500 rounded-full" />
            <span className="text-gray-600">Full (100%)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
