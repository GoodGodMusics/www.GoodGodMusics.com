import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Truck, Lock, Check, ArrowLeft, 
  ShoppingBag, Loader2, AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Checkout() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard');

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: ''
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) return [];
      return base44.entities.CartItem.filter({ session_id: sessionId });
    }
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = shippingMethod === 'express' ? 15.99 : (subtotal >= 50 ? 0 : 5.99);
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async () => {
    setIsProcessing(true);

    // Create order
    await base44.entities.Order.create({
      customer_email: formData.email,
      customer_name: `${formData.firstName} ${formData.lastName}`,
      shipping_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`,
      items: cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal,
      shipping_cost: shippingCost,
      total,
      payment_method: 'card',
      status: 'pending'
    });

    // Clear cart
    const sessionId = localStorage.getItem('sessionId');
    const items = await base44.entities.CartItem.filter({ session_id: sessionId });
    for (const item of items) {
      await base44.entities.CartItem.delete(item.id);
    }

    setIsProcessing(false);
    setOrderComplete(true);
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-800 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-stone-600 mb-6">
            Thank you for your purchase. A confirmation email has been sent to {formData.email}.
          </p>
          <div className="bg-stone-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-stone-500">Order Total</p>
            <p className="text-2xl font-bold text-stone-800">${total.toFixed(2)}</p>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 rounded-xl py-3">
              Return to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-stone-300" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-800 mb-4">Your Cart is Empty</h1>
          <p className="text-stone-500 mb-6">Add some items to your cart before checking out.</p>
          <Link to={createPageUrl('Store')}>
            <Button className="bg-amber-600 hover:bg-amber-700">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link 
          to={createPageUrl('Store')} 
          className="inline-flex items-center text-stone-600 hover:text-amber-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Progress steps */}
              <div className="flex border-b border-stone-100">
                {[
                  { num: 1, label: 'Information' },
                  { num: 2, label: 'Shipping' },
                  { num: 3, label: 'Payment' }
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => step > s.num && setStep(s.num)}
                    className={`flex-1 py-4 text-center transition-colors ${
                      step === s.num 
                        ? 'bg-amber-50 text-amber-800 font-medium' 
                        : step > s.num 
                          ? 'bg-green-50 text-green-700 cursor-pointer' 
                          : 'text-stone-400'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 text-sm ${
                      step === s.num 
                        ? 'bg-amber-600 text-white' 
                        : step > s.num 
                          ? 'bg-green-600 text-white' 
                          : 'bg-stone-200 text-stone-500'
                    }`}>
                      {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-8">
                {/* Step 1: Information */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                      Contact Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <Label>Email Address</Label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Street address"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>City</Label>
                          <Input
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>ZIP Code</Label>
                          <Input
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Country</Label>
                          <Input
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setStep(2)}
                      className="w-full mt-8 bg-amber-600 hover:bg-amber-700 py-3 rounded-xl"
                    >
                      Continue to Shipping
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Shipping */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                      Shipping Method
                    </h2>
                    <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                      <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        shippingMethod === 'standard' ? 'border-amber-500 bg-amber-50' : 'border-stone-200'
                      }`}>
                        <div className="flex items-center gap-4">
                          <RadioGroupItem value="standard" />
                          <div>
                            <p className="font-medium text-stone-800">Standard Shipping</p>
                            <p className="text-sm text-stone-500">5-7 business days</p>
                          </div>
                        </div>
                        <p className="font-semibold text-stone-800">
                          {subtotal >= 50 ? 'FREE' : '$5.99'}
                        </p>
                      </label>
                      <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all mt-3 ${
                        shippingMethod === 'express' ? 'border-amber-500 bg-amber-50' : 'border-stone-200'
                      }`}>
                        <div className="flex items-center gap-4">
                          <RadioGroupItem value="express" />
                          <div>
                            <p className="font-medium text-stone-800">Express Shipping</p>
                            <p className="text-sm text-stone-500">2-3 business days</p>
                          </div>
                        </div>
                        <p className="font-semibold text-stone-800">$15.99</p>
                      </label>
                    </RadioGroup>
                    <div className="flex gap-4 mt-8">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 rounded-xl"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={() => setStep(3)}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 py-3 rounded-xl"
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment - TEMPORARILY DISABLED */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                      Payment System Temporarily Unavailable
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
                        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-amber-900 mb-2">Payment Processing Currently Down</h3>
                          <p className="text-sm text-amber-800 mb-3">
                            We're currently upgrading our payment system to provide a more secure checkout experience.
                            Our store will be fully operational soon with integrated payment processing through our official distribution partner.
                          </p>
                          <p className="text-sm text-amber-800">
                            <strong>What's coming:</strong> Secure Stripe payment integration, real-time inventory management, 
                            and seamless order fulfillment through our DistroKid merch platform.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                        <h4 className="font-bold text-blue-900 mb-2">Want to be notified when we launch?</h4>
                        <p className="text-sm text-blue-800 mb-4">
                          Leave your email and we'll let you know as soon as our secure store is ready for orders.
                        </p>
                        <div className="flex gap-3">
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            name="email"
                            placeholder="your@email.com"
                            className="flex-1"
                          />
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Notify Me
                          </Button>
                        </div>
                      </div>

                      <div className="p-6 bg-stone-50 rounded-xl">
                        <h4 className="font-semibold text-stone-800 mb-3">In the meantime...</h4>
                        <ul className="space-y-2 text-sm text-stone-600">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            Browse our full product catalog
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            Add items to your cart (saved for later)
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            Contact us directly at GoodGodMusics@gmail.com for special orders
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep(2)}
                        className="flex-1 py-3 rounded-xl"
                      >
                        Back
                      </Button>
                      <Link to={createPageUrl('Store')} className="flex-1">
                        <Button 
                          variant="outline"
                          className="w-full py-3 rounded-xl"
                        >
                          Continue Shopping
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-32">
              <h3 className="text-xl font-serif font-bold text-stone-800 mb-6">
                Order Summary
              </h3>
              
              <div className="space-y-4 max-h-64 overflow-y-auto mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800 text-sm">{item.product_name}</p>
                      <p className="text-stone-500 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-stone-800">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-stone-800">Total</span>
                <span className="text-2xl font-bold text-amber-700">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}