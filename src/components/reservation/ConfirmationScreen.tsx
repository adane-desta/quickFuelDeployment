import { CheckCircle, MapPin, Calendar, Fuel, CreditCard, Smartphone, MessageSquare, Download, Share2 } from 'lucide-react';
import { ReservationData } from '../ReservationFlow';
import { QRCodeSVG } from 'qrcode.react';

interface ConfirmationScreenProps {
  reservationData: ReservationData;
  onClose: () => void;
}

export function ConfirmationScreen({ reservationData, onClose }: ConfirmationScreenProps) {
  // Generate a random pickup code
  const pickupCode = `QF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const numericCode = Math.floor(100000 + Math.random() * 900000).toString();

  const pricePerLiter = reservationData.fuelType === 'Petrol' ? 65 : 58;
  const totalCost = reservationData.quantity * pricePerLiter;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not selected';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // const smsMessage = `QuickFuel Reservation Confirmed!\n\nStation: ${reservationData.station.name}\nDate: ${formatDate(reservationData.date)}\nTime: ${reservationData.timeSlot}\nFuel: ${reservationData.fuelType} - ${reservationData.quantity}L\n\nPickup Code: ${numericCode}\n\nShow this code at the station.`;

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-gray-900 mb-2">Reservation Confirmed!</h3>
        <p className="text-gray-600">Your fuel has been reserved successfully</p>
      </div>

      {/* QR Code */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="bg-white rounded-lg p-4 w-fit mx-auto mb-4">
          <QRCodeSVG value={pickupCode} size={160} />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Pickup Code</p>
          <p className="text-2xl text-gray-900 tracking-wider mb-1">{numericCode}</p>
          <p className="text-xs text-gray-500">Show this at the fuel station</p>
        </div>
      </div>

      {/* Reservation Details */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-gray-900">Reservation Details</h4>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Station</p>
              <p className="text-gray-900">{reservationData.station.name}</p>
              <p className="text-sm text-gray-600">{reservationData.station.distance} km away</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Date & Time</p>
              <p className="text-gray-900">{formatDate(reservationData.date)}</p>
              <p className="text-sm text-gray-600">{reservationData.timeSlot}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Fuel className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Fuel Details</p>
              <p className="text-gray-900">{reservationData.fuelType} - {reservationData.quantity} Liters</p>
              <p className="text-sm text-gray-600">ETB {pricePerLiter}/L × {reservationData.quantity}L = ETB {totalCost}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Payment Method</p>
              <div className="flex items-center gap-2">
                {reservationData.paymentMethod === 'Telebirr' ? (
                  <>
                    <Smartphone className="w-4 h-4 text-orange-600" />
                    <p className="text-gray-900">Telebirr</p>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <p className="text-gray-900">Chapa</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Notification Preview */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-900 mb-2">SMS Confirmation Sent</p>
            <div className="bg-white rounded-lg p-3 text-xs text-gray-700 whitespace-pre-line font-mono border border-green-200">
              {smsMessage}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900 mb-2">Important Reminders:</p>
        <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
          <li>Please arrive within your selected time slot</li>
          <li>Show your pickup code to the station attendant</li>
          <li>Payment will be processed at the station</li>
          <li>Reservation valid for selected date only</li>
        </ul>
      </div>

      {/* Cancel Reservation */}
      <button className="w-full py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors border-2 border-red-200">
        Cancel Reservation
      </button>

      {/* Done Button */}
      <button
        onClick={onClose}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Done
      </button>
    </div>
  );
}
