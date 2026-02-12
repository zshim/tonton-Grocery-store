import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { analyzeSalesTrends } from '../../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, AlertCircle, IndianRupee, Users, BrainCircuit, BellRing, Send, X, Truck, Edit2, Check, ShoppingCart, Package, Banknote, Smartphone } from 'lucide-react';
import { Order, PaymentMethod } from '../../types';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { orders, users, notifications, user, sendReminders, advertisementMessage, updateAdvertisement, setBillingOrder } = useApp();
  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Advertisement Edit State
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [tempAdText, setTempAdText] = useState("");
  
  // Reminder Modal State
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');

  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Computed Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingDuesTotal = users.reduce((sum, u) => sum + u.pendingDues, 0);
  const totalOrders = orders.length;
  
  // Filter notifications for the logged-in manager (System notifications usually order alerts)
  const recentOrderNotifications = notifications
    .filter(n => n.userId === user?.id && n.title.includes('Order'))
    .slice(0, 5); // Show latest 5

  // Chart Data Preparation
  const salesByDate = orders.reduce((acc: any, order) => {
    const date = order.date.split('T')[0];
    acc[date] = (acc[date] || 0) + order.total;
    return acc;
  }, {});

  const chartData = Object.keys(salesByDate).map(date => ({
    date,
    sales: salesByDate[date]
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const result = await analyzeSalesTrends(orders);
    setInsight(result);
    setLoadingInsight(false);
  };

  const handleSendReminders = (e: React.FormEvent) => {
    e.preventDefault();
    const count = sendReminders(reminderMsg);
    alert(`Successfully sent reminders to ${count} customers with pending dues.`);
    setShowReminderModal(false);
    setReminderMsg('');
  };
  
  const saveAdChange = () => {
      updateAdvertisement(tempAdText);
      setIsEditingAd(false);
  };

  const handleNotificationClick = (message: string) => {
    // Extract Order ID from message "Order #o123 placed by..."
    const match = message.match(/Order #([^\s]+)/);
    if (match && match[1]) {
        // Clean up any trailing punctuation if present
        const orderId = match[1].replace(/[^a-zA-Z0-9_]/g, '');
        const foundOrder = orders.find(o => o.id === orderId);
        
        if (foundOrder) {
            if (onNavigate) {
               // Redirect to Billing with pre-filled info
               setBillingOrder(foundOrder);
               onNavigate('billing');
            } else {
               // Fallback if no navigation prop
               setSelectedOrder(foundOrder);
            }
        }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Advertisement Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg p-3 text-white shadow-sm flex items-center justify-between gap-2 animate-fade-in">
        <div className="flex items-center gap-2 flex-1">
            <Truck size={20} className="flex-shrink-0" />
            {isEditingAd ? (
                <input 
                    value={tempAdText}
                    onChange={(e) => setTempAdText(e.target.value)}
                    className="bg-white/20 text-white placeholder-white/70 border-none outline-none rounded px-2 py-1 w-full font-semibold focus:ring-2 focus:ring-white/50"
                    autoFocus
                    placeholder="Enter advertisement message..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') saveAdChange();
                        if (e.key === 'Escape') setIsEditingAd(false);
                    }}
                />
            ) : (
                <p className="font-semibold">{advertisementMessage}</p>
            )}
        </div>
        <div className="flex gap-2">
            {isEditingAd ? (
                <>
                    <button onClick={saveAdChange} className="p-1 hover:bg-white/20 rounded text-white" title="Save">
                        <Check size={18} />
                    </button>
                    <button onClick={() => setIsEditingAd(false)} className="p-1 hover:bg-white/20 rounded text-white" title="Cancel">
                        <X size={18} />
                    </button>
                </>
            ) : (
                <button 
                    onClick={() => { setTempAdText(advertisementMessage); setIsEditingAd(true); }} 
                    className="p-1 hover:bg-white/20 rounded text-white" 
                    title="Edit Advertisement"
                >
                    <Edit2 size={16} />
                </button>
            )}
        </div>
      </div>

      <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Store Performance</h2>
          <p className="text-slate-500">Overview of your grocery business metrics.</p>
        </div>
        <button 
          onClick={() => setShowReminderModal(true)}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium"
        >
           <BellRing size={16} />
           Send Dues Reminders
        </button>
      </header>

      {/* Notifications Section - New Addition */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BellRing className="text-emerald-600" size={20} />
            Recent Order Activity
        </h3>
        <div className="space-y-3">
            {recentOrderNotifications.length === 0 ? (
                <p className="text-slate-500 text-sm">No new orders recently.</p>
            ) : (
                recentOrderNotifications.map(note => (
                    <div 
                        key={note.id} 
                        onClick={() => handleNotificationClick(note.message)}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group"
                        title="Click to view order details"
                    >
                        <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 mt-1 group-hover:bg-emerald-200 transition-colors">
                           <ShoppingCart size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">{note.title}</p>
                            <p className="text-xs text-slate-600">{note.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(note.date).toLocaleString()}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${totalRevenue.toFixed(2)}`} 
          icon={IndianRupee} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Pending Dues" 
          value={`₹${pendingDuesTotal.toFixed(2)}`} 
          icon={AlertCircle} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Total Orders" 
          value={totalOrders} 
          icon={TrendingUp} 
          color="bg-blue-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sales Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BrainCircuit className="text-purple-600" />
              AI Insights
            </h3>
            <button
              onClick={handleGenerateInsight}
              disabled={loadingInsight}
              className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium hover:bg-purple-100 disabled:opacity-50"
            >
              {loadingInsight ? 'Analyzing...' : 'Refresh Analysis'}
            </button>
          </div>
          
          <div className="flex-1 bg-slate-50 rounded-lg p-4 text-slate-700 text-sm leading-relaxed">
            {insight ? (
              <div dangerouslySetInnerHTML={{ __html: insight.replace(/\n/g, '<br/>') }} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BrainCircuit className="h-10 w-10 mb-2 opacity-50" />
                <p>Click "Refresh Analysis" to get AI-powered insights on your sales.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BellRing size={20} className="text-amber-500" />
                    Send Payment Reminders
                 </h3>
                 <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleSendReminders}>
                  <div className="mb-4">
                     <p className="text-sm text-slate-600 mb-3">
                        This will send a push notification to all customers who currently have pending dues.
                     </p>
                     <label className="block text-xs font-semibold text-slate-500 mb-2">Custom Message (Optional)</label>
                     <textarea 
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                        placeholder="e.g., Dear customer, please clear your dues by this weekend."
                        value={reminderMsg}
                        onChange={(e) => setReminderMsg(e.target.value)}
                     />
                     <p className="text-xs text-slate-400 mt-2">
                        If left blank, a default message with the exact due amount will be sent.
                     </p>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-2">
                     <button 
                        type="button" 
                        onClick={() => setShowReminderModal(false)}
                        className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg font-medium"
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-sm"
                     >
                        <Send size={14} />
                        Broadcast Now
                     </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* Order Details Modal (Launched from Notification fallback) */}
      {selectedOrder && !onNavigate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="text-emerald-600" size={24} />
                            Order Details
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            ID: <span className="font-mono font-medium text-slate-700">#{selectedOrder.id}</span>
                            <span className="mx-2">•</span>
                            {new Date(selectedOrder.date).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-6 space-y-6">
                    {/* Customer & Status Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Customer Information</h4>
                            <p className="font-semibold text-slate-800">{selectedOrder.customerName}</p>
                            <div className="text-sm text-slate-500 mt-1">
                                Customer ID: {selectedOrder.customerId}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Order Status</h4>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Payment Status:</span>
                                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                                        selectedOrder.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                        selectedOrder.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Method:</span>
                                    <span className="font-medium text-slate-800 flex items-center gap-1">
                                      {selectedOrder.paymentMethod && selectedOrder.paymentMethod !== 'N/A' && (
                                        selectedOrder.paymentMethod === PaymentMethod.CASH ? <Banknote size={14} /> : <Smartphone size={14} />
                                      )}
                                      {selectedOrder.paymentMethod || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Items Purchased</h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-600">Product</th>
                                        <th className="p-3 font-semibold text-slate-600 text-center">Qty</th>
                                        <th className="p-3 font-semibold text-slate-600 text-right">Price</th>
                                        <th className="p-3 font-semibold text-slate-600 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedOrder.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="p-3">
                                                <div className="font-medium text-slate-800">{item.name}</div>
                                                <div className="text-xs text-slate-500">{item.unit}</div>
                                            </td>
                                            <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                                            <td className="p-3 text-right text-slate-600">₹{item.price.toFixed(2)}</td>
                                            <td className="p-3 text-right font-medium text-slate-800">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex justify-end">
                        <div className="w-full sm:w-1/2 bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Tax</span>
                                <span>₹{selectedOrder.tax.toFixed(2)}</span>
                            </div>
                            {selectedOrder.discount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>Discount</span>
                                    <span>-₹{selectedOrder.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800 text-lg">
                                <span>Total</span>
                                <span>₹{selectedOrder.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600 pt-1">
                                <span>Amount Paid</span>
                                <span className="font-medium text-emerald-600">₹{selectedOrder.amountPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Balance Due</span>
                                <span className={`font-medium ${selectedOrder.total - selectedOrder.amountPaid > 0.1 ? 'text-red-600' : 'text-slate-400'}`}>
                                    ₹{(selectedOrder.total - selectedOrder.amountPaid).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button 
                        onClick={() => setSelectedOrder(null)}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm"
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

export default Dashboard;