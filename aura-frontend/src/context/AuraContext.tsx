import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Interfaces
export interface Product {
  id: number;
  Id?: number;     // PascalCase for .NET Database compatibility
  Name: string;    // PascalCase for .NET
  Price: number;   // PascalCase for .NET
  Img: string;     // PascalCase for .NET
  category: string;
  quantity?: number;
}

interface UserProfile {
  fullName: string;
  email: string;
  isLoggedIn: boolean;
  wishlist?: Product[]; // Store persistent cloud wishlist items
}

interface AuraContextType {
  cart: Product[];
  wishlist: Product[];
  user: UserProfile | null;
  cartTotal: number;
  addToCart: (p: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  addToWishlist: (p: Product) => void;
  removeFromWishlist: (id: number) => void;
  saveWishlistToProfile: () => Promise<{ success: boolean; message?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuraContext = createContext<AuraContextType | undefined>(undefined);

// Base endpoint for user authentication and features
const API_BASE = 'http://localhost:5058/api/Users';

// --- SAFE LOCALSTORAGE HELPERS ---
const safeSetItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (error instanceof DOMException && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn(`[LocalStorage] Space quota exceeded for key "${key}". Clearing non-essential local data...`);
      // Clean non-essential keys to free up space if needed
      try {
        localStorage.removeItem('aura_cart');
        localStorage.removeItem('aura_wishlist');
      } catch {}
    } else {
      console.error(error);
    }
  }
};

// Helper to strip heavy Base64 image payloads before writing to local storage
const pruneProductDetails = (products: Product[]): Product[] => {
  return products.map(item => ({
    ...item,
    Img: item.Img?.startsWith('data:image/') ? '' : item.Img,
    img: (item as any).img?.startsWith('data:image/') ? '' : (item as any).img
  }));
};

// Retry helper for transient failures
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (e) {
      if (attempt === maxRetries - 1) throw e;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed to fetch after retries.');
};

export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 2. Persistence Logic (Loading from LocalStorage)
  const [cart, setCart] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aura_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aura_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('aura_user');
    return saved ? JSON.parse(saved) : null;
  });

  // 3. Sync LocalStorage safely by pruning heavy Base64 payloads first
  useEffect(() => { 
    safeSetItem('aura_cart', pruneProductDetails(cart)); 
  }, [cart]);

  useEffect(() => { 
    safeSetItem('aura_wishlist', pruneProductDetails(wishlist)); 
  }, [wishlist]);
  
  // Keep auth state in sync with localStorage
  useEffect(() => {
    if (user) safeSetItem('aura_user', user);
    else localStorage.removeItem('aura_user');
  }, [user]);

  const register = async (fullName: string, email: string, password: string) => {
    try {
      const payload = { FullName: fullName, Email: email, Password: password };
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let message = `Registration failed with status ${response.status}.`;
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          message = errorData?.message || errorData?.error || JSON.stringify(errorData) || message;
        } catch {
          message = errorText || message;
        }
        console.error('Register error:', response.status, message);
        return { success: false, message };
      }

      const data = await response.json();
      const serverWishlist = data.wishlist || data.Wishlist || [];

      const loggedUser = {
        fullName: data.fullName || data.FullName || fullName,
        email: data.email || data.Email || email,
        isLoggedIn: true,
        wishlist: serverWishlist
      };

      setUser(loggedUser);
      setWishlist(serverWishlist); 
      return { success: true };
    } catch (e) {
      console.error('Register exception:', e);
      return { success: false, message: "Aura Cloud connection failed." };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const payload = { Email: email, Password: password };
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let message = "Invalid email or password.";
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          message = errorData?.message || errorData?.error || message;
        } catch {
          // fallback
        }
        return { success: false, message };
      }

      const data = await response.json();
      const serverWishlist = data.wishlist || data.Wishlist || [];

      const loggedUser = {
        fullName: data.fullName || data.FullName || "Aura Member",
        email: data.email || data.Email || email,
        isLoggedIn: true,
        wishlist: serverWishlist
      };

      setUser(loggedUser);
      setWishlist(serverWishlist); 
      return { success: true };
    } catch (e) {
      console.error('Login exception:', e);
      return { success: false, message: "Aura Server is offline." };
    }
  };

  const logout = () => {
    setUser(null);
    setWishlist([]);
    localStorage.removeItem('aura_user');
  };

  // --- PRIVATE BACKGROUND SYNC HELPER ---
  const syncWishlistToCloud = async (currentList: Product[]) => {
    if (!user?.isLoggedIn) return;

    const productIds = currentList
      .map(item => item.Id || item.id)
      .filter((id): id is number => typeof id === 'number');

    try {
      const response = await fetchWithRetry(`${API_BASE}/wishlist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          productIds: productIds
        })
      });

      if (response.ok) {
        const data = await response.json();
        const serverWishlist = data.wishlist || data.Wishlist || [];
        
        setUser(prev => prev ? { ...prev, wishlist: serverWishlist } : null);
      }
    } catch (e) {
      console.error('Background wishlist sync failed:', e);
    }
  };

  // --- PERSISTENT USER WISHLIST SYNC ACTION (MANUAL) ---
  const saveWishlistToProfile = async () => {
    if (!user) {
      return { success: false, message: "You must be signed in to sync your wardrobe profile." };
    }

    const productIds = wishlist
      .map(item => item.Id || item.id)
      .filter((id): id is number => typeof id === 'number');

    try {
      const response = await fetchWithRetry(`${API_BASE}/wishlist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          productIds: productIds
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let message = "Failed to sync your wishlist database.";
        try {
          const parsed = JSON.parse(errorText);
          message = parsed?.message || parsed?.error || message;
        } catch {
          message = errorText || message;
        }
        return { success: false, message };
      }

      const data = await response.json();
      const serverWishlist = data.wishlist || data.Wishlist || [];

      const updatedUser = {
        ...user,
        wishlist: serverWishlist
      };

      setUser(updatedUser);
      setWishlist(serverWishlist);
      return { success: true };
    } catch (e) {
      console.error('Sync wishlist exception:', e);
      return { success: false, message: "Unable to contact Aura services." };
    }
  };

  // --- SHOPPING ACTIONS ---
  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item =>
      (item.Id || item.id) === id ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item
    ));
  };

  const addToCart = (p: Product) => {
    const id = p.Id || p.id;
    const existing = cart.find(item => (item.Id || item.id) === id);
    if (existing) updateQuantity(id, 1);
    else setCart([...cart, { ...p, quantity: 1 }]);
  };

  const removeFromCart = (id: number) => setCart(cart.filter(item => (item.Id || item.id) !== id));
  const clearCart = () => setCart([]);

  // --- LOVE / WISHLIST ACTIONS WITH INSTANT BACKGROUND CLOUD SYNC ---
  const addToWishlist = (p: Product) => {
    const id = p.Id || p.id;
    if (wishlist.find(item => (item.Id || item.id) === id)) return;

    const updated = [...wishlist, p];
    setWishlist(updated);
    
    // background sync instantly
    syncWishlistToCloud(updated);
  };

  const removeFromWishlist = (id: number) => {
    const updated = wishlist.filter(item => (item.Id || item.id) !== id);
    setWishlist(updated);

    // background sync instantly
    syncWishlistToCloud(updated);
  };

  // Calculate total using PascalCase Price from your .NET Database
  const cartTotal = cart.reduce((acc, item) => acc + ((item.Price || 0) * (item.quantity || 1)), 0);

  return (
    <AuraContext.Provider value={{ 
      cart, wishlist, user, cartTotal, addToCart, removeFromCart, 
      updateQuantity, clearCart, addToWishlist, removeFromWishlist, saveWishlistToProfile,
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