import { useState } from 'react';
import { CreditCard, Smartphone, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { notifications, notifyError } from '../../lib/utils/notifications';
import type { PaymentMethod } from '../../types/advanced';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

interface PaymentProcessorProps {
  reservationId: string;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentCancel?: () => void;
}

export function PaymentProcessor({
  reservationId,
  amount,
  onPaymentSuccess,
  onPaymentCancel,
}: PaymentProcessorProps) {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Chapa');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const paymentMethods = [
    {
      id: 'Chapa' as PaymentMethod,
      name: 'Chapa',
      icon: <CreditCard className="w-6 h-6 text-blue-600" />,
      description: 'Pay using Chapa payment gateway',
      badge: 'Recommended',
    },
    // Telebirr would require separate integration; can be added later
  ];

  const handlePayment = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      // Call edge function to create Chapa payment link
      const { data, error } = await supabase.functions.invoke('create-chapa-payment', {
        body: {
          reservationId,
          amount,
          email: user.email,
          name: user.full_name,
          phone: user.phone,
        },
      });

      if (error) throw error;
      if (!data.checkout_url) throw new Error('No checkout URL received');

      // Redirect to Chapa payment page
      window.location.href = data.checkout_url;
    } catch (error: any) {
      notifyError('Payment initiation failed', error);
      setProcessing(false);
    }
  };

  // This component will be unmounted on redirect, so we don't need to handle success here.
  // The `onPaymentSuccess` callback will be called by the parent when the user returns
  // after a successful payment (via URL parameter or polling).
  // For simplicity, we rely on the parent component to check the URL and call onPaymentSuccess.

  if (paymentSuccess) {
    return (
      <Card className="p-8 text-center border-2 border-green-500 bg-green-50">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">Payment Successful!</h3>
        <p className="text-green-700 mb-4">Your reservation has been confirmed.</p>
        <div className="inline-flex items-center gap-2 text-sm text-green-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating pickup code...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Payment Method</h3>
        <p className="text-sm text-gray-600">Choose how you want to pay</p>
      </div>

      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-primary">ETB {amount.toFixed(2)}</p>
          </div>
          <Badge className="bg-green-600 text-lg px-4 py-2">Pay Now</Badge>
        </div>
      </Card>

      <div>
        <Label className="text-base font-medium mb-3 block">Select Payment Method</Label>
        <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Card
                key={method.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedMethod === method.id ? 'border-2 border-primary bg-primary/5' : 'border border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="flex items-center gap-4">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {method.icon}
                      <Label htmlFor={method.id} className="font-semibold text-base cursor-pointer">
                        {method?.name}
                      </Label>
                      {method.badge && <Badge variant="secondary" className="text-xs">{method.badge}</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 ml-9">{method.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </RadioGroup>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 space-y-2">
            <p className="font-medium">How payment works:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Click "Pay ETB {amount.toFixed(2)}" button below</li>
              <li>You'll be redirected to {selectedMethod} payment page</li>
              <li>Complete the payment securely</li>
              <li>You'll be redirected back to QuickFuel with your pickup code</li>
            </ol>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <Button onClick={handlePayment} disabled={processing} size="lg" className="w-full">
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Redirecting to {selectedMethod}...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay ETB {amount.toFixed(2)}
            </>
          )}
        </Button>
        {onPaymentCancel && (
          <Button onClick={onPaymentCancel} disabled={processing} variant="outline" size="lg" className="w-full">
            Cancel Payment
          </Button>
        )}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs text-gray-500">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span>Secure payment powered by {selectedMethod}</span>
        </div>
      </div>
    </div>
  );
}