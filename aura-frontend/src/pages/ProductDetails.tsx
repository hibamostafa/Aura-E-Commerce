import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Added useParams
import { Heart, Share2, Ruler, Plus, Minus, Star, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAura } from '../context/AuraContext'; // Import hook

// 1. This data MUST match the IDs and categories in your ProductsPage
const ALL_PRODUCTS = [
  { id: 1, name: 'Linen Midi Dress', price: 260, category: 'new-in', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800' },
  { id: 2, name: 'Layali Gown Luxe', price: 420, category: 'sales', img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800' },
  { id: 3, name: 'Clara Tailored Top', price: 184, category: 'tops', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800' },
  { id: 4, name: 'Satin Evening Trousers', price: 234, category: 'bottoms', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800' },
  { id: 5, name: 'Silk Summer Set', price: 550, category: 'sets', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800' },
  { id: 6, name: 'Aura Butterfly Blouse', price: 190, category: 'new-in', img: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=800' },
];

const ProductDetails: React.FC = () => {
  // 2. GET THE ID FROM THE URL
    const { addToCart } = useAura(); // Access the function

  const { id } = useParams<{ id: string }>();
  
  // 3. FIND THE SPECIFIC PRODUCT
  const product = ALL_PRODUCTS.find(p => p.id === Number(id));

  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState('S');
  const [openSection, setOpenSection] = useState<string | null>('details');

  // If product is not found, show an error state
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10">
        <h2 className="text-2xl font-serif text-aura-brown mb-4">Piece not found</h2>
        <Link to="/" className="text-xs font-bold tracking-widest uppercase border-b border-aura-brown">Return to Shop</Link>
      </div>
    );
  }

  // Create a gallery (In real life, your product would have an array of images)
  const gallery = [product.img, product.img, product.img, product.img];

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
            {gallery.map((img, idx) => (
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
            <p className="text-3xl font-bold mt-6 text-aura-brown">{product.price}.00 AED</p>
          </header>

          {/* PROMO BANNER */}
          <div className="bg-aura-beige/30 border border-aura-nude p-4 flex justify-between items-center text-xs">
            <p className="text-aura-brown font-medium tracking-wide">
              Complimentary shipping on orders over 500 AED
            </p>
            <button className="font-bold border-b border-aura-brown uppercase text-[9px]">Details</button>
          </div>

          {/* SIZE SELECTION */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
               <p className="text-[11px] font-bold tracking-widest uppercase">Select Size: <span className="text-aura-tan ml-2">{selectedSize}</span></p>
               <button className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                 <Ruler size={14} /> Size Guide
               </button>
            </div>
            <div className="flex gap-2">
              {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
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

          {/* ACTIONS */}
          <div className="flex gap-3 mt-10">
             <button 
      onClick={() => addToCart(product)} // CALL ADD TO CART
      className="flex-1 bg-aura-brown text-white py-5 text-xs font-bold tracking-[0.3em] uppercase hover:bg-black transition-all shadow-xl active:scale-95"
    >
      Add To Bag
    </button>
            <button className="w-16 border border-aura-nude flex items-center justify-center hover:border-aura-brown transition group">
              <Heart size={22} className="group-hover:text-aura-brown" />
            </button>
          </div>

          {/* ACCORDION SECTIONS */}
          <div className="divide-y divide-gray-100 pt-8">
            <AccordionItem title="Product Details" isOpen={openSection === 'details'} onClick={() => toggleSection('details')}>
              Crafted from our signature premium fabrics, this {product.name} embodies the Aura aesthetic of effortless elegance and timeless silhouettes.
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