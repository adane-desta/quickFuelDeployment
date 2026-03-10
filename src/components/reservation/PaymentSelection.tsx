import { useState } from 'react';
import { CreditCard, Smartphone, Shield, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentSelectionProps {
  paymentMethod: 'Telebirr' | 'Chapa' | null;
  onUpdate: (paymentMethod: 'Telebirr' | 'Chapa') => void;
  onNext: () => void;
  onBack: () => void;
}

export function PaymentSelection({
  paymentMethod,
  onUpdate,
  onNext,
  onBack,
}: PaymentSelectionProps) {
  const [localPaymentMethod, setLocalPaymentMethod] = useState(paymentMethod);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'verifying'>('select');

  const handlePaymentSelect = (method: 'Telebirr' | 'Chapa') => {
    setLocalPaymentMethod(method);
  };

  const handleContinue = async () => {
    if (localPaymentMethod && phoneNumber.length >= 9) {
      setIsProcessing(true);
      setPaymentStep('processing');
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPaymentStep('verifying');
      
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsProcessing(false);
      setPaymentStep('select');
      onUpdate(localPaymentMethod);
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-gray-900 mb-2">Payment Method</h3>
        <p className="text-gray-600">Choose your preferred payment option</p>
      </div>

      {/* Payment Processing Overlay */}
      {isProcessing && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h4 className="text-gray-900 mb-2">
            {paymentStep === 'processing' ? 'Processing Payment...' : 'Verifying Transaction...'}
          </h4>
          <p className="text-sm text-gray-600">
            {paymentStep === 'processing' 
              ? `Connecting to ${localPaymentMethod}...`
              : 'Confirming your payment with the provider...'
            }
          </p>
          {localPaymentMethod === 'Telebirr' && paymentStep === 'processing' && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-900">Check your phone for the USSD prompt to approve payment</p>
            </div>
          )}
        </div>
      )}

      {!isProcessing && (
        <>
          {/* Security Notice */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 mb-1">Secure Payment</p>
              <p className="text-xs text-blue-700">
                Your payment information is encrypted and secure. We never store your payment details.
              </p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            {/* Telebirr */}
            <button
              onClick={() => handlePaymentSelect('Telebirr')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                localPaymentMethod === 'Telebirr'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-7 h-7 text-orange-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">Telebirr</p>
                    {localPaymentMethod === 'Telebirr' && (
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Pay with Telebirr mobile wallet</p>
                </div>
              </div>
            </button>

            {/* Chapa */}
            <button
              onClick={() => handlePaymentSelect('Chapa')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                localPaymentMethod === 'Chapa'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">Chapa</p>
                    {localPaymentMethod === 'Chapa' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Pay with Chapa payment gateway</p>
                </div>
              </div>
            </button>
          </div>

          {/* Payment Details Form */}
          {localPaymentMethod && (
            <div className="space-y-4 animate-in slide-in-from-top">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    +251
                  </span>
                  <input
                    type="tel"
                    placeholder="9XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={9}
                    className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  A confirmation code will be sent to this number
                </p>
              </div>

              {localPaymentMethod === 'Telebirr' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-900">
                    You will receive a USSD prompt on your phone to approve the payment
                  </p>
                </div>
              )}

              {localPaymentMethod === 'Chapa' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-900">
                    Payment will be securely processed through Chapa's payment gateway
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Terms */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1" defaultChecked />
              <p className="text-xs text-gray-600">
                I agree to the QuickFuel{' '}
                <span className="text-blue-600 underline">Terms of Service</span> and{' '}
                <span className="text-blue-600 underline">Privacy Policy</span>. I understand
                that reservation fees are non-refundable.
              </p>
            </label>
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
              disabled={!localPaymentMethod || phoneNumber.length < 9}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Pay & Confirm Reservation
            </button>
          </div>
        </>
      )}
    </div>
  );
}
