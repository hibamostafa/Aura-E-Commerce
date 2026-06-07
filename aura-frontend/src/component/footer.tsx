import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Globe, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-aura-brown text-aura-beige pt-16 pb-8 px-6 md:px-16 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
        
        {/* COLUMN 1: BRAND STORY */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-serif tracking-[0.2em] leading-none">AURA</h2>
            <p className="text-[8px] tracking-[0.4em] uppercase font-bold text-aura-tan ml-1">Boutique</p>
          </div>
          <p className="text-sm leading-relaxed opacity-80 font-light italic">
            Curating elegance for the modern woman. Our pieces are designed to bring out your inner aura through timeless silhouettes and premium fabrics.
          </p>
         <div className="flex gap-5">
          <a href="#" className="hover:text-aura-tan transition-colors">
    <Camera size={20} />
  </a>
  <a href="#" className="hover:text-aura-tan transition-colors">
    <Globe size={20} />
  </a>

</div>
        </div>

        {/* COLUMN 2: SHOPPING */}
        <div className="flex flex-col gap-6">
          <h4 className="text-xs font-bold tracking-[0.3em] uppercase border-b border-aura-tan/30 pb-2 w-fit">Shopping</h4>
          <nav className="flex flex-col gap-3 text-sm opacity-80 font-light">
            <Link to="/category/new-in" className="hover:text-aura-tan hover:translate-x-1 transition-all">New Arrivals</Link>
            <Link to="/category/best-sellers" className="hover:text-aura-tan hover:translate-x-1 transition-all">Best Sellers</Link>
            <Link to="/category/sets" className="hover:text-aura-tan hover:translate-x-1 transition-all">Matching Sets</Link>
            <Link to="/category/sale" className="hover:text-aura-tan hover:translate-x-1 transition-all text-aura-tan">Special Offers</Link>
          </nav>
        </div>

        {/* COLUMN 3: CUSTOMER CARE */}
        <div className="flex flex-col gap-6">
          <h4 className="text-xs font-bold tracking-[0.3em] uppercase border-b border-aura-tan/30 pb-2 w-fit">Customer Care</h4>
          <div className="flex flex-col gap-4 text-sm opacity-80 font-light">
            <div className="flex items-center gap-3">
              <Phone size={14} className="text-aura-tan" />
              <span>+971 50 123 4567</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-aura-tan" />
              <span>hello@auraboutique.com</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={14} className="text-aura-tan" />
              <span>Dubai Design District, UAE</span>
            </div>
          </div>
        </div>

        {/* COLUMN 4: NEWSLETTER */}
        <div className="flex flex-col gap-6">
          <h4 className="text-xs font-bold tracking-[0.3em] uppercase border-b border-aura-tan/30 pb-2 w-fit">Join the Aura</h4>
          <p className="text-sm opacity-80 font-light">
            Subscribe to receive updates on new collections and exclusive events.
          </p>
          <div className="relative group">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="w-full bg-white/5 border border-white/10 rounded-none py-3 px-4 text-sm outline-none focus:border-aura-tan transition-all"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-aura-tan hover:text-white transition-colors">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

      </div>

      {/* BOTTOM BAR */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] tracking-widest uppercase opacity-50">
          © 2026 AURA BOUTIQUE. ALL RIGHTS RESERVED.
        </p>
        <div className="flex gap-8 text-[10px] tracking-widest uppercase opacity-50">
          <Link to="/privacy" className="hover:opacity-100 transition-opacity">Privacy Policy</Link>
          <Link to="/terms" className="hover:opacity-100 transition-opacity">Terms of Service</Link>
          <Link to="/shipping" className="hover:opacity-100 transition-opacity">Shipping & Returns</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;