import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, Heart, LogOut, Save, ShoppingBag, Trash2, ArrowRight, ShieldCheck 
} from 'lucide-react';

// --- TYPES & INTERFACES ---
export interface Product {
  id: number;
  name: string;
  Price: number; 
  Name: string;  
  img: string;
  Img: string;
  category: string;
  quantity?: number;
}

interface UserProfile {
  fullName: string;
  email: string;
  isLoggedIn: boolean;
  wishlist?: Product[];
  viewHistory?: Product[];
}

interface AuraContextType {
  cart: Product[];
  wishlist: Product[];
  viewHistory: Product[];
  user: UserProfile | null;
  cartTotal: number;
  addToCart: (p: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  addToWishlist: (p: Product) => void;
  removeFromWishlist: (id: number) => void;
  addToViewHistory: (p: Product) => void;
  saveWishlistToProfile: () => void;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuraContext = createContext<AuraContextType | undefined>(undefined);

// --- FIX: Prevents broken temporary local blobs from breaking your DOM ---
const cleanImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('blob:')) return ''; 
  return url;
};

// --- CONTEXT PROVIDER ---
export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aura_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aura_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [viewHistory, setViewHistory] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aura_viewHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('aura_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => { localStorage.setItem('aura_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('aura_wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('aura_viewHistory', JSON.stringify(viewHistory)); }, [viewHistory]);
  useEffect(() => { localStorage.setItem('aura_user', JSON.stringify(user)); }, [user]);
  useEffect(() => {
    if (user?.isLoggedIn && user.wishlist) {
      setWishlist(user.wishlist);
    }
  }, [user?.wishlist]);

  const addToCart = (p: Product) => {
    const existing = cart.find(item => item.id === p.id);
    if (existing) {
      updateQuantity(p.id, 1);
    } else {
      setCart([...cart, { ...p, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item
    ));
  };

  const removeFromCart = (id: number) => setCart(cart.filter(item => item.id !== id));
  const clearCart = () => setCart([]);

  const addToWishlist = (p: Product) => {
    const productId = p.id || (p as any).Id;
    if (!wishlist.find(item => (item.id || (item as any).Id) === productId)) {
      setWishlist([...wishlist, { ...p, id: productId || (p as any).Id }]);
    }
  };
  const removeFromWishlist = (id: number) => setWishlist(wishlist.filter(item => (item.id || (item as any).Id) !== id));

  const addToViewHistory = (p: Product) => {
    const existing = viewHistory.findIndex(item => item.id === p.id);
    if (existing >= 0) {
      const updated = [...viewHistory];
      updated.splice(existing, 1);
      updated.unshift(p);
      setViewHistory(updated);
    } else {
      setViewHistory([p, ...viewHistory]);
    }
  };

  const saveWishlistToProfile = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE}/api/Users/wishlist`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, wishlist, viewHistory })
      });
      if (response.ok) {
        const updatedUser = { ...user, wishlist, viewHistory };
        setUser(updatedUser);
        localStorage.setItem('aura_user', JSON.stringify(updatedUser));
        return { success: true };
      } else {
        console.error('Failed to save wishlist:', response.status);
        const updatedUser = { ...user, wishlist, viewHistory };
        setUser(updatedUser);
        localStorage.setItem('aura_user', JSON.stringify(updatedUser));
        return { success: false, message: 'Local save completed, cloud sync failed' };
      }
    } catch (e) {
      console.error('Wishlist sync error:', e);
      const updatedUser = { ...user, wishlist, viewHistory };
      setUser(updatedUser);
      localStorage.setItem('aura_user', JSON.stringify(updatedUser));
      return { success: false, message: 'Saved locally, cloud connection error' };
    }
  };

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5058';

  const register = async (fullName: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/Users/register`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ FullName: fullName, Email: email, Password: password })
      });
      if (response.ok) {
        const data = await response.json();
        const loggedUser = {
          fullName: data.FullName,
          email: data.Email,
          isLoggedIn: true,
          wishlist: wishlist.length ? wishlist : data.Wishlist || []
        };
        setUser(loggedUser);
        setWishlist(loggedUser.wishlist || []);
        return { success: true };
      }
      return { success: false, message: "Registration failed." };
    } catch (e) { return { success: false, message: "Cloud Error" }; }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/Users/login`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password })
      });
      if (response.ok) {
        const data = await response.json();
        const loggedUser = {
          fullName: data.FullName,
          email: data.Email,
          isLoggedIn: true,
          wishlist: wishlist.length ? wishlist : data.Wishlist || [],
          viewHistory: viewHistory.length ? viewHistory : data.ViewHistory || []
        };
        setUser(loggedUser);
        setWishlist(loggedUser.wishlist || []);
        setViewHistory(loggedUser.viewHistory || []);
        return { success: true };
      }
      return { success: false, message: "Invalid credentials" };
    } catch (e) { return { success: false, message: "Cloud Error" }; }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aura_user');
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.Price * (item.quantity || 1)), 0);

  return (
    <AuraContext.Provider value={{ 
      cart, wishlist, viewHistory, user, cartTotal, addToCart, removeFromCart, 
      updateQuantity, clearCart, addToWishlist, removeFromWishlist, addToViewHistory, saveWishlistToProfile,
      register, login, logout 
    }}>
      {children}
    </AuraContext.Provider>
  );
};

export const useAura = () => {
  const context = useContext(AuraContext);
  if (!context) throw new Error("useAura must be used within AuraProvider");
  return context;
};

// --- PROFILE CONTENT COMPONENT ---
const ProfilePageContent: React.FC = () => {
  const { user, wishlist, viewHistory, addToCart, removeFromWishlist, saveWishlistToProfile, logout } = useAura();
  const [activeTab, setActiveTab] = useState<'wishlist' | 'viewHistory'>('wishlist');
  
  const savedViewHistory = user?.viewHistory || [];

  if (!user?.isLoggedIn) {
    return (
      <div className="aura-profile-auth-fallback">
        <div className="auth-fallback-card">
          <div className="fallback-icon"><User size={32} /></div>
          <h2>Join the Aura Community</h2>
          <p>Sign in to view your wardrobe wishlist and track your orders.</p>
          <button type="button" className="aura-btn-primary">
            Sign In / Register <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="aura-profile-container">
      <header className="aura-profile-header">
        <div className="header-meta">
          <span className="subtitle">AURA MEMBERSHIP</span>
          <h1>My Wardrobe Workspace</h1>
        </div>
      </header>

      <div className="aura-profile-grid">
        {/* Left Side Panel */}
        <aside className="aura-sidebar-card">
          <div className="profile-hero">
            <div className="avatar-circle">{getInitials(user.fullName)}</div>
            <h3>{user.fullName}</h3>
            <span className="member-badge"><ShieldCheck size={14} /> Verified Member</span>
          </div>

          <div className="profile-details-list">
            <div className="detail-item">
              <span className="label">Registered Email</span>
              <span className="value">{user.email}</span>
            </div>
            <div className="detail-item">
              <span className="label">Active Wishlist Items</span>
              <span className="value">{wishlist.length}</span>
            </div>
            <div className="detail-item">
              <span className="label">Viewed Products History</span>
              <span className="value">{savedViewHistory.length}</span>
            </div>
          </div>

          <div className="profile-actions-wrapper">
            <button 
              type="button" 
              className="aura-btn-secondary" 
              onClick={saveWishlistToProfile}
              title="Saves local wishlist to your cloud account data"
            >
              <Save size={16} /> Backup to Cloud
            </button>
            <button type="button" className="aura-btn-tertiary" onClick={logout}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Right Side Wishlist Main Engine */}
        <main className="aura-wishlist-hub">
          <div className="tab-navigation">
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('wishlist')}
            >
              <Heart size={16} /> Active Wishlist ({wishlist.length})
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'viewHistory' ? 'active' : ''}`}
              onClick={() => setActiveTab('viewHistory')}
            >
              <ShoppingBag size={16} /> History Viewed ({savedViewHistory.length})
            </button>
          </div>

          <div className="tab-pane-content">
            {activeTab === 'wishlist' ? (
              wishlist.length > 0 ? (
                <div className="wishlist-modern-grid">
                  {wishlist.map(item => {
                    const itemId = item.id || (item as any).Id;
                    const safeImg = cleanImageUrl(item.Img || item.img);
                    return (
                      <div className="wishlist-card-modern" key={itemId}>
                        <div className="card-image-wrap">
                          {safeImg ? (
                            <a href={`/product/${itemId}`} className="product-detail-link">
                              <img src={safeImg} alt={item.Name || item.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </a>
                          ) : (
                            <a href={`/product/${itemId}`} className="img-fallback">No Preview</a>
                          )}
                          <button 
                            type="button" 
                            className="item-remove-btn" 
                            onClick={() => removeFromWishlist(itemId)}
                            aria-label="Remove Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="card-info">
                          <span className="item-category">{item.category || 'Apparel'}</span>
                          <h4>
                            <a href={`/product/${itemId}`}>{item.Name || item.name}</a>
                          </h4>
                          <p className="item-price">{item.Price} AED</p>
                          
                          <button 
                            type="button" 
                            className="add-to-cart-quick-btn"
                            onClick={() => addToCart(item)}
                          >
                            <ShoppingBag size={14} /> Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-wishlist-state">
                  <Heart size={32} />
                  <p>Your current active wishlist is empty.</p>
                </div>
              )
            ) : (
              savedViewHistory.length > 0 ? (
                <div className="wishlist-modern-grid">
                  {savedViewHistory.map(item => {
                    const itemId = item.id || (item as any).Id;
                    const safeImg = cleanImageUrl(item.Img || item.img);
                    return (
                      <div className="wishlist-card-modern cloud-state" key={itemId}>
                        <div className="card-image-wrap">
                          {safeImg ? (
                            <a href={`/product/${itemId}`}>
                              <img src={safeImg} alt={item.Name || item.name} />
                            </a>
                          ) : (
                            <a href={`/product/${itemId}`} className="img-fallback">No Preview</a>
                          )}
                        </div>
                        <div className="card-info">
                          <span className="item-category">{item.category || 'Apparel'}</span>
                          <h4>
                            <a href={`/product/${itemId}`}>{item.Name || item.name}</a>
                          </h4>
                          <p className="item-price">{item.Price} AED</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-wishlist-state">
                  <ShoppingBag size={32} />
                  <p>No viewed products history yet. Start browsing items!</p>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// --- EMBEDDED HIGH-END VISUAL SYSTEM STYLES ---
const cssStyles = `
  :root {
    --aura-bg: #fcfcfc;
    --aura-surface: #ffffff;
    --aura-text-main: #111111;
    --aura-text-muted: #767676;
    --aura-accent: #000000;
    --aura-accent-hover: #222222;
    --aura-border: #eeeeee;
    --aura-radius-sm: 4px;
    --aura-radius-md: 8px;
    --aura-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    --font-serif: "Didot", "Bodoni MT", serif;
  }

  .aura-profile-container {
    max-width: 1300px;
    margin: 0 auto;
    padding: 40px 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--aura-text-main);
    background-color: var(--aura-bg);
  }

  .aura-profile-header {
    margin-bottom: 48px;
    border-bottom: 1px solid var(--aura-border);
    padding-bottom: 24px;
  }
  .aura-profile-header .subtitle {
    font-size: 11px;
    letter-spacing: 0.18em;
    color: var(--aura-text-muted);
    font-weight: 600;
    display: block;
    margin-bottom: 6px;
  }
  .aura-profile-header h1 {
    font-family: var(--font-serif);
    font-size: 36px;
    font-weight: 400;
    margin: 0;
  }

  .aura-profile-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 40px;
    align-items: start;
  }

  @media (max-width: 968px) {
    .aura-profile-grid {
      grid-template-columns: 1fr;
    }
  }

  .aura-sidebar-card {
    background: var(--aura-surface);
    border: 1px solid var(--aura-border);
    border-radius: var(--aura-radius-md);
    padding: 32px 24px;
    box-shadow: var(--aura-shadow);
  }
  .profile-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 32px;
  }
  .avatar-circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 20px;
    letter-spacing: 1px;
    margin-bottom: 16px;
    border: 1px solid var(--aura-border);
  }
  .profile-hero h3 {
    font-size: 18px;
    margin: 0 0 8px 0;
    font-weight: 600;
  }
  .member-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #2e7d32;
    background: #edf7ed;
    padding: 4px 10px;
    border-radius: 20px;
  }

  .profile-details-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }
  .detail-item {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--aura-border);
    padding-bottom: 12px;
  }
  .detail-item .label {
    font-size: 11px;
    color: var(--aura-text-muted);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .detail-item .value {
    font-size: 14px;
    font-weight: 500;
    word-break: break-all;
  }

  .profile-actions-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .aura-btn-primary, .aura-btn-secondary, .aura-btn-tertiary {
    width: 100%;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    border-radius: var(--aura-radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
  }
  .aura-btn-primary {
    background: var(--aura-accent);
    color: white;
    border: none;
  }
  .aura-btn-primary:hover { background: var(--aura-accent-hover); }

  .aura-btn-secondary {
    background: transparent;
    color: var(--aura-text-main);
    border: 1px solid var(--aura-text-main);
  }
  .aura-btn-secondary:hover { background: #f5f5f5; }

  .aura-btn-tertiary {
    background: transparent;
    color: #c62828;
    border: 1px solid transparent;
  }
  .aura-btn-tertiary:hover { background: #ffebee; }

  .aura-wishlist-hub {
    background: var(--aura-surface);
  }
  .tab-navigation {
    display: flex;
    gap: 24px;
    border-bottom: 1px solid var(--aura-border);
    margin-bottom: 32px;
  }
  .tab-btn {
    background: none;
    border: none;
    padding: 12px 4px;
    font-size: 14px;
    font-weight: 500;
    color: var(--aura-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    transition: color 0.2s;
  }
  .tab-btn:hover { color: var(--aura-text-main); }
  .tab-btn.active {
    color: var(--aura-text-main);
  }
  .tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--aura-accent);
  }

  .wishlist-modern-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 32px 24px;
  }
  .wishlist-card-modern {
    display: flex;
    flex-direction: column;
  }
  .card-image-wrap {
    position: relative;
    background: #f9f9f9;
    aspect-ratio: 3 / 4;
    overflow: hidden;
    border-radius: var(--aura-radius-sm);
    margin-bottom: 14px;
  }
  .card-image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .wishlist-card-modern:hover .card-image-wrap img {
    transform: scale(1.04);
  }
  .img-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f1f1;
    color: var(--aura-text-muted);
    font-size: 12px;
    text-decoration: none;
  }

  .item-remove-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--aura-surface);
    border: 1px solid var(--aura-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--aura-text-muted);
    cursor: pointer;
    opacity: 0.8;
    transition: all 0.2s ease;
    z-index: 2;
  }
  .item-remove-btn:hover {
    color: #c62828;
    opacity: 1;
    transform: scale(1.05);
  }

  .card-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  .card-info h4 {
    font-size: 14px;
    font-weight: 500;
    margin: 4px 0;
    line-height: 1.4;
  }
  .card-info h4 a {
    color: var(--aura-text-main);
    text-decoration: none;
  }
  .card-info h4 a:hover {
    text-decoration: underline;
  }
  .item-category {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--aura-text-muted);
    letter-spacing: 0.05em;
  }
  .item-price {
    font-size: 13px;
    font-weight: 600;
    margin: 4px 0 14px 0;
  }

  .add-to-cart-quick-btn {
    margin-top: auto;
    background: transparent;
    border: 1px solid #dddddd;
    color: var(--aura-text-main);
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    border-radius: var(--aura-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .add-to-cart-quick-btn:hover {
    background: var(--aura-accent);
    border-color: var(--aura-accent);
    color: white;
  }

  .cloud-state .card-image-wrap {
    opacity: 0.85;
  }

  .empty-wishlist-state {
    text-align: center;
    padding: 80px 24px;
    color: var(--aura-text-muted);
    border: 1px dashed var(--aura-border);
    border-radius: var(--aura-radius-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .empty-wishlist-state p {
    font-size: 14px;
    margin: 0;
  }

  .aura-profile-auth-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 24px;
    background: var(--aura-bg);
  }
  .auth-fallback-card {
    max-width: 400px;
    text-align: center;
    background: var(--aura-surface);
    border: 1px solid var(--aura-border);
    border-radius: var(--aura-radius-md);
    padding: 40px 32px;
    box-shadow: var(--aura-shadow);
  }
  .fallback-icon {
    width: 64px;
    height: 64px;
    background: #f5f5f5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px auto;
    color: var(--aura-text-muted);
  }
  .auth-fallback-card h2 {
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 400;
    margin: 0 0 12px 0;
  }
  .auth-fallback-card p {
    font-size: 14px;
    color: var(--aura-text-muted);
    margin-bottom: 24px;
    line-height: 1.5;
  }
`;

// --- MAIN EXPORT WRAPPER ---
const ProfilePage: React.FC = () => (
  <AuraProvider>
    {/* Style Injection directly into the DOM tree */}
    <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
    <ProfilePageContent />
  </AuraProvider>
);

export default ProfilePage;