import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, Minus, Plus, CreditCard, Banknote, Smartphone, MapPin, User, Loader2 } from 'lucide-react';
import { BillCalculator } from '../../components/Calculators';
import { PaymentMethod } from '../../types';
import { supabase } from '../../services/supabaseClient';

const Cart = () => {
  const { user, cart, removeFromCart, updateCartQuantity, placeOrder } = useApp();
  
  // Checkout Form State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Address & Personal Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [street, setStreet] = useState('Meizailung');
  const [locality, setLocality] = useState('Meizailung');
  const [pinCode, setPinCode] = useState('795142');

  // Payment Details
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ONLINE);
  
  // Tax Setting - Default 0% as requested
  const [taxRate, setTaxRate] = useState(0);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      const names = user.name.split(' ');
      setFirstName(names[0] || '');
      setLastName(names.slice(1).join(' ') || '');
      setMobile(user.phone || '');
    }
  }, [user]);

  // Auto-fill payment amount when entering checkout or when total changes
  useEffect(() => {
    if (isCheckingOut) {
      setPaymentAmount(total.toFixed(2));
    }
  }, [isCheckingOut, total]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Send data to Supabase 'order_forms' table
      // We insert one row per product as per the requested table structure
      const orderPromises = cart.map(item => {
        return supabase.from('order_forms').insert([{
          first_name: firstName,
          last_name: lastName,
          street: street,
          locality: locality,
          pin_code: pinCode,
          mobile_no: mobile,
          product_name: item.name,
          quantity: item.quantity,
          total_amount: (item.price * item.quantity).toFixed(2)
        }]);
      });

      const results = await Promise.all(orderPromises);
      
      // Check for any errors in the batch
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error("Supabase Insert Errors:", errors);
        alert("Some items could not be saved to the database. Please contact support.");
        // We continue to clear cart locally, or you could stop here.
      } else {
        console.log("Order saved to Supabase 'order_forms' successfully.");
      }

      // 2. Process internal app logic (Update local state, transactions, etc.)
      const paid = parseFloat(paymentAmount || '0');
      placeOrder(paid, paymentMethod, undefined, taxRate);
      
      // 3. Reset UI
      setIsCheckingOut(false);
      setPaymentAmount('');
      alert("Order placed successfully!");

    } catch (error) {
      console.error("Checkout Error:", error);
      alert("An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <CreditCard className="h-16 w-16 mb-4 opacity-20" />
        <h3 className="text-xl font-semibold">Your cart is empty</h3>
        <p>Go back to the shop to add some fresh goodies!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Shopping Cart</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                 <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded object-cover bg-slate-100 shrink-0" />
                 <div>
                   <h4 className="font-semibold text-slate-800">{item.name}</h4>
                   <p className="text-emerald-600 font-medium">₹{item.price.toFixed(2)} <span className="text-slate-400 text-xs">/ {item.unit}</span></p>
                 </div>
              </div>
              
              <div className="flex items-center justify-between w-full sm:w-auto space-x-6">
                <div className="flex items-center space-x-2 bg-slate-50 rounded-lg p-1">
                  <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm"><Minus size={14} /></button>
                  <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm"><Plus size={14} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary & Checkout Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
           <h3 className="font-bold text-slate-800 mb-4 text-lg">Order Summary</h3>
           
           <div className="flex justify-between items-center mb-2">
             <label className="text-xs font-semibold text-slate-500">Tax Rate (%)</label>
             <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2 py-1 w-20">
               <input 
                 type="number" 
                 min="0"
                 step="0.1"
                 value={taxRate * 100}
                 onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0) / 100)}
                 className="w-full bg-transparent text-right text-xs outline-none font-medium text-slate-700"
               />
             </div>
           </div>

           <BillCalculator subtotal={subtotal} taxRate={taxRate} />

           <div className="mt-6">
             {!isCheckingOut ? (
               <button 
                onClick={() => setIsCheckingOut(true)}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
               >
                 Proceed to Checkout
               </button>
             ) : (
               <form onSubmit={handleCheckout} className="space-y-4 bg-slate-50 p-4 rounded-lg animate-fade-in border border-emerald-100">
                 
                 {/* Personal Details */}
                 <div>
                    <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                        <User size={14} /> Personal Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input 
                            required
                            type="text" 
                            placeholder="First Name"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="w-full p-2 border rounded text-xs outline-none focus:border-emerald-500"
                        />
                        <input 
                            type="text" 
                            placeholder="Last Name"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="w-full p-2 border rounded text-xs outline-none focus:border-emerald-500"
                        />
                    </div>
                    <input 
                        required
                        type="tel" 
                        placeholder="Mobile Number"
                        value={mobile}
                        onChange={e => setMobile(e.target.value)}
                        className="w-full p-2 border rounded text-xs outline-none focus:border-emerald-500"
                    />
                 </div>

                 {/* Address Details */}
                 <div>
                    <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                        <MapPin size={14} /> Delivery Address
                    </h4>
                    <div className="space-y-2">
                        <input 
                            required
                            type="text" 
                            placeholder="Street / Flat / Building"
                            value={street}
                            onChange={e => setStreet(e.target.value)}
                            className="w-full p-2 border rounded text-xs outline-none focus:border-emerald-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input 
                                required
                                type="text" 
                                placeholder="Locality"
                                value={locality}
                                onChange={e => setLocality(e.target.value)}
                                className="w-full p-2 border rounded text-xs outline-none focus:border-emerald-500"
                            />
                            <input 
                                required
                                type="text" 
                                placeholder="PIN Code"
                                value={pinCode}
                                onChange={e => setPinCode(e.target.value)}
                                className="w-full p-2 border rounded text-xs outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                 </div>

                 <hr className="border-slate-200" />

                 {/* Payment Section */}
                 <div>
                   <label className="block text-xs font-semibold text-slate-500 mb-1">Enter Payment Amount</label>
                   <div className="relative">
                     <span className="absolute left-3 top-2 text-slate-400">₹</span>
                     <input 
                      type="number" 
                      step="0.01" 
                      required
                      min="0"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 border rounded text-sm outline-none focus:border-emerald-500 transition-colors"
                      placeholder="0.00"
                     />
                   </div>
                   <p className="text-xs text-slate-400 mt-1">
                     {parseFloat(paymentAmount || '0') < total 
                      ? "Partial payment will be added to Pending Dues." 
                      : "Fully paid."}
                   </p>
                 </div>

                 {parseFloat(paymentAmount || '0') > 0 && (
                   <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-2">Payment Method</label>
                     <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                         className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-all ${
                           paymentMethod === PaymentMethod.CASH 
                             ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                             : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                         }`}
                       >
                         <Banknote size={16} />
                         Cash
                       </button>
                       <button
                         type="button"
                         onClick={() => setPaymentMethod(PaymentMethod.ONLINE)}
                         className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-all ${
                           paymentMethod === PaymentMethod.ONLINE 
                             ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                             : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                         }`}
                       >
                         <Smartphone size={16} />
                         Online
                       </button>
                     </div>
                   </div>
                 )}

                 <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setIsCheckingOut(false)} className="flex-1 py-2 text-slate-500 text-sm hover:bg-slate-200 rounded">Cancel</button>
                   <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 py-2 bg-emerald-600 text-white text-sm font-bold rounded hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-70"
                   >
                     {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirm Order"}
                   </button>
                 </div>
               </form>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;