import { useState } from 'react';
import { CreditCard, Smartphone, Check, AlertCircle, Loader2 } from 'lucide-react';
import { reservationService } from '../../lib/supabase/database-advanced';
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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Telebirr');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const paymentMethods = [
    { id: 'Telebirr' as PaymentMethod, name: 'Telebirr', icon: <Smartphone className="w-6 h-6 text-orange-600" />, description: 'Pay using Telebirr mobile money', badge: 'Popular' },
    { id: 'Chapa' as PaymentMethod, name: 'Chapa', icon: <CreditCard className="w-6 h-6 text-blue-600" />, description: 'Pay using Chapa payment gateway', badge: 'Fast' },
  ];

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Simulate payment processing (1-2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock payment success (always success for demo)
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const success = await reservationService.confirmPayment(reservationId, transactionId);
      if (success) {
        setPaymentSuccess(true);
        notifications.payment.success();
        setTimeout(() => {
          onPaymentSuccess();
        }, 1500);
      } else {
        throw new Error('Failed to confirm payment in database');
      }
    } catch (error: any) {
      notifyError('Payment failed', error);
      setProcessing(false);
    }
  };

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
                        {method.name}
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
              <li>You'll receive your pickup code immediately</li>
            </ol>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-medium mb-1">Demo Mode</p>
            <p className="text-amber-800">
              This is a mock payment. No real money will be charged. In production, this would integrate with actual {selectedMethod} API.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <Button onClick={handlePayment} disabled={processing} size="lg" className="w-full">
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing Payment...
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