import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore: Allow CSS side-effect import without typings
import './App.css';
import { 
  LayoutDashboard, ShoppingBag, Package, Trash2, 
  Edit, Plus, X, Menu, Upload, Users, Loader2, CheckCircle, Clock
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = "http://localhost:5058/api"; 

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
    Colors: '', Sizes: '', Description: ''
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
    fetchData();
  }, [currentView]);

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
      // Small simulated delay can be added here if operations complete instantly and flicker.
      setIsLoading(false);
    }
  };

  // --- Handlers ---
  const handleEdit = (p: any) => {
    setEditingId(p.Id);
    setFormData({
      Name: p.Name, Price: p.Price.toString(), Category: p.Category,
      Status: p.Status, Colors: p.Colors || '', Sizes: p.Sizes || '', Description: p.Description || ''
    });
    setImagePreviews([p.Img]); 
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { ...formData, Id: editingId || 0, Price: parseFloat(formData.Price), Img: imagePreviews[0] || '' };
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
            return prev.map(p => p.Id === editingId ? productToShow : p);
          }
          const exists = prev.some(p => p.Id === productToShow.Id);
          return exists ? prev.map(p => p.Id === productToShow.Id ? productToShow : p) : [productToShow, ...prev];
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
          setProducts(prev => prev.filter(p => p.Id !== id));
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
    setFormData({ Name: '', Price: '', Category: 'tops', Status: 'new-in', Colors: '', Sizes: '', Description: '' });
    setImagePreviews([]);
  };

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
        <header className="mobile-header">
           <button onClick={() => setIsSidebarOpen(true)} className="hamburger"><Menu size={24}/></button>
           <h2 className="aura-title">Aura Studio</h2>
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
                      <thead><tr><th>Preview</th><th>Name</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.Id}>
                            <td><img src={p.Img} className="table-thumb" alt="" /></td>
                            <td className="bold">{p.Name}</td>
                            <td className="italic uppercase">{p.Category}</td>
                            <td>{p.Price} AED</td>
                            <td>
                              <button className="action-btn edit-btn" onClick={() => handleEdit(p)}><Edit size={14}/></button>
                              <button className="action-btn delete-btn" onClick={() => deleteItem(p.Id)}><Trash2 size={14}/></button>
                            </td>
                          </tr>
                        ))}
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
                    {orders.length > 0 ? orders.map(o => (
                      <div key={o.Id} className="order-card shadow-hover">
                        <div className="order-header">
                           <div className="status-indicator"><Clock size={12}/> Pending Delivery</div>
                           <p className="order-date">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="order-body">
                           <h4>{o.CustomerName}</h4>
                           <p className="order-phone">{o.Phone}</p>
                           <p className="order-address">{o.Address}</p>
                           <div className="order-items-list">{o.Items}</div>
                        </div>
                        <div className="order-footer">
                           <span className="total-label">Total:</span>
                           <span className="total-price">{o.TotalAmount} AED</span>
                        </div>
                      </div>
                    )) : <p className="empty-msg italic">No one has checked out yet.</p>}
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
                        {users.map(u => (
                          <tr key={u.Id}>
                            <td className="bold">{u.FullName || 'Aura Member'}</td>
                            <td>{u.Email}</td>
                            <td><span className="badge-member">Verified</span></td>
                          </tr>
                        ))}
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
                <X className="close-x" onClick={resetForm} />
              </div>
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                   {imagePreviews[0] ? <img src={imagePreviews[0]} className="form-preview-img" alt="" /> : <><Upload size={24}/><p>Upload Photo</p></>}
                   <input type="file" hidden ref={fileInputRef} onChange={(e) => {
                     const reader = new FileReader();
                     reader.onload = () => setImagePreviews([reader.result as string]);
                     if(e.target.files) reader.readAsDataURL(e.target.files[0]);
                   }} />
                </div>
                <input placeholder="Name" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} required />
                <input placeholder="Price" type="number" value={formData.Price} onChange={e => setFormData({...formData, Price: e.target.value})} required />
                <div className="form-row">
                  <select value={formData.Category} onChange={e => setFormData({...formData, Category: e.target.value})}><option value="tops">Tops</option><option value="bottoms">Bottoms</option><option value="sets">Sets</option></select>
                  <select value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value})}><option value="new-in">New In</option><option value="sales">On Sale</option></select>
                </div>
                <button disabled={isSubmitting} type="submit" className="submit-btn">{isSubmitting ? <Loader2 className="spin"/> : 'PUBLISH'}</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;