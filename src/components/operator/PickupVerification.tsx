import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockReservations } from '../../data/mockData';
import { Reservation } from '../../types';
import { QrCode, Search, CheckCircle, XCircle, Loader2, User, Car, Fuel, Calendar, Clock, AlertTriangle } from 'lucide-react';

export function PickupVerification() {
  const { user } = useAuth();
  const stationId = user?.stationId || '1';
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'invalid' | 'used' | null>(null);
  const [foundReservation, setFoundReservation] = useState<Reservation | null>(null);
  const [dispensed, setDispensed] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setIsVerifying(true);
    setVerificationResult(null);
    setFoundReservation(null);
    setDispensed(false);

    await new Promise(resolve => setTimeout(resolve, 1200));

    const reservation = mockReservations.find(r => r.pickupCode === code && r.stationId === stationId);

    if (!reservation) {
      setVerificationResult('invalid');
    } else if (reservation.status === 'completed') {
      setVerificationResult('used');
      setFoundReservation(reservation);
    } else if (reservation.status === 'confirmed') {
      setVerificationResult('success');
      setFoundReservation(reservation);
    } else {
      setVerificationResult('invalid');
    }

    setIsVerifying(false);
  };

  const handleDispense = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDispensed(true);
    setIsVerifying(false);
  };

  const resetVerification = () => {
    setCode('');
    setVerificationResult(null);
    setFoundReservation(null);
    setDispensed(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-gray-900 mb-1">Pickup Verification</h1>
        <p className="text-gray-600">Enter or scan the driver's pickup code to verify and authorize fuel dispensing</p>
      </div>

      {/* Code Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-center text-white">
          <QrCode className="w-12 h-12 mx-auto mb-3 opacity-80" />
          <h3 className="text-white mb-1">Enter Pickup Code</h3>
          <p className="text-green-100 text-sm">6-digit code provided by the driver</p>
        </div>
        <div className="p-6">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6)); setVerificationResult(null); }}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] focus:border-green-500 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
            />
          </div>
          <button onClick={handleVerify} disabled={code.length < 6 || isVerifying}
            className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> Verify Code</>}
          </button>
        </div>
      </div>

      {/* Verification Result */}
      {verificationResult === 'success' && foundReservation && !dispensed && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-green-300 overflow-hidden mb-6">
          <div className="bg-green-50 p-4 flex items-center gap-3 border-b border-green-200">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-green-800">Valid Reservation Found</h3>
              <p className="text-sm text-green-600">Code verified successfully. Review details below.</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Driver</p>
                  <p className="text-gray-900">{foundReservation.driverName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Vehicle</p>
                  <p className="text-gray-900">{foundReservation.plateNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-gray-900">{new Date(foundReservation.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Time Slot</p>
                  <p className="text-gray-900">{foundReservation.timeSlot}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Fuel className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Fuel</p>
                  <p className="text-gray-900">{foundReservation.fuelType} - {foundReservation.quantity}L</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Paid</p>
                <p className="text-gray-900">ETB {foundReservation.totalCost.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800 mb-1">Payment: {foundReservation.paymentMethod}</p>
              <p className="text-xs text-green-600">Payment has been verified and processed</p>
            </div>

            <div className="flex gap-3">
              <button onClick={handleDispense} disabled={isVerifying}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Authorize & Dispense Fuel</>}
              </button>
              <button onClick={resetVerification}
                className="px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispensed Success */}
      {dispensed && foundReservation && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-green-300 overflow-hidden mb-6">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Fuel Dispensed Successfully!</h3>
            <p className="text-gray-600 mb-4">
              {foundReservation.quantity}L of {foundReservation.fuelType} dispensed to {foundReservation.driverName}
            </p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 inline-block">
              <p className="text-xs text-gray-500">Pickup Code</p>
              <p className="text-xl tracking-wider text-gray-900">{foundReservation.pickupCode}</p>
            </div>
            <br />
            <button onClick={resetVerification}
              className="mt-4 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
              Verify Next Pickup
            </button>
          </div>
        </div>
      )}

      {/* Invalid Code */}
      {verificationResult === 'invalid' && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-red-300 overflow-hidden mb-6">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Invalid Pickup Code</h3>
            <p className="text-gray-600 mb-4">No valid reservation found for this code at your station. Please check and try again.</p>
            <button onClick={resetVerification}
              className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Already Used */}
      {verificationResult === 'used' && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-yellow-300 overflow-hidden mb-6">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-yellow-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Code Already Used</h3>
            <p className="text-gray-600 mb-4">This pickup code has already been used. The reservation is marked as completed.</p>
            <button onClick={resetVerification}
              className="px-8 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors">
              Try Another Code
            </button>
          </div>
        </div>
      )}

      {/* Sample Codes Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-blue-900 text-sm mb-2">Demo Pickup Codes for Testing:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <p className="text-blue-800"><span className="bg-blue-100 px-2 py-0.5 rounded tracking-wider">483920</span> - Confirmed</p>
          <p className="text-blue-800"><span className="bg-blue-100 px-2 py-0.5 rounded tracking-wider">334521</span> - Confirmed</p>
          <p className="text-blue-800"><span className="bg-blue-100 px-2 py-0.5 rounded tracking-wider">729184</span> - Completed</p>
          <p className="text-blue-800"><span className="bg-blue-100 px-2 py-0.5 rounded tracking-wider">000000</span> - Invalid</p>
        </div>
      </div>
    </div>
  );
}
