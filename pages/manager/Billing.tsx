import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, User as UserIcon, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ScanBarcode, FileText, Share2, CheckCircle, X } from 'lucide-react';
import { Product, CartItem, PaymentMethod, Order, User } from '../../types';
import { TAX_RATE } from '../../constants';
import { BillCalculator, DuesCalculator } from '../../components/Calculators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Billing = () => {
  const { products, users, placeOrder, billingOrder, setBillingOrder } = useApp();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [billCart, setBillCart] = useState<CartItem[]>([]);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  
  // Success Modal State
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Check for billingOrder from Dashboard redirection
  useEffect(() => {
    if (billingOrder) {
      setBillCart(billingOrder.items);
      setSelectedUser(billingOrder.customerId);
      // Auto-enter total amount paid as requested
      setAmountPaid(billingOrder.total.toFixed(2));
      
      // Clear the context to avoid persistence
      setBillingOrder(null);
    }
  }, [billingOrder, setBillingOrder]);

  // Show all products, filtering by search term if present
  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const subtotal = billCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const addToBill = (product: Product) => {
    setBillCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
            return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setBillCart(prev => prev.map(item => {
        if (item.id === id) {
            const newQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQty };
        }
        return item;
    }));
  };

  const removeFromBill = (id: string) => {
    setBillCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCreateOrder = async () => {
      if (!selectedUser || billCart.length === 0) return;
      
      const order = await placeOrder(parseFloat(amountPaid || '0'), paymentMethod, selectedUser);
      
      if (order) {
        setCreatedOrder(order);
        // Clear input states
        setBillCart([]);
        setAmountPaid('');
      }
  };

  const handleCloseSuccess = () => {
      setCreatedOrder(null);
      setSelectedUser('');
      setPaymentMethod(PaymentMethod.CASH);
  };

  const generateInvoicePDF = () => {
      if (!createdOrder) return;
      
      const customer = users.find(u => u.id === createdOrder.customerId);
      const doc = new jsPDF();
      
      // Brand
      doc.setTextColor(16, 185, 129); // Emerald 600
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("ton2Store", 14, 20);
      
      doc.setTextColor(100);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("123 Grocery Lane, Market City", 14, 26);
      doc.text("Phone: +91 99999 99999", 14, 31);
      
      // Invoice Info
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 140, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice #: ${createdOrder.id}`, 140, 26);
      doc.text(`Date: ${new Date(createdOrder.date).toLocaleDateString()}`, 140, 31);
      
      // Customer Info
      doc.line(14, 35, 196, 35);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", 14, 42);
      doc.setFont("helvetica", "normal");
      doc.text(createdOrder.customerName, 14, 48);
      if (customer) {
          doc.text(`Phone: ${customer.phone}`, 14, 53);
          if (customer.email) doc.text(customer.email, 14, 58);
      }
      
      // Table
      const tableColumn = ["Item", "Qty", "Unit", "Price", "Total"];
      const tableRows = createdOrder.items.map(item => [
          item.name,
          item.quantity,
          item.unit,
          `Rs. ${item.price.toFixed(2)}`,
          `Rs. ${(item.price * item.quantity).toFixed(2)}`
      ]);
      
      autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 65,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] }, // Emerald
          styles: { fontSize: 9 },
      });
      
      // Totals
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(10);
      doc.text(`Subtotal:`, 140, finalY);
      doc.text(`Rs. ${createdOrder.subtotal.toFixed(2)}`, 196, finalY, { align: 'right' });
      
      doc.text(`Tax:`, 140, finalY + 5);
      doc.text(`Rs. ${createdOrder.tax.toFixed(2)}`, 196, finalY + 5, { align: 'right' });
      
      if (createdOrder.discount > 0) {
          doc.setTextColor(16, 185, 129);
          doc.text(`Discount:`, 140, finalY + 10);
          doc.text(`- Rs. ${createdOrder.discount.toFixed(2)}`, 196, finalY + 10, { align: 'right' });
          doc.setTextColor(0);
      }
      
      const totalY = finalY + (createdOrder.discount > 0 ? 15 : 10);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total:`, 140, totalY);
      doc.text(`Rs. ${createdOrder.total.toFixed(2)}`, 196, totalY, { align: 'right' });
      
      // Payment Status
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Status: ${createdOrder.status}`, 14, finalY);
      doc.text(`Paid: Rs. ${createdOrder.amountPaid.toFixed(2)}`, 14, finalY + 5);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Thank you for shopping with ton2Store!", 105, 280, { align: 'center' });
      
      doc.save(`Invoice_${createdOrder.id}.pdf`);
  };

  const shareOnWhatsApp = () => {
      if (!createdOrder) return;
      const customer = users.find(u => u.id === createdOrder.customerId);
      if (!customer) {
          alert("Customer phone number not found.");
          return;
      }
      
      const message = `Hello ${createdOrder.customerName}, Here is your invoice for Order #${createdOrder.id}. Total Amount: Rs. ${createdOrder.total.toFixed(2)}. Thank you for shopping with ton2Store!`;
      const url = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-8rem)]">
      {/* Product Selection */}
      <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-[500px] lg:h-auto">
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
             <input 
               type="text" 
               placeholder="Scan barcode or type product name..." 
               className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white transition-all outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               autoFocus
             />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <ScanBarcode size={48} className="opacity-40" />
                    </div>
                    {searchTerm ? (
                        <p className="font-medium text-lg text-slate-500">No products found</p>
                    ) : (
                        <p className="font-medium text-lg text-slate-500">Inventory Empty</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <button 
                        key={product.id} 
                        onClick={() => addToBill(product)}
                        className="bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 p-3 rounded-xl text-left transition-all flex flex-col h-32 justify-between group shadow-sm hover:shadow-md"
                        >
                            <div className="w-full">
                                <p className="font-bold text-slate-700 text-sm line-clamp-2 leading-tight">{product.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{product.unit}</p>
                            </div>
                            <div className="flex justify-between items-end w-full">
                                <span className="font-bold text-emerald-600">₹{product.price.toFixed(2)}</span>
                                <div className="bg-emerald-100 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={14} className="text-emerald-700" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Bill Details */}
      <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-auto">
         <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CreditCard size={20} />
                Current Bill
            </h3>
         </div>
         
         <div className="p-4 border-b border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Select Customer</label>
            <select 
               className="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none"
               value={selectedUser}
               onChange={e => setSelectedUser(e.target.value)}
            >
                <option value="">-- Choose Customer --</option>
                {users
                  .filter(u => u.role === 'CUSTOMER')
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
            </select>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px]">
             {billCart.length === 0 ? (
                 <div className="text-center text-slate-400 py-8 text-sm flex flex-col items-center">
                     <p>Cart is empty</p>
                 </div>
             ) : (
                 billCart.map(item => (
                     <div key={item.id} className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                         <div className="flex-1">
                             <p className="font-bold text-slate-700 line-clamp-1">{item.name}</p>
                             <p className="text-xs text-slate-500">@{item.price.toFixed(2)}</p>
                         </div>
                         <div className="flex items-center gap-3">
                             <div className="flex items-center bg-white rounded-lg border border-slate-200 h-7">
                                <button onClick={() => updateQuantity(item.id, -1)} className="px-2 h-full hover:bg-slate-50 text-slate-600 border-r border-slate-200 flex items-center justify-center"><Minus size={12} /></button>
                                <span className="px-2 text-xs font-bold text-slate-700 min-w-[24px] text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="px-2 h-full hover:bg-slate-50 text-slate-600 border-l border-slate-200 flex items-center justify-center"><Plus size={12} /></button>
                             </div>
                             <span className="font-semibold text-emerald-600 min-w-[50px] text-right">₹{(item.quantity * item.price).toFixed(2)}</span>
                             <button onClick={() => removeFromBill(item.id)} className="text-slate-400 hover:text-red-500 p-1 hover:bg-white rounded">
                                 <Trash2 size={16} />
                             </button>
                         </div>
                     </div>
                 ))
             )}
         </div>

         <div className="p-4 bg-slate-50 border-t border-slate-100">
             <BillCalculator subtotal={subtotal} />
             
             <div className="my-4">
                 <label className="block text-xs font-semibold text-slate-500 mb-1">Amount Paid</label>
                 <input 
                   type="number" 
                   className="w-full p-2 border rounded text-sm outline-none focus:border-emerald-500 transition-colors" 
                   placeholder="0.00"
                   value={amountPaid}
                   onChange={e => setAmountPaid(e.target.value)}
                 />
                 
                 {/* Payment Method Selector */}
                 {parseFloat(amountPaid) > 0 && (
                   <div className="mt-3">
                     <label className="block text-xs font-semibold text-slate-500 mb-2">Payment Method</label>
                     <div className="flex gap-2">
                       <button
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

                 {/* Live Dues Calculation Preview */}
                 <DuesCalculator 
                    totalAmount={total} 
                    amountPaid={parseFloat(amountPaid || '0')} 
                    className="mt-3 text-xs" 
                 />
             </div>

             <button 
               onClick={handleCreateOrder}
               disabled={!selectedUser || billCart.length === 0}
               className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-transform active:scale-[0.99]"
             >
                 Generate Invoice
             </button>
         </div>
      </div>

      {/* Success Modal with PDF & Share Options */}
      {createdOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl animate-fade-in text-center">
                  <div className="mx-auto bg-emerald-100 h-16 w-16 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                      <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">Order Created!</h3>
                  <p className="text-slate-500 text-sm mb-6">Invoice #{createdOrder.id} has been generated.</p>
                  
                  <div className="space-y-3">
                      <button 
                        onClick={generateInvoicePDF}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-sm"
                      >
                          <FileText size={18} /> Download PDF Invoice
                      </button>
                      <button 
                        onClick={shareOnWhatsApp}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-lg font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                      >
                          <Share2 size={18} /> Share on WhatsApp
                      </button>
                      <button 
                        onClick={handleCloseSuccess}
                        className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                      >
                          Close & New Bill
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Billing;