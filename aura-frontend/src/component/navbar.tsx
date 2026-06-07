import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingBag, Heart, Menu, X, User, 
  ChevronDown, Zap, Minus, Plus, Trash2, ArrowLeft 
} from 'lucide-react';
import { useAura } from '../context/AuraContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { user, cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useAura();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalItemsCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const [checkoutForm, setCheckoutForm] = useState({
    fullName: user?.fullName || '',
    phone: '',
    city: 'Dubai',
    address: ''
  });

  useEffect(() => {
    if (user) setCheckoutForm(prev => ({ ...prev, fullName: user.fullName }));
  }, [user]);

  const navItems = [
    { name: 'New In', path: '/products/new-in' },
    { name: 'Sales', path: '/products/sales', isSale: true },
    { name: 'Tops', path: '/products/tops' },
    { name: 'Bottoms', path: '/products/bottoms' },
    { name: 'Sets', path: '/products/sets' },
  ];

  // --- 1. THE GATEKEEPER LOGIC ---
  const handleProceedToCheckout = () => {
    if (!user || !user.isLoggedIn) {
      toast.error("An Aura account is required to place an order.", {
        style: { background: '#5d4037', color: '#fff', fontSize: '12px' }
      });
      setIsCartOpen(false); // Close the bag
      navigate('/auth');    // Send to Login/Register
      return;
    }
    setIsCheckingOut(true);
  };

  // --- 2. FINAL ORDER HANDLER ---
  const handleConfirmOrder = async () => {
    // Security check again just in case
    if (!user?.isLoggedIn) {
      navigate('/auth');
      return;
    }

    if (!checkoutForm.phone || !checkoutForm.address) {
      toast.error("Please provide delivery details");
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      UserEmail: user.email, 
      CustomerName: checkoutForm.fullName,
      Phone: checkoutForm.phone,
      Address: `${checkoutForm.address}, ${checkoutForm.city}`,
      TotalAmount: cartTotal,
      Items: cart.map(item => `${item.quantity}x ${ item.Name}`).join(", "),
      Status: "Pending"
    };

    try {
      const response = await fetch('http://localhost:5058/api/Orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        toast.success("Order Placed! Our team will contact you shortly.");
        clearCart();
        closeCart();
      } else {
        toast.error("Cloud connection issue. Please try again.");
      }
    } catch (error) {
      toast.error("Check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCart = () => {
    setIsCartOpen(false);
    setTimeout(() => setIsCheckingOut(false), 300);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-aura-nude">
        <div className="px-4 md:px-10 py-3 md:py-5 flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center">
            <button className="md:hidden text-aura-brown p-1" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/" className="hidden md:flex flex-col group">
              <h1 className="text-2xl font-serif tracking-[0.2em] text-aura-brown leading-none uppercase">Aura</h1>
              <p className="text-[7px] tracking-[0.3em] uppercase font-bold text-aura-tan">Boutique</p>
            </Link>
          </div>

          <div className="hidden md:flex flex-[2] justify-center">
            <div className="relative w-full max-w-md group">
              <input type="text" placeholder="Search for elegant styles..." className="w-full bg-aura-beige/40 border border-aura-nude rounded-full py-2.5 px-10 text-[11px] outline-none focus:border-aura-tan focus:bg-white transition-all text-aura-brown" />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aura-tan group-focus-within:text-aura-brown" size={14} />
            </div>
          </div>

          <Link to="/" className="md:hidden absolute left-1/2 -translate-x-1/2 text-center">
             <h1 className="text-xl font-serif tracking-widest text-aura-brown">AURA</h1>
          </Link>

          <div className="flex-1 flex items-center justify-end gap-3 md:gap-6 text-aura-brown">
            <Link to={user ? "/profile" : "/auth"} className="hidden md:block hover:text-aura-tan transition-colors">
              <User size={20} />
            </Link>
            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-aura-tan transition-colors">
              <ShoppingBag size={20} />
              <span className="absolute -top-1.5 -right-1.5 bg-aura-brown text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalItemsCount}
              </span>
            </button>
          </div>
        </div>

        <div className="hidden md:flex justify-center gap-10 py-3 bg-aura-beige/20 border-t border-aura-nude/10 text-[9px] tracking-[0.2em] font-bold text-aura-brown uppercase">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`hover:text-aura-tan transition-colors ${item.isSale ? 'text-red-800 font-black' : ''}`}>
              {item.name}
            </Link>
          ))}
        </div>
      </header>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart} className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white z-[70] shadow-2xl flex flex-col">
              
              <div className="p-6 border-b flex justify-between items-center bg-aura-beige/10">
                <div className="flex items-center gap-3">
                   {isCheckingOut && <button onClick={() => setIsCheckingOut(false)} className="hover:text-aura-tan"><ArrowLeft size={18}/></button>}
                   <h2 className="text-sm font-bold tracking-widest uppercase">{isCheckingOut ? 'Checkout' : `Your Bag (${totalItemsCount})`}</h2>
                </div>
                <button onClick={closeCart}><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {!isCheckingOut ? (
                  <div className="space-y-8">
                    {cart.length === 0 ? (
                      <div className="py-20 text-center italic text-stone-400 font-serif">Your bag is currently empty.</div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="flex gap-4 group animate-in slide-in-from-right-4 duration-300">
                          <img src={ item.Img} className="w-20 h-28 object-cover rounded-sm bg-stone-50" alt="" />
                          <div className="flex-1 flex flex-col justify-between py-1">
                             <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-[10px] font-bold uppercase tracking-tight text-gray-800">{ item.Name}</h4>
                                  <p className="text-xs font-bold text-aura-brown mt-1">{item.Price }.00 AED</p>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-800 transition"><Trash2 size={14}/></button>
                             </div>
                             <div className="flex items-center border border-aura-nude/40 w-fit rounded-full px-2 py-1 gap-4">
                                <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-aura-tan"><Minus size={10}/></button>
                                <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-aura-tan"><Plus size={10}/></button>
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-1">
                       <h3 className="font-serif text-lg italic text-aura-brown leading-none">Delivery Information</h3>
                       <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest border-b border-aura-nude/30 pb-4">Safe Cash on Delivery</p>
                    </div>
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-gray-400">Full Name</label>
                          <input type="text" value={checkoutForm.fullName} onChange={e => setCheckoutForm({...checkoutForm, fullName: e.target.value})} className="w-full bg-aura-beige/20 border border-aura-nude p-3 text-xs outline-none focus:border-aura-brown" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-gray-400">Phone Number</label>
                          <div className="flex gap-2">
                             <div className="bg-stone-50 border border-aura-nude px-3 py-3 text-xs text-stone-400 flex items-center font-bold">+971</div>
                             <input type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} placeholder="50 123 4567" className="flex-1 bg-aura-beige/20 border border-aura-nude p-3 text-xs outline-none focus:border-aura-brown" />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-gray-400">City</label>
                          <select value={checkoutForm.city} onChange={e => setCheckoutForm({...checkoutForm, city: e.target.value})} className="w-full bg-aura-beige/20 border border-aura-nude p-3 text-xs outline-none">
                             <option value="Dubai">Dubai</option><option value="Abu Dhabi">Abu Dhabi</option><option value="Sharjah">Sharjah</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-gray-400">Address Details</label>
                          <textarea rows={3} value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} placeholder="Area, Street, Villa/Apt No." className="w-full bg-aura-beige/20 border border-aura-nude p-3 text-xs outline-none resize-none" />
                       </div>
                    </form>
                  </motion.div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 border-t border-aura-nude bg-white">
                   {!isCheckingOut ? (
                     <>
                        <div className="flex justify-between items-center mb-6">
                           <span className="text-lg font-serif italic text-aura-brown">Bag Total</span>
                           <span className="text-xl font-bold">{cartTotal}.00 AED</span>
                        </div>
                        <button 
                          onClick={handleProceedToCheckout} // REDIRECT IF NOT LOGGED IN
                          className="w-full bg-black text-white py-5 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-aura-brown transition-all shadow-xl"
                        >
                          Proceed to Checkout
                        </button>
                     </>
                   ) : (
                     <div className="space-y-4">
                        <div className="bg-green-50/50 p-4 rounded-xl flex items-center gap-3 border border-green-100">
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                           <p className="text-[9px] font-bold uppercase tracking-widest text-green-800">Cash on Delivery - Total: {cartTotal} AED</p>
                        </div>
                        <button 
                          onClick={handleConfirmOrder}
                          disabled={isSubmitting} 
                          className="w-full bg-aura-brown text-white py-5 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-black transition-all shadow-xl flex justify-center items-center"
                        >
                          {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm Order"}
                        </button>
                     </div>
                   )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <Zap className={className} size={16} />
);

export default Navbar;