import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingBag, Heart, Menu, X, User, 
  Zap, Minus, Plus, Trash2, ArrowLeft 
} from 'lucide-react';
import { useAura } from '../context/AuraContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { user, cart, removeFromCart, updateQuantity, cartTotal, clearCart, register } = useAura();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- INSTANT SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
    { name: 'Dresses', path: '/products/dresses' }, 
    { name: 'Tops', path: '/products/tops' },
    { name: 'Bottoms', path: '/products/bottoms' },
    { name: 'Sets', path: '/products/sets' },
  ];

  // --- FETCH PRODUCTS ONCE FOR INSTANT SEARCH CACHING (WITH RETRIES) ---
  useEffect(() => {
    let isMounted = true;

    const fetchWithRetry = async (url: string, retriesOrOptions: number | RequestInit = 2, maybeOptions?: RequestInit): Promise<any> => {
      // support calling fetchWithRetry(url, retries), fetchWithRetry(url, options),
      // or fetchWithRetry(url, retries, options) for recursive calls
      let retries: number;
      let options: RequestInit | undefined;
      if (typeof retriesOrOptions === 'number') {
        retries = retriesOrOptions;
        options = maybeOptions;
      } else {
        retries = 2;
        options = retriesOrOptions;
      }

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Server Error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        if (retries > 0 && isMounted) {
          await new Promise(resolve => setTimeout(resolve, 300));
          return fetchWithRetry(url, retries - 1, options);
        }
        throw err;
      }
    };

    const loadSearchCatalog = async () => {
      const API_BASE_URL = process.env.REACT_APP_API_URL?.replace(/\/+$/, '') || 'https://aura-backend-s64s.onrender.com/api';
      const primaryEndpoint = `${API_BASE_URL}/Products`;
      const proxyEndpoint = '/api/Products';
      const requestOptions: RequestInit = {
        method: 'GET',
        mode: 'cors',
        headers: { Accept: 'application/json' },
      };

      const loadFromEndpoint = async (endpoint: string) => {
        const data = await fetchWithRetry(endpoint, requestOptions);
        if (isMounted) {
          setAllProducts(Array.isArray(data) ? data : []);
        }
      };

      try {
        await loadFromEndpoint(primaryEndpoint);
      } catch (e) {
        console.warn(`Primary product fetch failed. Retrying via local proxy (${primaryEndpoint}).`, e);
        try {
          await loadFromEndpoint(proxyEndpoint);
        } catch (proxyError) {
          console.error(`Failed to load search catalog after retries (${proxyEndpoint}):`, proxyError);
        }
      }
    };
    loadSearchCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- FILTER LOCAL PRODUCTS DYNAMICALLY ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([]);
      return;
    }
    const queryLower = searchQuery.toLowerCase();
    const matches = allProducts.filter(product => 
      (product.Name || product.name || '').toLowerCase().includes(queryLower) ||
      (product.Category || product.category || '').toLowerCase().includes(queryLower)
    );
    setFilteredProducts(matches.slice(0, 5));
  }, [searchQuery, allProducts]);

  // --- CLICK OUTSIDE TO CLOSE SEARCH DROPDOWN ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- SMART SUBMIT ---
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredProducts.length > 0) {
      const match = filteredProducts[0];
      navigate(`/product/${match.Id || match.id}`);
      setIsSearchFocused(false);
      setSearchQuery('');
    } else {
      toast.error("No items found matching that query.", {
        style: { background: '#5d4037', color: '#fff', fontSize: '11px' }
      });
    }
  };

  const handleProfileClick = async () => {
    if (!user || !user.isLoggedIn) {
      const guestId = Date.now();
      const guestEmail = `guest${guestId}@aura.guest`;
      const guestPassword = `Aura${Math.random().toString(36).slice(2, 10)}!`;
      const result = await register('Aura Guest', guestEmail, guestPassword);
      if (!result.success) {
        toast.error(result.message || "Unable to generate a new Aura account.");
      } else {
        toast.success("A new Aura account has been created.");
      }
      navigate('/auth');
      return;
    }
    navigate('/profile');
  };

  const handleProceedToCheckout = () => {
    if (!user || !user.isLoggedIn) {
      toast.error("An Aura account is required to place an order.", {
        style: { background: '#5d4037', color: '#fff', fontSize: '12px' }
      });
      setIsCartOpen(false);
      navigate('/auth');
      return;
    }
    setIsCheckingOut(true);
  };

  const handleConfirmOrder = async () => {
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
      Items: cart.map(item => `${item.quantity}x ${item.Name || item.Name}`).join(", "),
      Status: "Pending"
    };

    try {
      const response = await fetch('https://aura-backend-s64s.onrender.com/api/Orders', {
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

          <div ref={searchRef} className="hidden md:flex flex-[2] justify-center relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md group">
              <input 
                type="text" 
                placeholder="Search for elegant styles..." 
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-aura-beige/40 border border-aura-nude rounded-full py-2.5 px-10 text-[11px] outline-none focus:border-aura-tan focus:bg-white transition-all text-aura-brown" 
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aura-tan group-focus-within:text-aura-brown" size={14} />
            </form>

            <AnimatePresence>
              {isSearchFocused && searchQuery.trim() && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-full max-w-md bg-white border border-aura-nude rounded-2xl shadow-xl z-[80] overflow-hidden p-2"
                >
                  {filteredProducts.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {filteredProducts.map(item => (
                        <Link 
                          key={item.Id || item.id}
                          to={`/product/${item.Id || item.id}`}
                          onClick={() => { setIsSearchFocused(false); setSearchQuery(''); }}
                          className="flex items-center gap-4 p-2 hover:bg-aura-beige/25 rounded-xl transition-all text-left"
                        >
                          <img src={item.Img || item.img} className="w-10 h-14 object-cover rounded-md bg-stone-50" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-tight text-gray-800 truncate">{item.Name || item.name}</p>
                            <p className="text-[9px] uppercase tracking-wider text-aura-tan mt-0.5">{item.Category || item.category}</p>
                            <p className="text-xs font-bold text-aura-brown mt-1">{item.Price}.00 $</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-stone-400 italic">No elegant matches found.</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/" className="md:hidden absolute left-1/2 -translate-x-1/2 text-center">
             <h1 className="text-xl font-serif tracking-widest text-aura-brown">AURA</h1>
          </Link>

          <div className="flex-1 flex items-center justify-end gap-3 md:gap-6 text-aura-brown">
            <button type="button" onClick={handleProfileClick} className="hidden md:block hover:text-aura-tan transition-colors">
              <User size={20} />
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative hover:text-aura-tan transition-colors">
              <ShoppingBag size={20} />
              <span className="absolute -top-1.5 -right-1.5 bg-aura-brown text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalItemsCount}
              </span>
            </button>
          </div>
        </div>

        <div className="hidden md:flex justify-center gap-10 py-3 bg-aura-beige/20 border-t border-aura-nude/10 text-[9px] tracking-[0.2em] font-bold text-aura-brown uppercase">
          {navItems.map((item, index) => (
            <Link key={item.path || index} to={item.path} className={`hover:text-aura-tan transition-colors ${item.isSale ? 'text-red-800 font-black' : ''}`}>
              {item.name}
            </Link>
          ))}
        </div>
      </header>

      {/* Mobile Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm md:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 h-full w-full max-w-[300px] bg-white z-[70] shadow-2xl flex flex-col md:hidden">
              <div className="p-6 border-b flex justify-between items-center bg-aura-beige/10">
                <Link to="/" onClick={() => setIsMenuOpen(false)}>
                  <h1 className="text-xl font-serif tracking-[0.2em] text-aura-brown uppercase">AURA</h1>
                </Link>
                <button onClick={() => setIsMenuOpen(false)}><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <form onSubmit={handleSearchSubmit} className="relative w-full group">
                  <input 
                    type="text" 
                    placeholder="Search styles..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-aura-beige/40 border border-aura-nude rounded-full py-2.5 px-10 text-xs outline-none focus:border-aura-tan focus:bg-white transition-all text-aura-brown" 
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aura-tan" size={14} />
                </form>

                {searchQuery.trim() && (
                  <div className="border border-aura-nude/45 rounded-xl p-2 bg-stone-50/50 flex flex-col gap-2">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(item => (
                        <Link 
                          key={item.Id || item.id} 
                          to={`/product/${item.Id || item.id}`}
                          onClick={() => { setIsMenuOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 p-1.5 hover:bg-white rounded-lg transition"
                        >
                          <img src={item.Img || item.img} className="w-8 h-11 object-cover rounded bg-stone-100" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-bold uppercase truncate text-stone-800">{item.Name || item.name}</p>
                            <p className="text-[10px] font-bold text-aura-brown mt-0.5">{item.Price}.00 $</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-3 text-center text-[10px] italic text-stone-400">No matches found.</div>
                    )}
                  </div>
                )}

                <nav className="flex flex-col gap-6 text-xs tracking-widest font-bold text-aura-brown uppercase">
                  {navItems.map((item, idx) => (
                    <Link key={item.path || idx} to={item.path} onClick={() => setIsMenuOpen(false)} className={`hover:text-aura-tan transition-colors ${item.isSale ? 'text-red-800 font-black' : ''}`}>
                      {item.name}
                    </Link>
                  ))}
                  {user?.isLoggedIn ? (
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="hover:text-aura-tan transition-colors pt-4 border-t border-aura-nude">
                      My Profile
                    </Link>
                  ) : (
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="hover:text-aura-tan transition-colors pt-4 border-t border-aura-nude">
                      Sign In / Register
                    </Link>
                  )}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                      cart.map((item, index) => (
                        <div key={item.id || item.Id || index} className="flex gap-4 group animate-in slide-in-from-right-4 duration-300">
                          <img src={item.Img || item.Img} className="w-20 h-28 object-cover rounded-sm bg-stone-50" alt="" />
                          <div className="flex-1 flex flex-col justify-between py-1">
                             <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-[10px] font-bold uppercase tracking-tight text-gray-800">{item.Name || item.Name}</h4>
                                  <p className="text-xs font-bold text-aura-brown mt-1">{item.Price || item.Price}.00 $</p>
                                </div>
                                <button onClick={() => removeFromCart(item.id || item.Id || 0)} className="text-gray-300 hover:text-red-800 transition"><Trash2 size={14}/></button>
                             </div>
                             <div className="flex items-center border border-aura-nude/40 w-fit rounded-full px-2 py-1 gap-4">
                                <button onClick={() => updateQuantity(item.id || item.Id || 0, -1)} className="hover:text-aura-tan"><Minus size={10}/></button>
                                <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id || item.Id || 0, 1)} className="hover:text-aura-tan"><Plus size={10}/></button>
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
                           <span className="text-xl font-bold">{cartTotal}.00 $</span>
                        </div>
                        <button 
                          onClick={handleProceedToCheckout}
                          className="w-full bg-black text-white py-5 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-aura-brown transition-all shadow-xl"
                        >
                          Proceed to Checkout
                        </button>
                     </>
                   ) : (
                     <div className="space-y-4">
                        <div className="bg-green-50/50 p-4 rounded-xl flex items-center gap-3 border border-green-100">
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                           <p className="text-[9px] font-bold uppercase tracking-widest text-green-800">Cash on Delivery - Total: {cartTotal} $</p>
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