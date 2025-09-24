"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { InfoIcon, CreditCard, Smartphone, DollarSign, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const handleSavePayment = () => {
    // This is just a UI stub - no backend processing
    alert(`Payment saved! (This is a UI demonstration only) - Amount: ${amount}`);
    
    // Reset form
    setPaymentMethod("");
    setAmount("");
    setReference("");
    setNotes("");
  };

  const handleAddAnother = () => {
    // Clear form for another entry
    setPaymentMethod("");
    setAmount("");
    setReference("");
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manual Payment Reconciliation</h1>
          <p className="text-muted-foreground mt-2">
            Track and reconcile manual payments from various sources
          </p>
        </div>

        {/* Alert about card processing */}
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Card processing is <strong>Coming Soon</strong>. Use this form to manually reconcile Zelle, Apple Pay, Cash App, Cash, and custom payment methods.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Manual Payment Entry Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Manual Payment Entry
                </CardTitle>
                <CardDescription>
                  Record payments received through manual methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zelle">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Zelle
                        </div>
                      </SelectItem>
                      <SelectItem value="apple-pay">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Apple Pay
                        </div>
                      </SelectItem>
                      <SelectItem value="cash-app">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Cash App
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Cash
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Custom Method
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {/* Reference/Handle */}
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference/Handle</Label>
                  <Input
                    id="reference"
                    placeholder="Transaction ID, phone number, handle, etc."
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional details about this payment..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleSavePayment}
                    className="flex-1"
                    disabled={!paymentMethod || !amount}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Payment
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={handleAddAnother}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Payment Methods Info */}
          <div className="space-y-6">
            
            {/* Supported Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supported Methods</CardTitle>
                <CardDescription>
                  Manual reconciliation options available now
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span className="text-sm">Zelle</span>
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span className="text-sm">Apple Pay</span>
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span className="text-sm">Cash App</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm">Cash</span>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Custom Methods</span>
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon */}
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Card Processing
                  <Badge variant="secondary">Coming Soon</Badge>
                </CardTitle>
                <CardDescription>
                  Built-in credit and debit card processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 opacity-75">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Credit Cards</span>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Debit Cards</span>
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Contactless (NFC)</span>
                </div>
                <Separator className="my-3" />
                <div className="text-xs text-muted-foreground">
                  <div>Processing: 3.5% + $0.30</div>
                  <div>Street Tax: +0.5%</div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Summary</CardTitle>
                <CardDescription>
                  Manual payment tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Entries</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">$0.00</span>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  No platform fees on manual reconciliation
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}