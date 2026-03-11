import { useState } from 'react';
import { Calendar, Clock, ChevronLeft } from 'lucide-react';

interface TimeSlotSelectionProps {
  selectedDate: string;
  selectedTime: string;
  onUpdate: (date: string, timeSlot: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const timeSlots = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
];

export function TimeSlotSelection({
  selectedDate,
  selectedTime,
  onUpdate,
  onNext,
  onBack,
}: TimeSlotSelectionProps) {
  const [localDate, setLocalDate] = useState(selectedDate);
  const [localTime, setLocalTime] = useState(selectedTime);

  // Generate next 7 days
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleDateSelect = (date: string) => {
    setLocalDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setLocalTime(time);
  };

  const handleContinue = () => {
    if (localDate && localTime) {
      onUpdate(localDate, localTime);
      onNext();
    }
  };

  const days = getNextDays();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-gray-900 mb-2">Select Pickup Time</h3>
        <p className="text-gray-600">Choose your preferred date and time slot</p>
      </div>

      {/* Date Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h4 className="text-gray-900">Select Date</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {days.map((day) => {
            const dateStr = formatDate(day);
            const isSelected = localDate === dateStr;
            const isToday = dateStr === formatDate(new Date());

            return (
              <button
                key={dateStr}
                onClick={() => handleDateSelect(dateStr)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">
                    {isToday ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-gray-900">
                    {day.getDate()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {day.toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slot Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <h4 className="text-gray-900">Select Time Slot</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {timeSlots.map((slot) => {
            const isSelected = localTime === slot;
            return (
              <button
                key={slot}
                onClick={() => handleTimeSelect(slot)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`text-sm ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                  {slot}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!localDate || !localTime}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue to Fuel Selection
        </button>
      </div>
    </div>
  );
}
