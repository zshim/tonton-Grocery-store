import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { analyzeSalesTrends } from '../../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, AlertCircle, IndianRupee, Users, BrainCircuit, BellRing, Send, X, Truck, Edit2, Check } from 'lucide-react';

const Dashboard = () => {
  const { orders, users, sendReminders, advertisementMessage, updateAdvertisement } = useApp();
  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Advertisement Edit State
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [tempAdText, setTempAdText] = useState("");
  
  // Reminder Modal State
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');

  // Computed Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingDuesTotal = users.reduce((sum, u) => sum + u.pendingDues, 0);
  const totalOrders = orders.length;
  
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
    </div>
  );
};

export default Dashboard;