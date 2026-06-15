import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, LayoutGrid, Grid3X3, Grid2X2, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAura } from '../context/AuraContext';

const FILTER_OPTIONS = {
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  colors: ['Black', 'White', 'Nude', 'Tan', 'Red', 'Pink', 'Blue', 'Emerald']
};

const ProductsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart, wishlist, addToWishlist, removeFromWishlist, user, saveWishlistToProfile } = useAura();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(4);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000 });
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const isLocalhost = typeof window !== 'undefined' && /^localhost(:\d+)?$/.test(window.location.hostname);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aura-backend-s64s.onrender.com/api';
  const PRODUCTS_ENDPOINT = `${API_BASE_URL.replace(/\/+$/, '')}/Products`;
  const LOCAL_PROXY_PRODUCTS_ENDPOINT = '/api/Products';
  
  // Persistent Cache Key for Stale-While-Revalidate
  const PRODUCTS_CACHE_KEY = 'aura_products_cache_persistent';

  const loadCachedProducts = (): any[] | null => {
    try {
      const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.products)) return null;
      return parsed.products; // Return cached data immediately
    } catch {
      return null;
    }
  };

  const saveProductsCache = (data: any[]) => {
    try {
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products: data }));
    } catch (err) {
      console.warn('Unable to cache products', err);
    }
  };

  // Prefetches product details instantly to browser memory on hover
  const prefetchProductDetails = (product: any) => {
    try {
      const id = product.Id || product.id;
      sessionStorage.setItem(`aura_product_prefetch_${id}`, JSON.stringify(product));
    } catch (err) {
      console.warn('Prefetch failed', err);
    }
  };

  const fetchProducts = async (forceReload = false, silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setLoadError(null);

    // Stale-While-Revalidate Implementation
    if (!forceReload) {
      const cached = loadCachedProducts();
      if (cached) {
        setProducts(cached);
        setLoading(false);
        // Quietly revalidate data in the background to update UI/Cache
        fetchProducts(true, true);
        return;
      }
    }

    const fetchWithRetry = async (url: string, retries = 2, delay = 300): Promise<any> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      try {
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-store',
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Server Error: ${response.status}`);
        }
        return await response.json();
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (retries > 0 && isMountedRef.current) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, retries - 1, delay + 300);
        }
        throw fetchErr;
      }
    };

    try {
      let fetchedData;
      try {
        fetchedData = await fetchWithRetry(PRODUCTS_ENDPOINT);
      } catch (primaryError) {
        if (!process.env.REACT_APP_API_URL && isLocalhost && PRODUCTS_ENDPOINT !== LOCAL_PROXY_PRODUCTS_ENDPOINT) {
          fetchedData = await fetchWithRetry(LOCAL_PROXY_PRODUCTS_ENDPOINT);
        } else {
          throw primaryError;
        }
      }

      if (!isMountedRef.current) return;
      const productsData = Array.isArray(fetchedData) ? fetchedData : [];
      
      setProducts(productsData);
      saveProductsCache(productsData);
      setLoadError(null);
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('Failed to fetch products:', error);
      
      // Only display block error state if we have absolutely no cached data to display
      if (products.length === 0) {
        setProducts([]);
        setLoadError('Unable to reach the Aura vault. Try again or check your connection.');
        toast.error('The Aura vault is temporarily closed. Please try again.');
      }
    } finally {
      if (isMountedRef.current && !silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const cachedProducts = loadCachedProducts();

    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
      // Run quiet background update
      fetchProducts(true, true);
    } else {
      fetchProducts();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const navMatch = !slug || slug === 'all' || 
                       (p.Status && p.Status.toLowerCase() === slug.toLowerCase()) || 
                       (p.Category && p.Category.toLowerCase() === slug.toLowerCase());
      
      const pSizes = p.Sizes ? p.Sizes.split(',').map((s: string) => s.trim()) : [];
      const pColors = p.Colors ? p.Colors.split(',').map((c: string) => c.trim()) : [];

      const sizeMatch = selectedSizes.length === 0 || pSizes.some((s: string) => selectedSizes.includes(s));
      const colorMatch = selectedColors.length === 0 || pColors.some((c: string) => selectedColors.includes(c));
      const priceMatch = p.Price >= priceRange.min && p.Price <= priceRange.max;

      return navMatch && sizeMatch && colorMatch && priceMatch;
    });
  }, [slug, products, selectedSizes, selectedColors, priceRange]);

  const toggleFilter = (item: string, setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    setState(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleWishlistClick = (product: any, isWishlisted: boolean) => {
    const isLoggedIn = !!(user && (user as any).isLoggedIn) || !!localStorage.getItem('aura_user') || !!localStorage.getItem('user');
    if (!isLoggedIn) {
      toast.error('Please log in or create an account to continue.');
      navigate('/auth');
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(product.Id || product.id);
      toast.success('Removed from wishlist.');
      try { saveWishlistToProfile(); } catch (e) { console.error('Failed to save wishlist:', e); }
    } else {
      addToWishlist(product);
      toast.success('Added to your wishlist.');
      try { saveWishlistToProfile(); } catch (e) { console.error('Failed to save wishlist:', e); }
    }
  };

  const handleAddToCart = (product: any) => {
    const isLoggedIn = !!(user && (user as any).isLoggedIn) || !!localStorage.getItem('aura_user') || !!localStorage.getItem('user');
    if (!isLoggedIn) {
      toast.error('Please log in or create an account to add items to your cart.');
      navigate('/auth');
      return;
    }

    addToCart(product);
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
        <p className="font-serif italic tracking-wide text-stone-600 text-sm">Curating Aura Collection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 selection:bg-stone-200 animate-fade-in">
      {loadError && (
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-4">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 text-rose-700 px-4 py-3 mb-4 text-sm flex items-center justify-between gap-3 shadow-sm">
            <span>{loadError}</span>
            <button
              onClick={() => fetchProducts(true)}
              className="text-rose-700 underline underline-offset-2 font-semibold hover:text-rose-900 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* --- STICKY FILTER BAR --- */}
      <div className="sticky top-[60px] md:top-[90px] z-40 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 md:px-12 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Left: Filters */}
          <div className="flex items-center gap-6 text-[11px] font-semibold tracking-widest uppercase">
            <div className="flex items-center gap-2 text-stone-400 font-medium">
              <SlidersHorizontal size={12} className="text-stone-800" />
              <span className="hidden sm:inline">Filters</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'color' ? null : 'color')} 
                className={`flex items-center gap-1 transition-colors ${selectedColors.length > 0 ? 'text-stone-900 underline underline-offset-4' : 'text-stone-500 hover:text-stone-900'}`}
              >
                Color {selectedColors.length > 0 && `(${selectedColors.length})`} <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === 'color' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === 'color' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 8 }} 
                      className="absolute top-full left-0 mt-3 w-56 bg-white border border-stone-100 shadow-xl rounded-lg p-4 grid grid-cols-2 gap-3 z-50"
                    >
                      {FILTER_OPTIONS.colors.map(color => (
                        <label key={color} className="flex items-center gap-2.5 cursor-pointer group font-sans normal-case tracking-normal text-xs text-stone-600 hover:text-stone-900">
                          <input 
                            type="checkbox" 
                            checked={selectedColors.includes(color)} 
                            onChange={() => toggleFilter(color, setSelectedColors)} 
                            className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 h-3.5 w-3.5 accent-stone-800" 
                          />
                          <span>{color}</span>
                        </label>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'size' ? null : 'size')} 
                className={`flex items-center gap-1 transition-colors ${selectedSizes.length > 0 ? 'text-stone-900 underline underline-offset-4' : 'text-stone-500 hover:text-stone-900'}`}
              >
                Size {selectedSizes.length > 0 && `(${selectedSizes.length})`} <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === 'size' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === 'size' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 8 }} 
                      className="absolute top-full left-0 mt-3 w-44 bg-white border border-stone-100 shadow-xl rounded-lg p-3 grid grid-cols-3 gap-2 z-50"
                    >
                      {FILTER_OPTIONS.sizes.map(size => (
                        <button 
                          key={size} 
                          onClick={() => toggleFilter(size, setSelectedSizes)} 
                          className={`py-2 text-[10px] font-bold rounded-md border transition-all ${selectedSizes.includes(size) ? 'bg-stone-950 text-white border-stone-950 shadow-sm' : 'border-stone-100 text-stone-400 bg-stone-50 hover:bg-stone-100 hover:text-stone-800'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {(selectedColors.length > 0 || selectedSizes.length > 0) && (
              <button onClick={clearFilters} className="text-stone-400 hover:text-stone-900 normal-case font-normal border-b border-stone-300 tracking-normal ml-2">
                Clear all
              </button>
            )}
          </div>

          {/* Right: Grid Controls */}
          <div className="hidden md:flex items-center gap-4 text-stone-300">
            <button onClick={() => setColumns(4)} className={`p-1 hover:text-stone-900 transition ${columns === 4 ? "text-stone-900" : ""}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setColumns(3)} className={`p-1 hover:text-stone-900 transition ${columns === 3 ? "text-stone-900" : ""}`}>
              <Grid3X3 size={16} />
            </button>
            <button onClick={() => setColumns(2)} className={`p-1 hover:text-stone-900 transition ${columns === 2 ? "text-stone-900" : ""}`}>
              <Grid2X2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- PRODUCT GRID --- */}
      <main className="max-w-[1600px] mx-auto px-4 md:px-12 py-8 md:py-12">
        <div className={`grid grid-cols-2 ${columns === 4 ? 'lg:grid-cols-4 md:grid-cols-3' : columns === 3 ? 'lg:grid-cols-3 md:grid-cols-2' : 'md:grid-cols-2'} gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-16`}>
          {filteredProducts.map((product) => {
            const id = product.Id || product.id;
            const isWishlisted = wishlist.some(w => (w.id || w.Id) === id);
            const imageSrc = product.Img || product.img;
            const hasSale = product.Status === 'sales' || product.OnSale || product.onSale;
            const description = product.Description || product.description || '';
            const price = typeof product.Price === 'number' ? product.Price : parseFloat(product.Price || '0');
            const originalPrice = product.OriginalPrice || product.originalPrice;

            return (
              <motion.div 
                layout 
                key={id} 
                className="group flex flex-col h-full bg-white p-3.5 rounded-2xl border border-stone-100/45 shadow-[0_4px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-500"
              >
                {/* Image Wrap */}
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 rounded-xl mb-4">
                  <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                    {hasSale && (
                      <span className="text-[8px] tracking-widest font-bold bg-amber-700/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md uppercase shadow-sm">
                        Sale
                      </span>
                    )}
                    {product.Status === 'new-in' && (
                      <span className="text-[8px] tracking-widest font-bold bg-stone-950/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md uppercase shadow-sm">
                        New In
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      handleWishlistClick(product, isWishlisted);
                    }} 
                    className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur-md p-2.5 rounded-full hover:bg-white transition-all shadow-sm active:scale-90 border border-stone-100/50"
                  >
                    <Heart size={14} className={`transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-stone-600"}`} />
                  </button>

                  <Link 
                    to={`/product-details/${id}`} 
                    className="block w-full h-full"
                    onMouseEnter={() => prefetchProductDetails(product)} // Instant Prefetch on Hover
                  >
                    <img 
                      src={imageSrc} 
                      className="w-full h-full object-cover transition duration-300 ease-out group-hover:scale-[1.03]" 
                      alt={product.Name || "Product"} 
                      decoding="async" // High Performance Async Decodes
                    />
                  </Link>
                </div>

                {/* Product Metadata Details */}
                <div className="flex-grow flex flex-col justify-between px-1">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <Link 
                        to={`/product-details/${id}`} 
                        className="text-[11px] md:text-xs font-bold tracking-wider text-stone-800 uppercase hover:text-stone-950 transition-colors line-clamp-1"
                        onMouseEnter={() => prefetchProductDetails(product)} // Instant Prefetch on Hover
                      >
                        {product.Name}
                      </Link>
                      <span className="text-[8px] tracking-widest font-bold text-stone-400 uppercase">
                        {product.Category}
                      </span>
                    </div>

                    {/* Elegant Luxury Description */}
                    {description && (
                      <p className="text-[11px] text-stone-400 font-serif italic line-clamp-2 leading-relaxed">
                        {description}
                      </p>
                    )}

                    <div className="flex items-baseline gap-2">
                      {hasSale && originalPrice ? (
                        <>
                          <span className="text-sm md:text-base font-bold text-rose-600">
                            {price.toLocaleString()}.00 $
                          </span>
                          <span className="text-[10px] md:text-xs text-stone-400 line-through">
                            {originalPrice.toLocaleString()}.00 $
                          </span>
                        </>
                      ) : (
                        <span className="text-sm md:text-base font-bold text-stone-950">
                          {price.toLocaleString()}.00 $
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                    className="mt-4 w-full bg-stone-950 hover:bg-stone-800 text-white py-3 text-[10px] font-bold tracking-[0.15em] uppercase rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
                  >
                    <ShoppingBag size={13} /> Add to Bag
                  </button>
                </div>
              </motion.div>
            );
          })}
          
          {/* Empty Slate View */}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-40 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-stone-300 font-serif italic text-2xl">The collection rests.</p>
              <p className="text-xs text-stone-400 tracking-wide">
                {loadError ? 'Could not load pieces from Aura vault. Please check your connection and retry.' : 'No pieces match your selected filter.'}
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (loadError) fetchProducts(true); else clearFilters();
                }}
                className="mt-4 text-xs font-semibold uppercase tracking-widest bg-stone-950 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-stone-800"
              >
                {loadError ? 'Retry Loading' : 'View All Pieces'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductsPage;