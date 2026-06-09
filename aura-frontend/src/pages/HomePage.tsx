import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export interface Product {
  id: number;
  Id?: number;
  name: string;
  Price: number; 
  Name: string;  
  img: string;
  Img: string;
  category: string;
  Status?: string;
  status?: string;
}

// Added 'Dresses' category to match your Navbar routes
const categories = [
  { name: 'NEW IN', slug: 'new-in', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' },
  { name: 'SALES', slug: 'sales', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400' },
  { name: 'DRESSES', slug: 'dresses', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400' }, 
  { name: 'TOPS', slug: 'tops', img: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=400' },
  { name: 'BOTTOMS', slug: 'bottoms', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400' },
  { name: 'SETS', slug: 'sets', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400' },
];

function HomePage() {
  const [newInProducts, setNewInProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real products from the backend on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch('http://aura-backend-s64s.onrender.com/api/Products');
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : [];
          
          // Filter products where status is "new-in"
          const filtered = list.filter(p => 
            (p.Status || p.status || '').toLowerCase() === 'new-in'
          );

          // Keep only the first 4 (most recent) items
          setNewInProducts(filtered.slice(0, 4));
        }
      } catch (e) {
        console.error("Failed to load products for homepage:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <div className="min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-aura-nude">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600" 
          alt="Summer" 
          className="w-full h-full object-cover mix-blend-multiply opacity-70"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-[120px] font-serif text-white italic drop-shadow-2xl"
          >
            Summer Dress
          </motion.h2>
          <Link to="/products/new-in">
            <button className="mt-10 border border-white text-white px-12 py-4 tracking-[0.3em] text-xs font-bold hover:bg-white hover:text-aura-brown transition-all duration-500 uppercase">
              Shop Now
            </button>
          </Link>
        </div>
      </section>

      {/* CIRCULAR CATEGORIES */}
      <section className="py-16 md:py-24 overflow-hidden px-4">
        <div className="flex md:justify-center items-start gap-6 md:gap-14 overflow-x-auto no-scrollbar pb-4">
          {categories.map((cat) => (
            <Link to={`/products/${cat.slug}`} key={cat.name} className="flex-shrink-0">
              <motion.div 
                whileHover={{ y: -8 }}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="w-24 h-24 md:w-48 md:h-48 rounded-full overflow-hidden border border-aura-nude group-hover:border-aura-brown transition-all duration-700 p-1 bg-white shadow-sm">
                  <img 
                    src={cat.img} 
                    alt={cat.name} 
                    className="w-full h-full object-cover rounded-full grayscale-[20%] group-hover:grayscale-0 transition duration-700" 
                  />
                </div>
                <span className="mt-5 text-[10px] md:text-xs font-black tracking-[0.2em] group-hover:text-aura-tan transition-colors uppercase">
                  {cat.name}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING NEW IN ARRIVALS GRID */}
      <section className="px-6 md:px-20 py-10 bg-white/50">
        <div className="flex justify-between items-end mb-12">
          <h3 className="text-3xl md:text-4xl font-serif italic text-aura-brown">Trending Collection</h3>
          <Link to="/products/new-in" className="text-[10px] font-bold tracking-widest border-b border-aura-brown cursor-pointer pb-1 hover:text-aura-tan hover:border-aura-tan transition-colors">
            VIEW ALL
          </Link>
        </div>
        
        {isLoading ? (
          // Shimmer Skeleton Loader state
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-4 animate-pulse">
                <div className="aspect-[3/4] bg-stone-100 rounded-sm" />
                <div className="h-4 bg-stone-100 rounded-md w-1/3 mx-auto" />
                <div className="h-5 bg-stone-100 rounded-md w-2/3 mx-auto" />
                <div className="h-4 bg-stone-100 rounded-md w-1/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {newInProducts.length > 0 ? (
              newInProducts.map((product) => {
                const productId = product.id || product.Id;
                return (
                  <Link to={`/product/${productId}`} key={productId} className="group cursor-pointer">
                    <div className="aspect-[3/4] bg-aura-nude overflow-hidden relative shadow-lg rounded-sm">
                      <div className="absolute top-4 left-4 bg-aura-brown text-white text-[9px] px-3 py-1 tracking-widest uppercase z-10">New Arrival</div>
                      {product.Img || product.img ? (
                        <img 
                          src={product.Img || product.img} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" 
                          alt={product.Name || product.name} 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400 text-xs italic">No Preview</div>
                      )}
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-[10px] tracking-[0.2em] text-aura-tan uppercase font-bold">{product.category || "Aura Studio"}</p>
                      <p className="font-serif text-lg mt-1 text-aura-brown">{product.Name || product.name}</p>
                      <p className="text-aura-brown font-bold mt-2 tracking-widest">{product.Price}.00 $</p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-stone-400 italic text-sm font-serif">
                No new collection items listed yet. Check back soon!
              </div>
            )}
          </div>
        )}

        {/* SHOW MORE BUTTON */}
        {!isLoading && newInProducts.length > 0 && (
          <div className="flex justify-center mt-16">
            <Link to="/products/new-in">
              <button className="border border-aura-brown text-aura-brown px-12 py-4 tracking-[0.3em] text-xs font-bold hover:bg-aura-brown hover:text-white transition-all duration-500 uppercase rounded-sm">
                Show More Styles
              </button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;