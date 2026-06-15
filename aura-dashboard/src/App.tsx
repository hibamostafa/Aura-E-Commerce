import React, { useEffect, useState, useRef } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Package, Trash2, 
  Edit, Plus, X, Menu, Upload, Users, Loader2, Clock, RefreshCcw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = "https://aura-backend-s64s.onrender.com/api"; 

// --- Embedded CSS Styles ---
const injectedStyles = `
  :root {
    --aura-brown: #5d4037;
    --aura-tan: #e0d5c1;
    --aura-red: #d9534f;
    --bg-light: #fdfbf9;
    --border-color: #e2e8f0;
    --text-main: #333;
    --text-muted: #888;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background-color: var(--bg-light); color: var(--text-main); }

  /* Animations */
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes spin { to { transform: rotate(360deg); } }

  .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
  .skeleton-pulse { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .spin { animation: spin 1s linear infinite; }

  /* Layout */
  .dashboard-container { display: flex; min-height: 100vh; }
  
  /* Sidebar */
  .sidebar {
    width: 260px; background: #fff; border-right: 1px solid var(--border-color);
    display: flex; flex-direction: column; transition: transform 0.3s ease;
    z-index: 50; position: fixed; height: 100vh; left: 0; top: 0;
  }
  .sidebar-logo { padding: 32px 24px; text-align: center; border-bottom: 1px solid var(--border-color); }
  .sidebar-logo h1 { font-family: serif; letter-spacing: 0.2em; color: var(--aura-brown); margin-bottom: 4px; }
  .sidebar-logo p { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
  .nav-links { padding: 24px 12px; display: flex; flex-direction: column; gap: 8px; }
  .nav-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: none; background: none;
    cursor: pointer; border-radius: 8px; color: var(--text-muted); font-weight: 500; font-size: 14px;
    transition: all 0.2s; text-align: left; width: 100%; align-items: center;
  }
  .nav-item:hover { background: #f5f5f4; color: var(--text-main); }
  .nav-item.active { background: var(--aura-tan); color: var(--aura-brown); }
  .badge { background: var(--aura-brown); color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: auto; }

  /* Main Content */
  .main-content { flex: 1; padding: 32px; margin-left: 260px; max-width: 1200px; width: 100%; }
  .mobile-header { display: none; padding-bottom: 24px; border-bottom: 1px solid var(--border-color); margin-bottom: 24px; }
  .hamburger { background: none; border: none; cursor: pointer; color: var(--text-main); }
  .aura-title { font-family: serif; color: var(--aura-brown); }
  .section-title { font-size: 24px; font-weight: 600; margin-bottom: 24px; color: var(--aura-brown); }

  /* Grids & Cards */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 32px; }
  .stat-card { background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--border-color); position: relative; }
  .stat-card h3 { font-size: 32px; font-weight: 700; margin-bottom: 4px; }
  .stat-card p { color: var(--text-muted); font-size: 14px; }
  .stat-card svg { position: absolute; top: 24px; right: 24px; opacity: 0.8; }
  
  .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
  .order-card { background: #fff; border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .order-header { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); border-bottom: 1px solid var(--border-color); padding-bottom: 12px; }
  .status-indicator { display: flex; align-items: center; gap: 6px; color: #d97706; font-weight: 500; }
  .order-body h4 { font-size: 16px; margin-bottom: 4px; }
  .order-body p { font-size: 13px; color: var(--text-muted); margin-bottom: 4px; }
  .order-footer { margin-top: auto; display: flex; justify-content: space-between; font-weight: 600; background: #f9f9f9; padding: 12px; border-radius: 8px; }

  /* Tables */
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .add-btn { background: var(--aura-brown); color: white; border: none; padding: 10px 20px; border-radius: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .add-btn:hover { background: #3e2a25; }
  .data-table-container { background: #fff; border-radius: 16px; border: 1px solid var(--border-color); overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  th { padding: 16px; font-size: 12px; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border-color); background: #fcfcfc; }
  td { padding: 16px; font-size: 14px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
  .table-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; }
  .bold { font-weight: 600; }
  .italic { font-style: italic; }
  .uppercase { text-transform: uppercase; }
  .action-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 4px; transition: background 0.2s; }
  .action-btn:hover { background: #f0f0f0; }
  .edit-btn { color: #3b82f6; }
  .delete-btn { color: var(--aura-red); }
  .badge-member { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }

  /* Modal Form */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 100; padding: 20px; }
  .modal-card { background: #fff; border-radius: 24px; width: 100%; max-width: 900px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
  .sticky-header { position: sticky; top: 0; background: #fff; padding: 24px 32px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; z-index: 10; border-radius: 24px 24px 0 0; }
  .sticky-header h3 { font-family: serif; color: var(--aura-brown); margin-bottom: 4px; }
  .sticky-header .subtitle { font-size: 13px; color: var(--text-muted); }
  .close-x { background: #f5f5f4; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; }
  .close-x:hover { background: #e5e5e5; }
  
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 32px; }
  .section-heading { font-size: 14px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
  
  .media-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .image-preview-box { position: relative; aspect-ratio: 4/5; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); }
  .image-preview-box img { width: 100%; height: 100%; object-fit: cover; }
  .remove-image-btn { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; cursor: pointer; }
  .cover-badge { position: absolute; bottom: 8px; left: 8px; background: rgba(255,255,255,0.9); font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 4px; }
  .add-photo-box { aspect-ratio: 4/5; border: 2px dashed var(--border-color); border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; background: #fafafa; cursor: pointer; color: var(--text-muted); font-size: 13px; font-weight: 500; transition: 0.2s; }
  .add-photo-box:hover { background: #f0f0f0; border-color: #ccc; }
  
  .input-group { border: none; margin-bottom: 24px; }
  .input-wrapper { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .input-wrapper label { font-size: 13px; font-weight: 500; color: #555; }
  .premium-input { padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; font-family: inherit; background: #fafafa; }
  .premium-input:focus { border-color: var(--aura-brown); background: #fff; }
  .input-row { display: flex; gap: 16px; }
  .w-50 { flex: 1; }
  .resize-y { resize: vertical; }
  .text-red { color: var(--aura-red) !important; }
  .strikethrough-active { text-decoration: line-through; color: var(--text-muted); }
  
  .sale-toggle-wrapper { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px; background: #fcfcfc; border: 1px solid var(--border-color); border-radius: 8px; }
  .toggle-label { display: flex; flex-direction: column; }
  .toggle-label .subtext { font-size: 11px; color: var(--text-muted); font-weight: normal; }
  .toggle-switch { width: 44px; height: 24px; background: #ccc; border-radius: 24px; position: relative; cursor: pointer; transition: 0.3s; }
  .slider { width: 100%; height: 100%; border-radius: 24px; position: relative; }
  .slider.active { background: var(--aura-brown); }
  .knob { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: 0.3s; }
  .slider.active .knob { transform: translateX(20px); }

  .sticky-footer { position: sticky; bottom: 0; background: #fff; padding: 24px 32px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; border-radius: 0 0 24px 24px; }
  .btn-secondary { background: #fff; border: 1px solid var(--border-color); padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; }
  .btn-primary { background: var(--aura-brown); color: #fff; border: none; padding: 12px 32px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; justify-content: center; align-items: center; min-width: 150px; }
  .btn-primary:hover { background: #3e2a25; }

  /* Skeletons */
  .skeleton-wrapper { display: flex; flex-direction: column; gap: 24px; }
  .skeleton-title { height: 28px; width: 150px; background: #e2e8f0; border-radius: 6px; }
  .skeleton-card { background: #fff; border-color: transparent; }
  .skeleton-line { height: 16px; background: #e2e8f0; border-radius: 4px; width: 80%; margin-bottom: 8px; }
  .skeleton-line.short { width: 40%; height: 24px; margin-bottom: 12px; }
  .skeleton-table-header { height: 48px; background: #e2e8f0; border-radius: 8px 8px 0 0; }
  .skeleton-table-row { height: 64px; background: #f8fafc; border-bottom: 1px solid #fff; }

  /* Responsive Utilities */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; display: none; }
  
  @media (max-width: 1024px) {
    .form-grid { grid-template-columns: 1fr; gap: 24px; }
  }
  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .main-content { margin-left: 0; padding: 16px; }
    .mobile-header { display: flex; }
    .overlay.visible { display: block; }
    .input-row { flex-direction: column; gap: 0; }
  }
`;

// --- Client-Side Image Compression Helper ---
const compressImage = (base64Str: string, maxWidth = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// --- Modern Skeleton Loader Component ---
interface SkeletonLoaderProps {
  view: 'OVERVIEW' | 'PRODUCTS' | 'ORDERS' | 'CUSTOMERS';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ view }) => {
  if (view === 'OVERVIEW') {
    return (
      <div className="skeleton-wrapper animate-fade-in">
        <div className="skeleton-title skeleton-pulse"></div>
        <div className="stats-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card skeleton-card skeleton-pulse">
              <div className="skeleton-line short"></div>
              <div className="skeleton-line"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'PRODUCTS' || view === 'CUSTOMERS') {
    return (
      <div className="skeleton-wrapper animate-fade-in">
        <div className="header-row">
          <div className="skeleton-title skeleton-pulse" style={{ width: '200px' }}></div>
          {view === 'PRODUCTS' && <div className="skeleton-button skeleton-pulse" style={{width: '120px', height: '36px', borderRadius: '8px', background: '#e2e8f0'}}></div>}
        </div>
        <div className="data-table-container shadow-hover">
          <div className="skeleton-table">
            <div className="skeleton-table-header skeleton-pulse"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-table-row skeleton-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'ORDERS') {
    return (
      <div className="skeleton-wrapper animate-fade-in">
        <div className="skeleton-title skeleton-pulse" style={{ width: '220px' }}></div>
        <div className="orders-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="order-card skeleton-card skeleton-pulse" style={{ height: '220px' }}>
              <div className="skeleton-line" style={{ width: '40%', marginBottom: '20px' }}></div>
              <div className="skeleton-line" style={{ width: '80%', marginBottom: '10px' }}></div>
              <div className="skeleton-line" style={{ width: '60%', marginBottom: '10px' }}></div>
              <div className="skeleton-line" style={{ width: '30%', marginTop: 'auto' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

const App: React.FC = () => {
  // --- OWNER SECURE AUTHENTICATION STATE ---
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState(() => {
    return localStorage.getItem('aura_owner_auth') === 'true';
  });
  const [ownerPasscode, setOwnerPasscode] = useState('');

  // Navigation State
  const [currentView, setCurrentView] = useState<'OVERVIEW' | 'PRODUCTS' | 'ORDERS' | 'CUSTOMERS'>('OVERVIEW');
  
  // Data States
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // UI States
  const [showForm, setShowForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    Name: '', Price: '', Category: 'tops', Status: 'new-in', 
    Colors: '', Sizes: '', Description: '',
    OnSale: false, OriginalPrice: '', SalePrice: ''
  });
  
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeApiList = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.Products)) return data.Products;
      if (Array.isArray(data.products)) return data.products;
    }
    return [];
  };

  const normalizeUsers = (data: any): any[] => {
    const extractArray = (obj: any): any[] => {
      if (Array.isArray(obj)) return obj;
      if (!obj || typeof obj !== 'object') return [];
      const candidateKeys = ['users', 'Users', 'data', 'items', 'members', 'Accounts', 'customers', 'results'];
      for (const key of candidateKeys) {
        if (Array.isArray(obj[key])) return obj[key];
      }
      return [];
    };

    const source = extractArray(data);
    return source.map((u: any, i: number) => ({
      Id: u.Id ?? u.id ?? u.UserId ?? u.userId ?? u.uid ?? i,
      FullName: u.FullName ?? u.fullName ?? u.name ?? ((`${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim()) || 'Aura Member'),
      Email: u.Email ?? u.email ?? u.emailAddress ?? u.email_address ?? u.userEmail ?? 'no-reply@aura.local'
    }));
  };

  // Improved Fetch Helper that properly throws errors on HTTP failures (404, 500)
  // so the fallback casing-retry catch block is actually executed.
  const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 2, timeout = 7000): Promise<Response> => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        cache: 'no-store',
        mode: 'cors',
        redirect: 'follow',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return fetchWithRetry(url, options, retries - 1, timeout);
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  };

  const buildApiUrl = (resource: string) => {
    const normalizedResource = resource.replace(/^\/+/g, '').replace(/\/+$/g, '');
    return `${API_URL}/${normalizedResource}`;
  };

  const fetchApiResource = async (resource: string): Promise<Response> => {
    const lowerCaseUrl = buildApiUrl(resource.toLowerCase());
    const originalUrl = buildApiUrl(resource);

    try {
      // First try standard lowercase endpoint
      return await fetchWithRetry(lowerCaseUrl);
    } catch (error) {
      // If lower case fails or returns an error, execute capitalized endpoint fallback
      if (originalUrl !== lowerCaseUrl) {
        return await fetchWithRetry(originalUrl);
      }
      throw error;
    }
  };

  useEffect(() => {
    if (isOwnerAuthenticated) {
      fetchData();
    }
  }, [isOwnerAuthenticated]);

  useEffect(() => {
    if (isOwnerAuthenticated && currentView === 'CUSTOMERS') {
      fetchData();
    }
  }, [currentView, isOwnerAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    const syncErrors: string[] = [];

    try {
      const [productResult, orderResult, userResult] = await Promise.allSettled([
        fetchApiResource('Products'),
        fetchApiResource('Orders'),
        fetchApiResource('Users')
      ]);

      if (productResult.status === 'rejected') syncErrors.push("Inventory (Products)");
      if (orderResult.status === 'rejected') syncErrors.push("Orders");
      if (userResult.status === 'rejected') syncErrors.push("Customers (Users)");

      const productsData = productResult.status === 'fulfilled' ? await productResult.value.json() : [];
      const ordersData = orderResult.status === 'fulfilled' ? await orderResult.value.json() : [];
      const usersData = userResult.status === 'fulfilled' ? await userResult.value.json() : [];

      setProducts(normalizeApiList(productsData));
      const normalizedOrders = Array.isArray(ordersData) ? ordersData : normalizeApiList(ordersData);
      setOrders(normalizedOrders);

      let normalizedUsers = normalizeUsers(usersData);
      if (!normalizedUsers || normalizedUsers.length === 0) {
        const derived: any[] = [];
        normalizedOrders.forEach((o: any, i: number) => {
          const email = o.Email || o.email || o.customerEmail || o.buyerEmail || o.userEmail;
          const name = o.FullName || o.fullName || o.customerName || o.buyerName || o.name || `${o.firstName || ''} ${o.lastName || ''}`.trim();
          const id = o.UserId ?? o.userId ?? o.Id ?? o.id ?? (`order-${i}`);
          if (email || name) {
            derived.push({ Id: id, FullName: name || 'Aura Member', Email: email || 'no-reply@aura.local' });
          }
        });
        if (derived.length === 0) {
          derived.push({ Id: 'guest-1', FullName: 'Aura Member', Email: 'no-reply@aura.local' });
        }
        normalizedUsers = derived;
      }
      setUsers(normalizedUsers);

      // Display clean error indicators if specific tables failed to sync
      if (syncErrors.length > 0) {
        toast.error(`Database table access failure: ${syncErrors.join(', ')}. Ensure migrations are applied on your DB.`);
      }
    } catch (e) {
      toast.error("Database connection lost.");
      setProducts([]); setOrders([]); setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const compressedImages = await Promise.all(fileArray.map(async (file) => {
      const reader = new FileReader();
      return new Promise<string>((resolve) => {
        reader.onload = async () => {
          const compressed = await compressImage(reader.result as string);
          resolve(compressed);
        };
        reader.readAsDataURL(file);
      });
    }));
    setImagePreviews(prev => [...prev, ...compressedImages]);
  };

  const removeImagePreview = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- Handlers ---
  const handleEdit = (p: any) => {
    const id = p.Id ?? p.id;
    setEditingId(id);
    setFormData({
      Name: p.Name ?? p.name, 
      Price: (p.Price ?? p.price ?? 0).toString(), 
      Category: p.Category ?? p.category,
      Status: p.Status ?? p.status, 
      Colors: p.Colors ?? p.colors ?? '', 
      Sizes: p.Sizes ?? p.sizes ?? '', 
      Description: p.Description ?? p.description ?? '',
      OnSale: Boolean(p.OnSale ?? p.onSale ?? false),
      OriginalPrice: p.OriginalPrice ? String(p.OriginalPrice) : (p.OriginalCost ? String(p.OriginalCost) : (p.originalPrice ? String(p.originalPrice) : '')),
      SalePrice: p.SalePrice ? String(p.SalePrice) : (p.Sale ? String(p.Sale) : (p.salePrice ? String(p.salePrice) : ''))
    });
    const existingImages = p.Images ?? p.images ?? (p.Img ?? p.img ? [p.Img ?? p.img] : []);
    setImagePreviews(Array.isArray(existingImages) ? existingImages : existingImages ? [existingImages] : []);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = { 
      ...formData, 
      Id: editingId || 0, 
      Price: formData.OnSale ? parseFloat(formData.SalePrice) || parseFloat(formData.Price) : parseFloat(formData.Price), 
      OriginalPrice: formData.OnSale && formData.OriginalPrice ? parseFloat(formData.OriginalPrice) : null,
      SalePrice: formData.OnSale && formData.SalePrice ? parseFloat(formData.SalePrice) : null,
      Img: imagePreviews[0] || '',
      Images: imagePreviews
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/Products/${editingId}` : `${API_URL}/Products`;

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        let savedItem: any = null;
        try { savedItem = await res.json(); } catch { savedItem = null; }
        const productToShow = savedItem && typeof savedItem === 'object' ? savedItem : payload;

        setProducts(prev => {
          if (editingId) {
            return prev.map(p => (p.Id ?? p.id) === editingId ? productToShow : p);
          }
          const exists = prev.some(p => (p.Id ?? p.id) === productToShow.Id);
          return exists ? prev.map(p => (p.Id ?? p.id) === productToShow.Id ? productToShow : p) : [productToShow, ...prev];
        });

        toast.success(editingId ? "Item Updated" : "Item Published");
        resetForm();
        if (!savedItem) fetchData();
      }
    } catch (e) { toast.error("Error saving to cloud."); }
    finally { setIsSubmitting(false); }
  };

  const deleteItem = async (id: number) => {
    if (window.confirm("Permanently remove this item?")) {
      try {
        const res = await fetch(`${API_URL}/Products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setProducts(prev => prev.filter(p => (p.Id ?? p.id) !== id));
          toast.success("Item removed");
        } else {
          toast.error("Unable to remove item.");
        }
      } catch {
        toast.error("Unable to remove item.");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ Name: '', Price: '', Category: 'tops', Status: 'new-in', Colors: '', Sizes: '', Description: '', OnSale: false, OriginalPrice: '', SalePrice: '' });
    setImagePreviews([]);
  };

  // --- RENDERS THE OWNER SECURE LOCK SCREEN IF NOT SIGNED IN ---
  if (!isOwnerAuthenticated) {
    return (
      <div className="dashboard-container" style={{ alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
        <style>{injectedStyles}</style>
        <Toaster position="top-center" />
        <div className="modal-card" style={{ maxWidth: '380px', padding: '32px', textAlign: 'center', margin: 'auto' }}>
          <h1 style={{ fontSize: '24px', fontFamily: 'serif', letterSpacing: '0.2em', color: 'var(--aura-brown)', textTransform: 'uppercase', lineHeight: '1', marginBottom: '4px' }}>AURA</h1>
          <p style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '32px' }}>Management Portal</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="password" 
              placeholder="Enter Owner Passcode" 
              value={ownerPasscode}
              onChange={(e) => setOwnerPasscode(e.target.value)}
              className="premium-input"
              style={{ textAlign: 'center' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (ownerPasscode === "AuraOwner2026") {
                    setIsOwnerAuthenticated(true);
                    localStorage.setItem('aura_owner_auth', 'true');
                  } else {
                    toast.error("Incorrect passcode");
                  }
                }
              }}
            />
            <button 
              type="button"
              onClick={() => {
                if (ownerPasscode === "AuraOwner2026") {
                  setIsOwnerAuthenticated(true);
                  localStorage.setItem('aura_owner_auth', 'true');
                } else {
                  toast.error("Incorrect passcode");
                }
              }}
              className="btn-primary"
              style={{ width: '100%', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Enter Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* INJECT THE SINGLE-FILE CSS STYLES HERE */}
      <style>{injectedStyles}</style>
      
      <div className="dashboard-container">
        <Toaster position="top-center" />
        {isSidebarOpen && <div className="overlay visible" onClick={() => setIsSidebarOpen(false)}></div>}

        {/* --- MODERN SIDEBAR --- */}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo"><h1>AURA</h1><p>Management</p></div>
          <nav className="nav-links">
            <button className={`nav-item ${currentView === 'OVERVIEW' ? 'active' : ''}`} onClick={() => {setCurrentView('OVERVIEW'); setIsSidebarOpen(false);}}>
              <LayoutDashboard size={18}/> OVERVIEW
            </button>
            <button className={`nav-item ${currentView === 'PRODUCTS' ? 'active' : ''}`} onClick={() => {setCurrentView('PRODUCTS'); setIsSidebarOpen(false);}}>
              <ShoppingBag size={18}/> INVENTORY
            </button>
            <button className={`nav-item ${currentView === 'ORDERS' ? 'active' : ''}`} onClick={() => {setCurrentView('ORDERS'); setIsSidebarOpen(false);}}>
              <Package size={18}/> ORDERS <span className="badge">{orders.length}</span>
            </button>
            <button className={`nav-item ${currentView === 'CUSTOMERS' ? 'active' : ''}`} onClick={() => {setCurrentView('CUSTOMERS'); setIsSidebarOpen(false);}}>
              <Users size={18}/> CUSTOMERS
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <header className="mobile-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <button onClick={() => setIsSidebarOpen(true)} className="hamburger"><Menu size={24}/></button>
               <h2 className="aura-title" style={{ margin: 0 }}>Aura Studio</h2>
             </div>
             
             <button 
               onClick={fetchData} 
               disabled={isLoading}
               className="action-btn" 
               style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: 'var(--aura-tan)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
             >
               <RefreshCcw size={16} className={isLoading ? "spin" : ""} />
               <span style={{ fontSize: '13px', fontWeight: 500 }}>{isLoading ? 'Syncing...' : 'Reload Data'}</span>
             </button>
          </header>

          {/* --- DYNAMIC SECTION RENDERING --- */}
          <div className="view-section">
            {isLoading ? (
              <SkeletonLoader view={currentView} />
            ) : (
              <div className="animate-fade-in">
                {/* 1. OVERVIEW VIEW */}
                {currentView === 'OVERVIEW' && (
                  <>
                    <h2 className="section-title">Dashboard Overview</h2>
                    <div className="stats-grid">
                      <div className="stat-card"><h3>{products.length}</h3><p>Total Items</p><ShoppingBag size={24} color="var(--aura-tan)"/></div>
                      <div className="stat-card"><h3>{orders.length}</h3><p>New Orders</p><Package size={24} color="var(--aura-tan)"/></div>
                      <div className="stat-card"><h3>{users.length}</h3><p>Members</p><Users size={24} color="var(--aura-tan)"/></div>
                    </div>
                  </>
                )}

                {/* 2. PRODUCTS VIEW */}
                {currentView === 'PRODUCTS' && (
                  <>
                    <div className="header-row">
                      <h2 className="section-title" style={{ margin: 0 }}>Store Inventory</h2>
                      <button className="add-btn" onClick={() => setShowForm(true)}><Plus size={16}/> ADD PIECE</button>
                    </div>
                    <div className="data-table-container shadow-hover">
                      <table>
                        <thead><tr><th>Preview</th><th>Name</th><th>Category</th><th>Price</th><th>Colors</th><th>Sizes</th><th>Actions</th></tr></thead>
                        <tbody>
                          {products.map((p, index) => {
                            const id = p.Id ?? p.id ?? index;
                            const productImage = Array.isArray(p.Images) ? p.Images[0] : p.Img ?? p.img;
                            const colors = p.Colors ?? p.colors ?? '';
                            const sizes = p.Sizes ?? p.sizes ?? '';
                            const isOnSale = p.OnSale ?? p.onSale ?? false;
                            const originalPrice = p.OriginalPrice ?? p.originalPrice ?? p.Price ?? p.price;
                            const salePrice = p.SalePrice ?? p.salePrice ?? p.Price ?? p.price;
                            return (
                              <tr key={id}>
                                <td><img src={productImage} className="table-thumb" alt="" /></td>
                                <td className="bold">{p.Name ?? p.name}</td>
                                <td className="italic uppercase">{p.Category ?? p.category}</td>
                                <td>
                                  {isOnSale ? (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.85em' }}>{originalPrice}$</span>
                                      <span style={{ color: 'var(--aura-red)', fontWeight: 'bold' }}>{salePrice}$</span>
                                    </div>
                                  ) : (
                                    <span>{p.Price ?? p.price}$</span>
                                  )}
                                </td>
                                <td>{colors || '-'}</td>
                                <td>{sizes || '-'}</td>
                                <td>
                                  <button className="action-btn edit-btn" onClick={() => handleEdit(p)}><Edit size={16}/></button>
                                  <button className="action-btn delete-btn" onClick={() => deleteItem(id)}><Trash2 size={16}/></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* 3. ORDERS VIEW */}
                {currentView === 'ORDERS' && (
                  <>
                    <h2 className="section-title">Checkout Requests</h2>
                    <div className="orders-grid">
                      {orders.length > 0 ? orders.map((o, index) => {
                        const id = o.Id ?? o.id ?? index;
                        return (
                          <div key={id} className="order-card shadow-hover">
                            <div className="order-header">
                               <div className="status-indicator"><Clock size={14}/> Pending Delivery</div>
                               <p className="order-date">{o.OrderDate ? new Date(o.OrderDate).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="order-body">
                               <h4>{o.CustomerName ?? o.customerName}</h4>
                               <p className="order-phone">{o.Phone ?? o.phone}</p>
                               <p className="order-address">{o.Address ?? o.address}</p>
                               <div className="order-items-list" style={{ marginTop: '12px', fontSize: '13px' }}>{o.Items ?? o.items}</div>
                            </div>
                            <div className="order-footer">
                               <span className="total-label">Total:</span>
                               <span className="total-price">{o.TotalAmount ?? o.totalAmount}$</span>
                            </div>
                          </div>
                        );
                      }) : <p className="empty-msg italic" style={{ color: 'var(--text-muted)' }}>No one has checked out yet.</p>}
                    </div>
                  </>
                )}

                {/* 4. CUSTOMERS VIEW */}
                {currentView === 'CUSTOMERS' && (
                  <>
                    <h2 className="section-title">Aura Community</h2>
                    <div className="data-table-container shadow-hover">
                      <table>
                        <thead><tr><th>Member Name</th><th>Email Address</th><th>Status</th></tr></thead>
                        <tbody>
                          {users.map((u, index) => {
                            const id = u.Id ?? u.id ?? index;
                            return (
                              <tr key={id}>
                                <td className="bold">{u.FullName ?? u.fullName ?? 'Aura Member'}</td>
                                <td>{u.Email ?? u.email}</td>
                                <td><span className="badge-member">Verified</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* --- MODAL FORM --- */}
          {showForm && (
            <div className="modal-overlay animate-fade-in">
              <div className="modal-card premium-form-card">
                
                {/* Sticky Header */}
                <div className="modal-header sticky-header">
                  <div>
                    <h3>{editingId ? 'Edit Masterpiece' : 'New Collection Piece'}</h3>
                    <p className="subtitle">Fill in the details below to update your inventory.</p>
                  </div>
                  <button className="close-x" onClick={resetForm} aria-label="Close form">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="premium-form">
                  <div className="form-grid">
                    
                    {/* LEFT COLUMN: Media Management */}
                    <div className="form-section media-section">
                      <h4 className="section-heading">Media</h4>
                      <div className="media-grid">
                        {imagePreviews.map((src, index) => (
                          <div key={index} className="image-preview-box">
                            <img src={src} alt={`preview-${index}`} />
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImagePreview(index);
                              }}
                            >
                              <X size={14} />
                            </button>
                            {index === 0 && <span className="cover-badge">COVER</span>}
                          </div>
                        ))}

                        <button type="button" className="add-photo-box" onClick={() => fileInputRef.current?.click()}>
                          <Plus size={20} className="add-icon" />
                          Add Photo
                        </button>
                      </div>

                      <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => {
                          handleImageFiles(e.target.files);
                          if (e.target) e.target.value = '';
                        }}
                      />
                    </div>

                    {/* RIGHT COLUMN: Details & Attributes */}
                    <div className="form-section details-section">
                      
                      <fieldset className="input-group">
                        <h4 className="section-heading">General Details</h4>
                        <div className="input-wrapper">
                          <label>Product Name</label>
                          <input placeholder="e.g. Linen Summer Dress" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} required className="premium-input" />
                        </div>
                        
                        <div className="input-row">
                          <div className="input-wrapper w-50">
                            <label>Category</label>
                            <select value={formData.Category} onChange={e => setFormData({...formData, Category: e.target.value})} className="premium-input">
                              <option value="tops">Tops</option>
                              <option value="bottoms">Bottoms</option>
                              <option value="sets">Sets</option>
                              <option value="dresses">Dresses</option>
                            </select>
                          </div>
                          <div className="input-wrapper w-50">
                            <label>Status</label>
                            <select value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value})} className="premium-input">
                              <option value="new-in">New In</option>
                              <option value="restocked">Restocked</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                        </div>
                      </fieldset>

                      <fieldset className="input-group">
                        <h4 className="section-heading">Pricing</h4>
                        
                        <div className="sale-toggle-wrapper">
                          <label className="toggle-label" htmlFor="onSaleToggle">
                            <span className="bold" style={{ fontSize: '13px' }}>Enable Sale Pricing</span>
                            <span className="subtext">Apply a discount to this item</span>
                          </label>
                          <div className="toggle-switch">
                            <input type="checkbox" id="onSaleToggle" checked={formData.OnSale} onChange={e => setFormData({...formData, OnSale: e.target.checked})} hidden />
                            <div className={`slider ${formData.OnSale ? 'active' : ''}`} onClick={() => setFormData({...formData, OnSale: !formData.OnSale})}>
                              <div className="knob"></div>
                            </div>
                          </div>
                        </div>

                        {!formData.OnSale ? (
                          <div className="input-wrapper">
                            <label>Standard Price (USD)</label>
                            <input placeholder="0.00" type="number" value={formData.Price} onChange={e => setFormData({...formData, Price: e.target.value})} required className="premium-input" />
                          </div>
                        ) : (
                          <div className="input-row animate-fade-in">
                            <div className="input-wrapper w-50">
                              <label>Original Price</label>
                              <input placeholder="0.00" type="number" value={formData.OriginalPrice} onChange={e => setFormData({...formData, OriginalPrice: e.target.value})} required={formData.OnSale} className="premium-input strikethrough-active" />
                            </div>
                            <div className="input-wrapper w-50">
                              <label className="text-red">Sale Price</label>
                              <input placeholder="0.00" type="number" value={formData.SalePrice} onChange={e => setFormData({...formData, SalePrice: e.target.value})} required={formData.OnSale} className="premium-input highlight-active" />
                            </div>
                          </div>
                        )}
                      </fieldset>

                      <fieldset className="input-group">
                        <h4 className="section-heading">Variants & Description</h4>
                        <div className="input-wrapper">
                          <label>Available Colors</label>
                          <input placeholder="e.g. Beige, Olive, Black" value={formData.Colors} onChange={e => setFormData({...formData, Colors: e.target.value})} className="premium-input" />
                        </div>
                        <div className="input-wrapper">
                          <label>Available Sizes</label>
                          <input placeholder="e.g. XS, S, M, L, XL" value={formData.Sizes} onChange={e => setFormData({...formData, Sizes: e.target.value})} className="premium-input" />
                        </div>
                        <div className="input-wrapper">
                          <label>Product Description</label>
                          <textarea placeholder="Describe the fit, fabric, and feel..." value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} rows={4} className="premium-input resize-y" />
                        </div>
                      </fieldset>
                    </div>
                  </div>

                  {/* Sticky Footer */}
                  <div className="modal-footer sticky-footer">
                    <button type="button" className="btn-secondary" onClick={resetForm} disabled={isSubmitting}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="spin" size={18} /> : (editingId ? 'SAVE CHANGES' : 'PUBLISH PIECE')}
                    </button>
                  </div>
                </form>
                
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;