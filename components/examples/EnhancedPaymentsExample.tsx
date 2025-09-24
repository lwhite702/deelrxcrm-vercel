// Example: Enhanced Payments Page with Statsig
'use client';
import React, { useState, useEffect } from 'react';
import {
  useFeatureGate,
  useDynamicConfig,
  useStatsigClient,
} from '@statsig/react-bindings';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function EnhancedPaymentsPage() {
  const [amount, setAmount] = useState('');

  // Statsig hooks
  const { value: showAdvancedPayments } = useFeatureGate(
    'advanced_payment_features'
  );
  const { value: showCryptoPayments } = useFeatureGate('crypto_payments');
  const paymentsConfig = useDynamicConfig('payments_config');
  const statsigClient = useStatsigClient();

  // Get config values
  const maxPaymentAmount = paymentsConfig.get('max_payment_amount', 10000);
  const showPaymentTips = paymentsConfig.get('show_payment_tips', true);
  const processingFee = paymentsConfig.get('processing_fee_percent', 2.9);

  useEffect(() => {
    // Track page view
    statsigClient.logEvent('payments_page_viewed', {
      timestamp: Date.now(),
      features_enabled: {
        advanced_payments: showAdvancedPayments,
        crypto_payments: showCryptoPayments,
      },
    });
  }, [statsigClient, showAdvancedPayments, showCryptoPayments]);

  const handlePayment = (method: string) => {
    // Track payment method selection
    statsigClient.logEvent('payment_method_selected', {
      method,
      amount: parseFloat(amount) || 0,
      timestamp: Date.now(),
    });

    // Your payment logic here
    alert(`Payment initiated with ${method}: $${amount}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Payment Processing</h1>

      {showPaymentTips && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Processing fee: {processingFee}% • Max amount: $
            {maxPaymentAmount.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Standard payment methods */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full p-2 border rounded mb-4"
          />

          <div className="flex gap-2">
            <Button onClick={() => handlePayment('credit_card')}>
              Credit Card
            </Button>
            <Button onClick={() => handlePayment('bank_transfer')}>
              Bank Transfer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced payment features (gated) */}
      {showAdvancedPayments && (
        <Card>
          <CardHeader>
            <CardTitle>
              Advanced Payments <Badge variant="secondary">NEW</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handlePayment('ach')}>
                ACH Transfer
              </Button>
              <Button variant="outline" onClick={() => handlePayment('wire')}>
                Wire Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crypto payments (gated) */}
      {showCryptoPayments && (
        <Card>
          <CardHeader>
            <CardTitle>
              Cryptocurrency <Badge variant="secondary">BETA</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handlePayment('bitcoin')}
              >
                Bitcoin
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePayment('ethereum')}
              >
                Ethereum
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
