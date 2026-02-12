import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  ShoppingCart, LogOut, LayoutDashboard, Package, 
  User as UserIcon, ChefHat, Menu, X, DollarSign, 
  FileText, Bell, History, Calculator, Phone, Tag 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const { user, logout, cart, notifications } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isManager = user?.role === UserRole.MANAGER;
  const unreadNotifications = notifications.filter(n => n.userId === user?.id && !n.isRead).length;

  // Manager Number (Store) and Support Number (Mock)
  const STORE_PHONE = '9999999999';
  const SUPPORT_PHONE = '1800123456';

  const NavItem = ({ page, icon: Icon, label }: { page: string, icon: any, label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
        activePage === page 
          ? 'bg-emerald-600 text-white shadow-md' 
          : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // Desktop Sidebar User Profile Component
  const UserProfileSection = () => (
    <div className="flex items-center gap-3 mb-4 px-2">
      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
        {user?.name.charAt(0)}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm font-semibold text-slate-700 truncate">{user?.name}</p>
        <p className="text-xs text-slate-500 truncate mb-1">{user?.email}</p>
        <a 
          href={`tel:${isManager ? SUPPORT_PHONE : STORE_PHONE}`}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors"
        >
          <Phone size={10} fill="currentColor" className="opacity-80" />
          {isManager ? 'Call Support' : 'Call Store'}
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
            <Package className="h-8 w-8" />
            ton2Store
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
            {isManager ? 'Manager Portal' : 'Customer App'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {isManager ? (
            <>
              <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem page="products" icon={Tag} label="Products" />
              <NavItem page="inventory" icon={Package} label="Inventory" />
              <NavItem page="billing" icon={Calculator} label="Billing / POS" />
              <NavItem page="orders" icon={FileText} label="Orders" />
              <NavItem page="history" icon={History} label="Transactions" />
            </>
          ) : (
            <>
              <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem page="shop" icon={Package} label="Shop" />
              <NavItem page="cart" icon={ShoppingCart} label="Cart" />
              <NavItem page="orders" icon={FileText} label="My Orders" />
              <NavItem page="assistant" icon={ChefHat} label="Smart Chef" />
              <NavItem page="history" icon={History} label="History & Dues" />
            </>
          )}
          <div className="pt-4 border-t border-slate-100 mt-4">
             <div className="relative">
                <NavItem page="notifications" icon={Bell} label="Notifications" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-3 right-4 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
             </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <UserProfileSection />
          <button 
            onClick={logout}
            className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
           {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
        <span className="font-bold text-lg text-emerald-700">ton2Store</span>
        <div className="relative">
           <button onClick={() => onNavigate('notifications')}>
             <Bell className="text-slate-600" />
             {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
             )}
           </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-40 pt-20 px-4 flex flex-col h-full animate-fade-in">
           <nav className="space-y-2 flex-1 overflow-y-auto">
            {isManager ? (
              <>
                <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem page="products" icon={Tag} label="Products" />
                <NavItem page="inventory" icon={Package} label="Inventory" />
                <NavItem page="billing" icon={Calculator} label="Billing / POS" />
                <NavItem page="orders" icon={FileText} label="Orders" />
                <NavItem page="history" icon={History} label="Transactions" />
              </>
            ) : (
              <>
                <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem page="shop" icon={Package} label="Shop" />
                <NavItem page="cart" icon={ShoppingCart} label="Cart" />
                <NavItem page="orders" icon={FileText} label="My Orders" />
                <NavItem page="assistant" icon={ChefHat} label="Smart Chef" />
                <NavItem page="history" icon={History} label="History & Dues" />
              </>
            )}
             <NavItem page="notifications" icon={Bell} label="Notifications" />
          </nav>
          
          <div className="pb-8 border-t border-slate-100 pt-4">
             {/* Mobile User Profile Section */}
             <div className="flex items-center gap-3 px-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                  {user?.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-700 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
             </div>

             {/* Mobile Action Buttons */}
             <div className="grid grid-cols-2 gap-3">
                 <a 
                   href={`tel:${isManager ? SUPPORT_PHONE : STORE_PHONE}`}
                   className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-100"
                 >
                    <Phone size={16} />
                    {isManager ? 'Support' : 'Call Store'}
                 </a>
                 <button 
                   onClick={logout} 
                   className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-100"
                 >
                    <LogOut size={16} />
                    Sign Out
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-0 p-4 md:p-8 overflow-y-auto h-[calc(100vh-4rem)] md:h-screen bg-slate-50 md:ml-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Floating Cart Button (Customer Only) */}
      {!isManager && (
        <button
          onClick={() => onNavigate('cart')}
          className="fixed bottom-6 right-6 h-14 w-14 bg-emerald-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-emerald-700 transition-transform hover:scale-105 z-30"
        >
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-white">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default Layout;