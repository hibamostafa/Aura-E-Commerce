import React, { useState } from 'react';
import { useAura } from '../context/AuraContext'; // Context containing the fixes
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const LOGO_URL = "/logo.png"; 

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Grab login and register from your updated Context
  const { login, register } = useAura(); 
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Clean transition handler when switching sign-in/register tabs
  const handleToggleTab = (loginMode: boolean) => {
    setIsLogin(loginMode);
    // Clear the name field to keep state clean across toggles
    setFormData(prev => ({ ...prev, name: '' }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!isLogin) {
        // Real registration (Talks to .NET backend)
        if (!formData.name.trim()) {
          toast.error("Full Name is required");
          return;
        }

        const result = await register(formData.name, formData.email, formData.password);
        
        if (result.success) {
          toast.success("Account created! Welcome to Aura.");
          navigate('/profile'); 
        } else {
          toast.error(result.message || "Registration failed");
        }
      } else {
        // Real login
        const result = await login(formData.email, formData.password);
        if (result.success) {
          toast.success("Welcome back");
          navigate('/profile');
        } else {
          toast.error(result.message || "Invalid email or password");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 py-12 relative overflow-hidden bg-aura-beige">
      
      {/* DECORATIVE BUTTERFLIES */}
      <div className="absolute left-[-5%] top-1/2 -translate-y-1/2 w-[400px] opacity-10 pointer-events-none z-0">
        <img src={LOGO_URL} className="w-[200%] max-w-none translate-x-[-10%]" alt="" />
      </div>
      <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[400px] opacity-10 pointer-events-none z-0 scale-x-[-1]">
        <img src={LOGO_URL} className="w-[200%] max-w-none translate-x-[-10%]" alt="" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-aura-nude overflow-hidden"
      >
        {/* Toggle Bar */}
        <div className="flex border-b border-aura-nude bg-white/50">
          <button 
            type="button"
            onClick={() => handleToggleTab(true)} 
            className={`flex-1 py-6 text-[10px] font-bold tracking-[0.3em] transition-all ${isLogin ? 'text-aura-brown' : 'text-stone-300'}`}
          >
            SIGN IN
          </button>
          <button 
            type="button"
            onClick={() => handleToggleTab(false)} 
            className={`flex-1 py-6 text-[10px] font-bold tracking-[0.3em] transition-all ${!isLogin ? 'text-aura-brown' : 'text-stone-300'}`}
          >
            REGISTER
          </button>
        </div>

        <div className="p-8 md:p-12">
          <h2 className="text-3xl font-serif text-aura-brown italic text-center mb-10">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  key="name-input"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="relative overflow-hidden"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-tan/50" size={18} />
                  <input 
                    required={!isLogin}
                    type="text" 
                    placeholder="Full Name"
                    value={formData.name} // Controlled value
                    className="w-full pl-12 pr-4 py-4 bg-white border border-aura-nude rounded-2xl outline-none focus:border-aura-brown text-sm"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-tan/50" size={18} />
              <input 
                required 
                type="email" 
                placeholder="Email" 
                value={formData.email} // Controlled value
                className="w-full pl-12 pr-4 py-4 bg-white border border-aura-nude rounded-2xl outline-none focus:border-aura-brown text-sm" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-tan/50" size={18} />
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={formData.password} // Controlled value
                className="w-full pl-12 pr-12 py-4 bg-white border border-aura-nude rounded-2xl outline-none focus:border-aura-brown text-sm" 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-aura-tan/50">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="w-full bg-aura-brown text-white py-5 rounded-2xl font-bold tracking-[0.2em] uppercase shadow-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
            >
              {isSubmitting ? 'Processing...' : isLogin ? 'Enter' : 'Create Account'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;