import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const categories = [
  { name: 'NEW IN', slug: 'new-in', icon: 'bag', colors: 'from-amber-100 to-amber-200' },
  { name: 'SALES', slug: 'sales', icon: 'tag', colors: 'from-rose-100 to-rose-200' },
  { name: 'DRESSES', slug: 'dresses', icon: 'dress', colors: 'from-violet-100 to-fuchsia-200' },
  { name: 'TOPS', slug: 'tops', icon: 'top', colors: 'from-cyan-100 to-sky-200' },
  { name: 'BOTTOMS', slug: 'bottoms', icon: 'bottoms', colors: 'from-emerald-100 to-lime-200' },
  { name: 'SETS', slug: 'sets', icon: 'sets', colors: 'from-stone-100 to-yellow-100' },
];

const categoryIcons: Record<string, React.ReactNode> = {
  bag: (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-7 h-7 md:w-10 md:h-10 text-aura-brown"
    >
      <path d="M8 7V4.5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2V7" />
      <path d="M4.5 8C4.2 8 4 8.2 4 8.5l-1 12c-.1.8.6 1.5 1.5 1.5h15c.8 0 1.5-.7 1.5-1.5l-1-12c0-.3-.2-.5-.5-.5h-15Z" />
      <path d="M3.5 13h17" />
      <circle cx="12" cy="13" r="1.5" />
    </svg>
  ),
  tag: (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-7 h-7 md:w-10 md:h-10 text-aura-brown"
    >
      <path d="M12 2.5H6.5a1 1 0 0 0-1 1V9L15 18.5c1 1 2.5 1 3.5 0l2-2c1-1 1-2.5 0-3.5L12 2.5Z" />
      <circle cx="9" cy="6" r="1" />
      <path d="M8.5 5.5C7 3 4 3 3 5s-1 5 2 6" />
    </svg>
  ),
  dress: (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-7 h-7 md:w-10 md:h-10 text-aura-brown"
    >
      <path d="M8 4 L6.5 10 C6.5 11.5 8 12.5 8 12.5 C6 15 5.5 21 5.5 21 H18.5 C18.5 21 18 15 16 12.5 C16 12.5 17.5 11.5 17.5 10 L16 4 C14 5.5 10 5.5 8 4 Z" />
    </svg>
  ),
  top: (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-7 h-7 md:w-10 md:h-10 text-aura-brown"
    >
      <path d="M6.5 4L12 11l5.5-7" />
      <path d="M4.5 6c0 2 1 3 1.5 5l1 9h10l1-9c.5-2 1.5-3 1.5-5l-2.5-2" />
      <path d="M12 11l-3 9" />
    </svg>
  ),
  bottoms: (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-7 h-7 md:w-10 md:h-10 text-aura-brown"
    >
      <path d="M7.5 3h9" />
      <path d="M7.5 3L5 21h6l1-10 1 10h6l-2.5-18" />
      <path d="M7 7h10" />
    </svg>
  ),
  sets: (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-7 h-7 md:w-10 md:h-10 text-aura-brown"
    >
      <path d="M8.5 4 L7 10 H17 L15.5 4 C14 5.5 10 5.5 8.5 4 Z" />
      <path d="M8 12 H16 L17.5 21 H14 L12 15 L10 21 H6.5 Z" />
      <path d="M12 12 V14.5" />
    </svg>
  ),
};

const heroSlides = [
  {
    id: "timeless",
    title: "Timeless Elegance",
    description: "Wardrobe staples designed to outlast the trends.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600",
    link: "/products/new-in",
    alt: "Timeless Collection"
  },
  {
    id: "modest",
    title: "Modest & Modern",
    description: "Sophisticated silhouettes with refined coverage.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600",
    link: "/products/new-in",
    alt: "Modest Collection"
  },
  {
    id: "casual",
    title: "Everyday Casual",
    description: "Effortless pieces to elevate your daily routine.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600",
    link: "/products/new-in",
    alt: "Casual Collection"
  },
  {
    id: "trendy",
    title: "Trending Now",
    description: "The most coveted styles, curated just for you.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600",
    link: "/products/new-in",
    alt: "Trending Collection"
  }
];

function HomePage() {
  const [newInProducts, setNewInProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevIndex) => (prevIndex + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch('https://aura-backend-s64s.onrender.com/api/Products');
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : [];
          
          const filtered = list.filter(p => 
            (p.Status || p.status || '').toLowerCase() === 'new-in'
          );

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
      <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden ">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <img 
              src={heroSlides[currentSlide].image} 
              alt={heroSlides[currentSlide].alt} 
              className="w-full h-full object-cover mix-blend-multiply opacity-70"
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="text-5xl md:text-[100px] font-serif text-white italic drop-shadow-2xl mb-4"
              >
                {heroSlides[currentSlide].title}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 1 }}
                className="text-white/90 text-sm md:text-lg tracking-[0.2em] font-light drop-shadow-md max-w-2xl mb-10 uppercase"
              >
                {heroSlides[currentSlide].description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 1 }}
              >
                <Link to={heroSlides[currentSlide].link}>
                  <button className="border border-white text-white px-12 py-4 tracking-[0.3em] text-xs font-bold hover:bg-white hover:text-aura-brown transition-all duration-500 uppercase">
                    Shop Now
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* CIRCULAR CATEGORIES */}
      <section className="py-16 md:py-24 overflow-hidden px-4">
        <div className="flex justify-start md:justify-center items-start gap-6 md:gap-10 overflow-x-auto no-scrollbar pb-4">
          {categories.map((cat) => (
            <Link to={`/products/${cat.slug}`} key={cat.name} className="flex-shrink-0">
              <motion.div 
                whileHover={{ y: -5 }}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center border border-aura-nude group-hover:border-aura-brown transition-all duration-700 p-1 bg-white shadow-sm">
                  {categoryIcons[cat.icon]}
                </div>
                <span className="mt-4 text-[9px] md:text-[11px] font-bold tracking-[0.25em] text-aura-brown/80 group-hover:text-aura-tan transition-colors uppercase">
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