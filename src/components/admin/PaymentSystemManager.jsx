import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, CreditCard, Lock, AlertCircle, 
  CheckCircle, Loader2, ExternalLink, Banknote
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';

export default function PaymentSystemManager() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['storeSettings'],
    queryFn: async () => {
      const result = await base44.entities.StoreSettings.list('-created_date', 1);
      return result[0] || null;
    }
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 50)
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.entities.StoreSettings.update(settings.id, data);
      } else {
        return base44.entities.StoreSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeSettings'] });
      toast.success('Settings updated');
    }
  });

  const totalRevenue = transactions
    .filter(t => t.status === 'completed' && t.transaction_type === 'sale')
    .reduce((sum, t) => sum + (t.net_amount || t.amount), 0);

  const pendingRevenue = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const isPaymentSystemReady = settings?.stripe_connected && settings?.bank_account_connected;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Payment System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-stone-500 mb-1">Payment Processing</p>
              <div className="flex items-center gap-2">
                {settings?.payment_system_enabled ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-stone-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-stone-800">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm text-stone-500 mb-1">Pending</p>
              <p className="text-xl font-semibold text-amber-600">
                ${pendingRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={settings?.stripe_connected ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
            <CreditCard className="w-4 h-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Stripe Payment Gateway</p>
                  <p className="text-sm">
                    {settings?.stripe_connected 
                      ? 'Connected and ready to process payments' 
                      : 'Not connected - Backend functions required'}
                  </p>
                </div>
                {settings?.stripe_connected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
              </div>
            </AlertDescription>
          </Alert>

          <Alert className={settings?.bank_account_connected ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
            <Banknote className="w-4 h-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Bank Account (Payouts)</p>
                  <p className="text-sm">
                    {settings?.bank_account_connected 
                      ? 'Bank account connected for receiving funds' 
                      : 'Not connected - required for receiving payments'}
                  </p>
                </div>
                {settings?.bank_account_connected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
              </div>
            </AlertDescription>
          </Alert>

          <Alert className={settings?.distrokid_integration_enabled ? 'border-green-200 bg-green-50' : 'border-stone-200 bg-stone-50'}>
            <ExternalLink className="w-4 h-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">DistroKid Merch Integration</p>
                  <p className="text-sm">
                    {settings?.distrokid_integration_enabled 
                      ? `Connected to ${settings.distrokid_store_url}` 
                      : 'Optional - Connect your DistroKid merch store'}
                  </p>
                </div>
                {settings?.distrokid_integration_enabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <span className="text-xs text-stone-500">Optional</span>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <Alert className={settings?.quickbooks_connected ? 'border-green-200 bg-green-50' : 'border-stone-200 bg-stone-50'}>
            <DollarSign className="w-4 h-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Accounting System Integration</p>
                  <p className="text-sm">
                    {settings?.quickbooks_connected 
                      ? 'Auto-syncing transactions to accounting system' 
                      : 'Optional - Auto-sync transactions for bookkeeping'}
                  </p>
                </div>
                {settings?.quickbooks_connected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <span className="text-xs text-stone-500">Optional</span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Payment System Control */}
      <Card>
        <CardHeader>
          <CardTitle>Payment System Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border-2 border-red-200 bg-red-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-900 mb-1">Security Notice</h4>
                <p className="text-sm text-red-800 mb-3">
                  Payment processing is currently disabled for security. The checkout system will not process real payments 
                  until Stripe is properly configured and your bank account is connected.
                </p>
                {!isPaymentSystemReady && (
                  <div className="text-sm text-red-800">
                    <strong>Required before enabling:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {!settings?.stripe_connected && <li>Connect Stripe payment gateway (requires backend functions)</li>}
                      {!settings?.bank_account_connected && <li>Connect bank account for payouts</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-stone-200 rounded-xl">
            <div>
              <p className="font-semibold text-stone-800">Enable Payment Processing</p>
              <p className="text-sm text-stone-500">
                {isPaymentSystemReady 
                  ? 'All requirements met - safe to enable' 
                  : 'Complete integration checklist first'}
              </p>
            </div>
            <Switch
              checked={settings?.payment_system_enabled || false}
              onCheckedChange={(checked) => {
                if (checked && !isPaymentSystemReady) {
                  toast.error('Complete Stripe and bank account setup first');
                  return;
                }
                updateSettingsMutation.mutate({ payment_system_enabled: checked });
              }}
              disabled={!isPaymentSystemReady}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">
              DistroKid Store URL (Optional)
            </label>
            <Input
              value={settings?.distrokid_store_url || ''}
              onChange={(e) => updateSettingsMutation.mutate({ 
                distrokid_store_url: e.target.value,
                distrokid_integration_enabled: !!e.target.value
              })}
              placeholder="https://distrokid.com/hyperfollow/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-stone-500 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
                  <div>
                    <p className="font-medium text-stone-800">{txn.customer_email}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(txn.created_date).toLocaleString()} • {txn.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-stone-800">${txn.amount.toFixed(2)}</p>
                    <Badge className={
                      txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                      txn.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}