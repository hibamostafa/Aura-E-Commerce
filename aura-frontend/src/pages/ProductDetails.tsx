import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, Ruler, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAura } from '../context/AuraContext';

const API_URL = "https://aura-backend-s64s.onrender.com/api";

const ProductDetails: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart, wishlist, addToWishlist, removeFromWishlist, user, saveWishlistToProfile } = useAura();
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<any | null>(() => {
    if (typeof window === 'undefined' || !id) return null;
    const cached = sessionStorage.getItem(`aura_product_prefetch_${id}`);
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined' || !id) return true;
    return !Boolean(sessionStorage.getItem(`aura_product_prefetch_${id}`));
  });
  const [fetchError, setFetchError] = useState(false);
  const [reload, setReload] = useState(0);
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('details');

  const parseOptionList = (value: any) => {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value === 'string') return value.split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
    return [];
  };

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      setFetchError(false);
      return;
    }

    const controller = new AbortController();

    const normalizeProduct = (raw: any) => {
      if (!raw || typeof raw !== 'object') return null;

      return {
        ...raw,
        id: raw.Id ?? raw.id,
        name: raw.Name ?? raw.name ?? 'Aura Piece',
        price: raw.Price ?? raw.price ?? 0,
        category: raw.Category ?? raw.category ?? 'new-in',
        img: raw.Img ?? raw.img ?? '',
        images: Array.isArray(raw.Images)
          ? raw.Images
          : Array.isArray(raw.images)
            ? raw.images
            : raw.Img || raw.img
              ? [raw.Img ?? raw.img]
              : [],
        sizes: parseOptionList(raw.Sizes ?? raw.sizes ?? raw.Size ?? raw.size),
        colors: parseOptionList(raw.Colors ?? raw.colors ?? raw.Color ?? raw.color),
        description: raw.Description ?? raw.description ?? '',
      };
    };

    const resolvePayload = (json: any) => {
      if (Array.isArray(json)) return json[0] ?? null;
      if (json?.data && Array.isArray(json.data)) return json.data[0] ?? null;
      if (json?.Products && Array.isArray(json.Products)) return json.Products[0] ?? null;
      if (json?.products && Array.isArray(json.products)) return json.products[0] ?? null;
      return json;
    };

    const normalizeResponseList = (response: any): any[] => {
      if (Array.isArray(response)) return response;
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.Products)) return response.Products;
      if (Array.isArray(response.products)) return response.products;
      return [];
    };

    const fetchProduct = async () => {
      setLoading(true);
      setFetchError(false);

      try {
        let item = null;

        const response = await fetch(`${API_URL}/Products/${id}`, { signal: controller.signal });
        if (response.ok) {
          const json = await response.json();
          item = normalizeProduct(resolvePayload(json));
        }

        if (!item) {
          const listResponse = await fetch(`${API_URL}/Products`, { signal: controller.signal });
          if (listResponse.ok) {
            const listJson = await listResponse.json();
            const listItems = normalizeResponseList(listJson);
            item = listItems
              .map(normalizeProduct)
              .find((productItem: any) => Number(productItem?.id) === Number(id));
          }
        }

        if (!item) {
          throw new Error('Product not found');
        }

        setProduct(item);
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          setFetchError(true);
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    return () => controller.abort();
  }, [id, reload]);

  // Auto retry when fetch fails: trigger a reload every 2s until success
  useEffect(() => {
    if (!fetchError) return;
    const t = window.setTimeout(() => setReload((r) => r + 1), 2000);
    return () => window.clearTimeout(t);
  }, [fetchError]);

  useEffect(() => {
    if (!product) return;

    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const colors = Array.isArray(product.colors) ? product.colors : [];

    if (sizes.length) setSelectedSize(sizes[0]);
    if (colors.length) setSelectedColor(colors[0]);

    setDetailsLoading(true);
    const timer = window.setTimeout(() => setDetailsLoading(false), 500);
    return () => window.clearTimeout(timer);
  }, [product]);

  const isLoggedIn = !!(user && (user as any).isLoggedIn) || !!localStorage.getItem('aura_user') || !!localStorage.getItem('user');

  const requireAuth = (action: string) => {
    if (!isLoggedIn) {
      toast.error(`Please log in or create an account to ${action}.`);
      navigate('/auth');
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!requireAuth('add items to cart')) return;
    addToCart(product);
    toast.success('Added to cart.');
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    const isWishlisted = wishlist.some((w: any) => (w.id || w.Id) === (product.Id || product.id));

    if (!requireAuth('save wishlist items')) return;

    if (isWishlisted) {
      removeFromWishlist(product.Id || product.id);
      toast.success('Removed from wishlist.');
    } else {
      addToWishlist(product);
      toast.success('Added to your wishlist.');
    }

    try {
      saveWishlistToProfile();
    } catch (e) {
      console.error('Failed to save wishlist:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10">
        <div className="mb-4 h-10 w-10 rounded-full border-4 border-aura-brown border-t-transparent animate-spin" />
        <p className="text-base text-gray-500">Loading product details from Aura dashboard...</p>
      </div>
    );
  }

  if (fetchError || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10">
        <h2 className="text-2xl font-serif text-aura-brown mb-4">Piece not found</h2>
        <p className="text-sm text-gray-500 mb-4">Unable to load details from the Aura dashboard.</p>
        <Link to="/" className="text-xs font-bold tracking-widest uppercase border-b border-aura-brown">Return to Shop</Link>
      </div>
    );
  }

  // Create a gallery from available images or fallback to the main product image
  const gallery = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.img
      ? [product.img]
      : [];

  const availableSizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['XS', 'S', 'M', 'L', 'XL'];
  const availableColors = Array.isArray(product.colors) && product.colors.length ? product.colors : ['Black', 'Beige', 'White'];

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* BREADCRUMBS */}
      <nav className="px-6 py-4 text-[10px] tracking-widest text-gray-400 uppercase">
        <Link to="/" className="hover:text-black">Home</Link> / 
        <Link to={`/products/${product.category}`} className="hover:text-black mx-1">{product.category}</Link> / 
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
        
        {/* LEFT: IMAGE GALLERY */}
        <div className="lg:col-span-7 flex flex-col md:flex-row gap-4">
          <div className="order-2 md:order-1 flex md:flex-col gap-3">
            {gallery.map((img: string | undefined, idx: number) => (
              <button 
                key={idx} 
                onClick={() => setSelectedImg(idx)}
                className={`w-16 h-20 md:w-20 md:h-28 overflow-hidden border transition-all ${selectedImg === idx ? 'border-aura-brown' : 'border-transparent'}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="thumb" />
              </button>
            ))}
          </div>
          
          <div className="order-1 md:order-2 flex-1 aspect-[3/4] bg-gray-50 relative overflow-hidden">
             <motion.img 
               key={selectedImg}
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               src={gallery[selectedImg]} 
               className="w-full h-full object-cover" 
               alt={product.name} 
             />
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 text-[10px] font-bold tracking-widest uppercase text-gray-800 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full">
                <button className="flex items-center gap-2"><Share2 size={12}/> Share</button>
                <button>Tweet</button>
                <button>Pin it</button>
             </div>
          </div>
        </div>

        {/* RIGHT: PRODUCT INFO */}
        <div className="lg:col-span-5 space-y-8">
          <header>
            <p className="text-[10px] tracking-[0.3em] text-aura-tan font-bold uppercase mb-2">Aura Selection</p>
            <h1 className="text-3xl md:text-4xl font-serif text-gray-900 leading-tight">{product.name}</h1>
            <p className="text-3xl font-bold mt-6 text-aura-brown">{product.price}.00 $</p>
          </header>

          {/* PROMO BANNER */}
          <div className="bg-aura-beige/30 border border-aura-nude p-4 flex justify-between items-center text-xs">
            <p className="text-aura-brown font-medium tracking-wide">
              Complimentary shipping on orders over 500 $
            </p>
            <button className="font-bold border-b border-aura-brown uppercase text-[9px]">Details</button>
          </div>

          {/* SIZE SELECTION */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
               <p className="text-[11px] font-bold tracking-widest uppercase">Select Size: <span className="text-aura-tan ml-2">{selectedSize || 'Choose'}</span></p>
               <button className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                 <Ruler size={14} /> Size Guide
               </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size: string) => (
                <button 
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-14 h-12 border text-[11px] font-bold transition-all ${selectedSize === size ? 'border-aura-brown bg-aura-brown text-white' : 'border-gray-100 text-gray-400 hover:border-aura-brown hover:text-aura-brown'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
               <p className="text-[11px] font-bold tracking-widest uppercase">Select Color: <span className="text-aura-tan ml-2">{selectedColor || 'Choose'}</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color: string) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-14 h-12 border text-[11px] font-bold transition-all ${selectedColor === color ? 'border-aura-brown bg-aura-brown text-white' : 'border-gray-100 text-gray-400 hover:border-aura-brown hover:text-aura-brown'}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 mt-10">
             <button
               onClick={handleAddToCart}
               className="flex-1 bg-aura-brown text-white py-5 text-xs font-bold tracking-[0.3em] uppercase hover:bg-black transition-all shadow-xl active:scale-95"
             >
               Add To Bag
             </button>
            <button
              onClick={handleWishlistToggle}
              className="w-16 border border-aura-nude flex items-center justify-center hover:border-aura-brown transition group"
            >
              <Heart size={22} className="group-hover:text-aura-brown" />
            </button>
          </div>

          {/* ACCORDION SECTIONS */}
          <div className="divide-y divide-gray-100 pt-8">
            <AccordionItem title="Product Details" isOpen={openSection === 'details'} onClick={() => toggleSection('details')}>
              {detailsLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="h-3 w-3 rounded-full border-2 border-aura-brown border-t-transparent animate-spin" />
                  Loading details...
                </div>
              ) : product.description ? (
                <p>{product.description}</p>
              ) : (
                <p className="text-xs text-gray-500">No details here.</p>
              )}
            </AccordionItem>
            <AccordionItem title="Shipping & Returns" isOpen={openSection === 'return'} onClick={() => toggleSection('return')}>
              We offer worldwide express shipping. Returns accepted within 14 days of delivery for all unworn items with original Aura tags.
            </AccordionItem>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for Accordion logic
const AccordionItem: React.FC<{ title: string; isOpen: boolean; onClick: () => void; children: React.ReactNode }> = ({ title, isOpen, onClick, children }) => {
  return (
    <div className="py-5">
      <button onClick={onClick} className="w-full flex justify-between items-center text-[11px] font-bold tracking-[0.2em] uppercase text-gray-800">
        {title}
        {isOpen ? <Minus size={14} /> : <Plus size={14} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 text-xs leading-relaxed text-gray-500 font-light">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProductDetails;