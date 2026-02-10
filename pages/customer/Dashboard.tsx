import React from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, ShoppingCart, Clock, TrendingUp, Truck } from 'lucide-react';

const CustomerDashboard = () => {
  const { user, orders, transactions, advertisementMessage } = useApp();
  
  const myOrders = orders.filter(o => o.customerId === user?.id);
  const totalSpent = myOrders.reduce((acc, curr) => acc + curr.total, 0);
  const lastOrder = myOrders.length > 0 ? myOrders[0] : null;

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
    <div className="space-y-8">
      {/* Advertisement Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-lg flex items-center gap-4 animate-fade-in">
        <div className="bg-white/20 p-3 rounded-full">
            <Truck className="h-6 w-6" />
        </div>
        <div>
            <h3 className="font-bold text-lg">Store Announcement</h3>
            <p className="text-indigo-100 font-medium">{advertisementMessage}</p>
        </div>
      </div>

       <header>
        <h2 className="text-2xl font-bold text-slate-800">Hello, {user?.name}!</h2>
        <p className="text-slate-500">Welcome back to your personal grocery hub.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Pending Dues" 
          value={`₹${user?.pendingDues.toFixed(2)}`} 
          icon={Clock} 
          color={user?.pendingDues && user.pendingDues > 0 ? "bg-red-500" : "bg-emerald-500"} 
        />
        <StatCard 
          title="Total Orders" 
          value={myOrders.length} 
          icon={ShoppingCart} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Spent" 
          value={`₹${totalSpent.toFixed(2)}`} 
          icon={TrendingUp} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Recent Orders */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Orders</h3>
            {myOrders.length === 0 ? (
                <p className="text-slate-500 text-sm">No orders yet.</p>
            ) : (
                <div className="space-y-4">
                    {myOrders.slice(0, 3).map(order => (
                        <div key={order.id} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0">
                            <div>
                                <p className="font-medium text-slate-800">Order #{order.id.slice(-4)}</p>
                                <p className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-emerald-600">₹{order.total.toFixed(2)}</p>
                                <span className={`text-[10px] px-2 py-1 rounded-full ${
                                    order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>
         
         {/* Active Status */}
         <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md p-6 text-white">
            <h3 className="text-lg font-bold mb-2">Account Status</h3>
            {user?.pendingDues && user.pendingDues > 0 ? (
                <div>
                   <p className="opacity-90 mb-4">You have outstanding dues on your account.</p>
                   <div className="text-3xl font-bold mb-4">₹{user.pendingDues.toFixed(2)}</div>
                   <p className="text-xs opacity-75">Please visit the store or use the Payment History page to track your dues.</p>
                </div>
            ) : (
                <div className="h-full flex flex-col justify-center">
                   <p className="text-xl font-medium">All caught up!</p>
                   <p className="opacity-80">You have zero pending dues. Happy shopping!</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;