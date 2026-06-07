import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // 1. Import Link

// 2. Added 'slug' to each category to match your Navbar routes
const categories = [
  { name: 'NEW IN', slug: 'new-in', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' },
  { name: 'SALES', slug: 'sales', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400' },
  { name: 'TOPS', slug: 'tops', img: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=400' },
  { name: 'BOTTOMS', slug: 'bottoms', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400' },
  { name: 'SETS', slug: 'sets', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400' },
];

function HomePage() {
  return (
    <div className="min-h-screen">
      
      {/* 3. HERO SECTION */}
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
          <Link to="/products/new-in"> {/* Link the Hero button */}
            <button className="mt-10 border border-white text-white px-12 py-4 tracking-[0.3em] text-xs font-bold hover:bg-white hover:text-aura-brown transition-all duration-500 uppercase">
              Shop Now
            </button>
          </Link>
        </div>
      </section>

      {/* 4. CIRCULAR CATEGORIES (Now Linked) */}
      <section className="py-16 md:py-24 overflow-hidden px-4">
        <div className="flex md:justify-center items-start gap-6 md:gap-14 overflow-x-auto no-scrollbar pb-4">
          {categories.map((cat) => (
            <Link to={`/products/${cat.slug}`} key={cat.name} className="flex-shrink-0"> {/* 4. Wrap in Link */}
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

      {/* 5. NEW ARRIVALS GRID (Linked to Product Details) */}
      <section className="px-6 md:px-20 py-10 bg-white/50">
        <div className="flex justify-between items-end mb-12">
          <h3 className="text-3xl md:text-4xl font-serif italic text-aura-brown">Trending Collection</h3>
          <Link to="/products/all" className="text-[10px] font-bold tracking-widest border-b border-aura-brown cursor-pointer pb-1 hover:text-aura-tan hover:border-aura-tan transition-colors">
            VIEW ALL
          </Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
           {[1, 2, 3, 4].map((id) => (
             <Link to={`/product-details/${id}`} key={id} className="group cursor-pointer"> {/* Link individual products */}
                <div className="aspect-[3/4] bg-aura-nude overflow-hidden relative shadow-lg">
                   <div className="absolute top-4 left-4 bg-aura-brown text-white text-[9px] px-3 py-1 tracking-widest uppercase z-10">New Arrival</div>
                   <img 
                     src={`https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&q=80&i=${id}`} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" 
                     alt="product" 
                   />
                </div>
                <div className="mt-6 text-center">
                  <p className="text-[10px] tracking-[0.2em] text-aura-tan uppercase font-bold">Aura Studio</p>
                  <p className="font-serif text-lg mt-1 text-aura-brown">Silk Wrap Dress</p>
                  <p className="text-aura-brown font-bold mt-2 tracking-widest">145.00 AED</p>
                </div>
             </Link>
           ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;