import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Phone, User, ArrowRight, KeyRound, Loader2, Edit2 } from 'lucide-react';
import { UserRole } from '../types';

const Login = () => {
  const { loginWithPhone, register, sendOtp, verifyOtp } = useApp();
  
  // Tabs: 'LOGIN' | 'REGISTER'
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Steps: 'PHONE' | 'OTP'
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  
  // Form State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.CUSTOMER);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    const success = await sendOtp(phone);
    setIsLoading(false);

    if (success) {
      setStep('OTP');
    } else {
      setError('Failed to send OTP. Try again.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    setIsLoading(true);
    const isValid = await verifyOtp(phone, otp);
    setIsLoading(false);

    if (!isValid) {
      setError('Invalid OTP code.');
      return;
    }

    if (mode === 'LOGIN') {
      const success = loginWithPhone(phone);
      if (!success) {
        setError('Account not found. Please Sign Up.');
        setMode('REGISTER');
        setStep('PHONE'); // Or keep OTP and ask for Name? Better to restart flow or just ask for name.
        // For simplicity, let's keep them on the OTP screen but show error, or redirect to register.
        // Let's redirect to register form but keep the phone number.
      }
    } else {
      // Register Mode
      if (!regName) {
        setError('Name is required.');
        return;
      }
      register(regName, phone, regRole);
    }
  };

  const resetFlow = (newMode: 'LOGIN' | 'REGISTER') => {
    setMode(newMode);
    setStep('PHONE');
    setError('');
    setOtp('');
    // Keep phone number if switching? Optional. Let's keep it.
  };

  const changePhone = () => {
    setStep('PHONE');
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">
            {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 mt-2">
            {step === 'PHONE' 
              ? (mode === 'LOGIN' ? 'Log in with your phone number' : 'Join ton2Store today') 
              : `Enter the code sent to ${phone}`}
          </p>
        </div>

        <form onSubmit={step === 'PHONE' ? handleSendOtp : handleVerify} className="space-y-6">
          
          {/* Registration Fields (Show only in PHONE step of Register mode) */}
          {mode === 'REGISTER' && step === 'PHONE' && (
             <div className="space-y-4 animate-fade-in">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
                   <select 
                     value={regRole} 
                     onChange={(e) => setRegRole(e.target.value as UserRole)}
                     className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                   >
                     <option value={UserRole.CUSTOMER}>Customer</option>
                     <option value={UserRole.MANAGER}>Store Manager</option>
                   </select>
                 </div>
             </div>
          )}

          {/* Phone Input (Show if Step is PHONE) */}
          {step === 'PHONE' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Only numbers
                  maxLength={10}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none tracking-widest font-medium"
                  placeholder="9876543210"
                />
              </div>
            </div>
          )}

          {/* OTP Input (Show if Step is OTP) */}
          {step === 'OTP' && (
            <div className="animate-fade-in">
               <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-slate-700">Verification Code</label>
                 <button type="button" onClick={changePhone} className="text-xs text-emerald-600 flex items-center gap-1 hover:underline">
                    <Edit2 size={12} /> Change Number
                 </button>
               </div>
               <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                 <input
                   type="text"
                   required
                   value={otp}
                   onChange={(e) => setOtp(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none tracking-[1em] font-bold text-center"
                   placeholder="------"
                   maxLength={6}
                   autoFocus
                 />
               </div>
               <p className="text-xs text-slate-400 mt-2 text-center">Use demo code: <span className="font-bold text-slate-600">123456</span></p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
               <Loader2 className="animate-spin h-5 w-5" />
            ) : (
               <>
                 {step === 'PHONE' ? 'Get OTP' : (mode === 'LOGIN' ? 'Verify & Login' : 'Verify & Register')}
                 <ArrowRight size={18} />
               </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => resetFlow(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
          >
            {mode === 'LOGIN' 
              ? "Don't have an account? Sign Up" 
              : "Already have an account? Sign In"}
          </button>
        </div>

        {step === 'PHONE' && mode === 'LOGIN' && (
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-2">DEMO NUMBERS</p>
            <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Managers</p>
                    <button onClick={() => setPhone('9999999999')} className="block w-full text-xs text-emerald-600 hover:underline py-0.5 text-left">Admin (999...99)</button>
                    <button onClick={() => setPhone('9999999998')} className="block w-full text-xs text-emerald-600 hover:underline py-0.5 text-left">Sarah (999...98)</button>
                    <button onClick={() => setPhone('9999999997')} className="block w-full text-xs text-emerald-600 hover:underline py-0.5 text-left">Mike (999...97)</button>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customers</p>
                    <button onClick={() => setPhone('1234567890')} className="block w-full text-xs text-emerald-600 hover:underline py-0.5 text-left">John (123...90)</button>
                    <button onClick={() => setPhone('9876543211')} className="block w-full text-xs text-emerald-600 hover:underline py-0.5 text-left">Alice (987...11)</button>
                    <button onClick={() => setPhone('9876543213')} className="block w-full text-xs text-emerald-600 hover:underline py-0.5 text-left">Charlie (987...13)</button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;