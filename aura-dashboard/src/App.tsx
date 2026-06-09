import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore: Allow CSS side-effect import without typings
import './App.css';
import { 
  LayoutDashboard, ShoppingBag, Package, Trash2, 
  Edit, Plus, X, Menu, Upload, Users, Loader2, Clock, RefreshCcw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = "https://aura-backend-s64s.onrender.com/api"; 

// --- Client-Side Image Compression Helper for Performance ---
const compressImage = (base64Str: string, maxWidth = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale proportionally if wider than maximum threshold
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
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
          {view === 'PRODUCTS' && <div className="skeleton-button skeleton-pulse"></div>}
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
    const source = Array.isArray(data) ? data : (data && Array.isArray(data.users) ? data.users : []);
    return source.map((u: any, i: number) => ({
      Id: u.Id ?? u.id ?? i,
      FullName: u.FullName ?? u.fullName ?? u.name ?? ((`${u.firstName || ''} ${u.lastName || ''}`.trim()) || 'Aura Member'),
      Email: u.Email ?? u.email ?? 'no-reply@aura.local'
    }));
  };

  useEffect(() => {
    if (isOwnerAuthenticated) {
      fetchData();
    }
  }, [isOwnerAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productResult, orderResult, userResult] = await Promise.allSettled([
        fetch(`${API_URL}/Products`),
        fetch(`${API_URL}/Orders`),
        fetch(`${API_URL}/Users`)
      ]);

      const productsData = productResult.status === 'fulfilled' && productResult.value.ok
        ? await productResult.value.json()
        : [];
      const ordersData = orderResult.status === 'fulfilled' && orderResult.value.ok
        ? await orderResult.value.json()
        : [];
      const usersData = userResult.status === 'fulfilled' && userResult.value.ok
        ? await userResult.value.json()
        : [];

      setProducts(normalizeApiList(productsData));
      setOrders(Array.isArray(ordersData) ? ordersData : normalizeApiList(ordersData));
      setUsers(normalizeUsers(usersData));
    } catch (e) {
      toast.error("Cloud connection failed.");
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
    
    // Merge Original and Sale prices into payload
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6" style={{ fontFamily: 'sans-serif' }}>
        <Toaster position="top-center" />
        <div className="max-w-sm w-full bg-white border border-stone-200 p-8 rounded-[2rem] text-center shadow-lg">
          <h1 className="text-2xl font-serif tracking-[0.2em] text-[#5d4037] uppercase leading-none mb-1">AURA</h1>
          <p className="text-[8px] tracking-[0.3em] uppercase font-bold text-stone-400 mb-8">Management Portal</p>
          
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="Enter Owner Passcode" 
              value={ownerPasscode}
              onChange={(e) => setOwnerPasscode(e.target.value)}
              className="w-full border border-stone-200 p-4 rounded-2xl text-center text-sm outline-none focus:border-[#5d4037]"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '15px', outline: 'none' }}
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
              className="w-full bg-[#5d4037] text-white py-4 rounded-2xl text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black transition-all"
              style={{ width: '100%', padding: '12px', background: '#5d4037', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Enter Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
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
        <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <button onClick={() => setIsSidebarOpen(true)} className="hamburger"><Menu size={24}/></button>
             <h2 className="aura-title" style={{ margin: 0 }}>Aura Studio</h2>
           </div>
           
           <button 
             onClick={fetchData} 
             disabled={isLoading}
             className="action-btn" 
             style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: 'var(--aura-tan, #e0d5c1)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
           >
             <RefreshCcw size={16} className={isLoading ? "spin" : ""} />
             <span>{isLoading ? 'Syncing...' : 'Reload Data'}</span>
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
                    <h2 className="section-title">Store Inventory</h2>
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
                                    <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.85em' }}>{originalPrice} AED</span>
                                    <span style={{ color: 'var(--aura-red, #d9534f)', fontWeight: 'bold' }}>{salePrice} AED</span>
                                  </div>
                                ) : (
                                  <span>{p.Price ?? p.price} AED</span>
                                )}
                              </td>
                              <td>{colors || '-'}</td>
                              <td>{sizes || '-'}</td>
                              <td>
                                <button className="action-btn edit-btn" onClick={() => handleEdit(p)}><Edit size={14}/></button>
                                <button className="action-btn delete-btn" onClick={() => deleteItem(id)}><Trash2 size={14}/></button>
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
                             <div className="status-indicator"><Clock size={12}/> Pending Delivery</div>
                             <p className="order-date">{o.OrderDate ? new Date(o.OrderDate).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                          </div>
                          <div className="order-body">
                             <h4>{o.CustomerName ?? o.customerName}</h4>
                             <p className="order-phone">{o.Phone ?? o.phone}</p>
                             <p className="order-address">{o.Address ?? o.address}</p>
                             <div className="order-items-list">{o.Items ?? o.items}</div>
                          </div>
                          <div className="order-footer">
                             <span className="total-label">Total:</span>
                             <span className="total-price">{o.TotalAmount ?? o.totalAmount} AED</span>
                          </div>
                        </div>
                      );
                    }) : <p className="empty-msg italic">No one has checked out yet.</p>}
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
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3>{editingId ? 'Edit Masterpiece' : 'New Collection'}</h3>
                <X className="close-x" onClick={resetForm} style={{ cursor: 'pointer' }} />
              </div>
              <form onSubmit={handleSubmit} className="admin-form">
                
                {/* File Upload Zone - Emphasizing Multiple Images */}
                <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                  {imagePreviews.length > 0 ? (
                    <div className="multi-image-preview">
                      <img src={imagePreviews[0]} className="form-preview-img" alt="Main Preview" />
                      {imagePreviews.length > 1 && (
                        <div className="preview-thumbs">
                          {imagePreviews.slice(1).map((src, idx) => (
                            <img key={idx} src={src} className="form-thumb-img" alt={`Thumb ${idx}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Upload size={24} style={{ marginBottom: '10px' }}/>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Click to Upload Photos</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#666' }}>(You can select multiple images)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={(e) => {
                      handleImageFiles(e.target.files);
                      if (e.target) e.target.value = '';
                    }}
                  />
                </div>
                
                {/* Manage Selected Images */}
                {imagePreviews.length > 0 && (
                  <div className="preview-list">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="preview-item">
                        <img src={src} alt={`preview-${index}`} />
                        <button type="button" className="remove-image-btn" onClick={(e) => { e.stopPropagation(); removeImagePreview(index); }}>
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Product Info */}
                <input placeholder="Product Name" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} required />
                
                {/* Standard Price vs Sale Logic */}
                {!formData.OnSale && (
                  <input placeholder="Price (AED)" type="number" value={formData.Price} onChange={e => setFormData({...formData, Price: e.target.value})} required />
                )}

                <div className="form-row">
                  <select value={formData.Category} onChange={e => setFormData({...formData, Category: e.target.value})}>
                    <option value="tops">Tops</option>
                    <option value="bottoms">Bottoms</option>
                    <option value="sets">Sets</option>
                    <option value="dresses">Dresses</option>
                  </select>
                  <select value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value})}>
                    <option value="new-in">New In</option>
                    <option value="restocked">Restocked</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Sale Toggle & Pricing Fields */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                  <input 
                    type="checkbox" 
                    id="onSaleToggle" 
                    checked={formData.OnSale}
                    onChange={e => setFormData({...formData, OnSale: e.target.checked})}
                    style={{ cursor: 'pointer', width: 'auto', margin: 0 }}
                  />
                  <label htmlFor="onSaleToggle" style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.95em' }}>Item is on sale</label>
                </div>

                {formData.OnSale && (
                  <div className="form-row animate-fade-in" style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8em', color: '#666', marginBottom: '4px', display: 'block' }}>Original Price</label>
                      <input 
                        placeholder="e.g. 250" 
                        type="number" 
                        value={formData.OriginalPrice} 
                        onChange={e => setFormData({...formData, OriginalPrice: e.target.value})} 
                        required={formData.OnSale}
                        style={{ margin: 0 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8em', color: '#666', marginBottom: '4px', display: 'block' }}>Sale Price</label>
                      <input 
                        placeholder="e.g. 199" 
                        type="number" 
                        value={formData.SalePrice} 
                        onChange={e => setFormData({...formData, SalePrice: e.target.value})} 
                        required={formData.OnSale}
                        style={{ margin: 0 }}
                      />
                    </div>
                  </div>
                )}

                {/* Attributes */}
                <input placeholder="Colors (comma separated)" value={formData.Colors} onChange={e => setFormData({...formData, Colors: e.target.value})} />
                <input placeholder="Sizes (comma separated)" value={formData.Sizes} onChange={e => setFormData({...formData, Sizes: e.target.value})} />
                <textarea placeholder="Product Description" value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} rows={3} />
                
                <button disabled={isSubmitting} type="submit" className="submit-btn">{isSubmitting ? <Loader2 className="spin"/> : 'PUBLISH PIECE'}</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;