// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuraProvider } from './context/AuraContext'; // 1. Import the Provider
import Navbar from './component/navbar'; 
import Home from './pages/HomePage';
import Footer from './component/footer';
import ProductsPage from './pages/ProductsPage'; 
import ProfilePage from './pages/Profile';
import AuthPage from './pages/AuthPage';
import ProductDetails from './pages/ProductDetails';

const AppContent = () => {
  const location = useLocation();
  const hideLayout = location.pathname === '/auth';

  return (
        <AuraProvider> {/* Add this wrapper to the Dashboard too! */}

    <div className="min-h-screen bg-aura-beige flex flex-col">
      {!hideLayout && <Navbar />} 
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/products/:slug" element={<ProductsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/product-details/:id" element={<ProductDetails />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
    </div>
        </AuraProvider> 
  );
};

function App() {
  return (
    /* 2. THE PROVIDER MUST WRAP EVERYTHING HERE */
    <AuraProvider> 
      <Router>
        <AppContent />
      </Router>
    </AuraProvider>
  );
}

export default App;