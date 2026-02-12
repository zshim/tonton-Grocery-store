import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Package, Eye, X, ShoppingBag } from 'lucide-react';
import { Order } from '../../types';

const MyOrders = () => {
  const { user, orders } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter orders for the logged-in customer
  const myOrders = orders
    .filter(o => o.customerId === user?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">My Orders</h2>
        <p className="text-slate-500">View and track your past purchases.</p>
      </header>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {myOrders.length === 0 ? (
           <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
              <p>You haven't placed any orders yet.</p>
           </div>
        ) : (
          <div className="divide-y divide-slate-100">
             {myOrders.map(order => (
               <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                     <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                        <Package size={24} />
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <h3 className="font-bold text-slate-800">Order #{order.id}</h3>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                           }`}>
                              {order.status}
                           </span>
                        </div>
                        <p className="text-sm text-slate-500">{new Date(order.date).toLocaleString()}</p>
                        <p className="text-sm font-medium text-slate-700 mt-1">
                           {order.items.length} items • ₹{order.total.toFixed(2)}
                        </p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                  >
                     <Eye size={16} />
                     View Details
                  </button>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-fade-in max-h-[90vh] overflow-hidden flex flex-col">
               <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">Order Details</h3>
                  <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="overflow-y-auto p-4 flex-1">
                  <div className="mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <div className="flex justify-between mb-1">
                        <strong>Order ID:</strong> <span>#{selectedOrder.id}</span>
                     </div>
                     <div className="flex justify-between mb-1">
                        <strong>Date:</strong> <span>{new Date(selectedOrder.date).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between">
                         <strong>Payment Method:</strong> <span>{selectedOrder.paymentMethod || 'N/A'}</span>
                     </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 mb-2">Items Purchased</h4>
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
                     {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 text-sm hover:bg-slate-50">
                           <div>
                              <p className="font-medium text-slate-700">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.quantity} {item.unit} x ₹{item.price.toFixed(2)}</p>
                           </div>
                           <p className="font-medium text-slate-800">₹{(item.quantity * item.price).toFixed(2)}</p>
                        </div>
                     ))}
                  </div>
                  
                  <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                     <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-slate-600">
                        <span>Tax</span>
                        <span>₹{selectedOrder.tax.toFixed(2)}</span>
                     </div>
                     {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                           <span>Discount</span>
                           <span>-₹{selectedOrder.discount.toFixed(2)}</span>
                        </div>
                     )}
                     <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-200 pt-2 mt-2">
                        <span>Total</span>
                        <span>₹{selectedOrder.total.toFixed(2)}</span>
                     </div>
                     {selectedOrder.status !== 'PAID' && (
                        <div className="flex justify-between text-red-600 text-xs font-medium pt-1">
                           <span>Amount Paid</span>
                           <span>₹{selectedOrder.amountPaid.toFixed(2)}</span>
                        </div>
                     )}
                  </div>
               </div>

               <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                  <button 
                     onClick={() => setSelectedOrder(null)}
                     className="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors shadow-sm"
                  >
                     Close
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default MyOrders;