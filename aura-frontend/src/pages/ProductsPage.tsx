import React, { useState, useMemo, useEffect } from 'react';
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

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const response = await fetch('http://aura-backend-s64s.onrender.com/api/Products');
        
        if (!response.ok) {
          throw new Error(`Server Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!isMounted) return;
        setProducts(data);
        setLoading(false);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch products:", error);
        setLoading(false);
        toast.error("The Aura vault is temporarily closed. Please try again.");
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
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
      toast.error('Please log in to save wishlist items.');
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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 selection:bg-stone-200">
      
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
            const isWishlisted = wishlist.some(w => (w.id || w.Id) === product.Id);
            
            return (
              <motion.div layout key={product.Id} className="group flex flex-col h-full bg-white p-3 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.03)] transition-all duration-500">
                
                {/* Image Wrap */}
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 rounded-xl mb-4">
                  <div className="absolute top-3 left-3 z-20">
                    {product.Status === 'sales' && (
                      <span className="text-[8px] tracking-widest font-bold bg-amber-700/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md uppercase shadow-sm">
                        Sale
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

                  <Link to={`/product-details/${product.Id}`} className="block w-full h-full">
                    <img 
                      src={product.Img} 
                      className="w-full h-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.03]" 
                      alt={product.Name || "Product"} 
                      loading="lazy"
                    />
                  </Link>
                </div>

                {/* Product Metadata Details */}
                <div className="flex-grow flex flex-col justify-between px-1">
                  <div className="space-y-1">
                    <Link to={`/product-details/${product.Id}`} className="text-[11px] md:text-xs font-semibold tracking-wider text-stone-500 uppercase hover:text-stone-950 transition-colors line-clamp-1">
                      {product.Name}
                    </Link>
                    <p className="text-sm md:text-base font-bold text-stone-900">
                      {typeof product.Price === 'number' ? product.Price.toLocaleString() : '0'}.00 $
                    </p>
                  </div>

                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
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
              <p className="text-xs text-stone-400 tracking-wide">No pieces match your selected filter.</p>
              <button onClick={clearFilters} className="mt-4 text-xs font-semibold uppercase tracking-widest bg-stone-950 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-stone-800">
                View All Pieces
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductsPage;