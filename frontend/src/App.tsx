import React, { useState, useEffect } from 'react';
import {
  Car,
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  LogOut,
  User as UserIcon,
  Filter,
  AlertTriangle
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:8080/api';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

interface UserSession {
  token: string;
  username: string;
  role: string;
}

function App() {
  // Session State
  const [session, setSession] = useState<UserSession | null>(null);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', role: 'USER' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Vehicle List & Filter State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  });

  // Vehicle Form State (Add/Edit)
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [activeVehicleId, setActiveVehicleId] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    category: 'Sedan',
    price: '',
    quantity: ''
  });

  // Restock Input State map (vehicleId -> amount)
  const [restockAmounts, setRestockAmounts] = useState<{ [key: number]: string }>({});

  // Global Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load session from localStorage on start
  useEffect(() => {
    const savedSession = localStorage.getItem('dealership_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
      } catch (e) {
        localStorage.removeItem('dealership_session');
      }
    }
  }, []);

  // Fetch vehicles whenever session loads or is refreshed
  useEffect(() => {
    if (session) {
      fetchVehicles();
    }
  }, [session]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': session ? `Bearer ${session.token}` : ''
    };
  };

  // 1. Auth Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
    const payload = authMode === 'register' 
      ? { username: authForm.username, password: authForm.password, role: authForm.role }
      : { username: authForm.username, password: authForm.password };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (authMode === 'register') {
        setAuthSuccess('Registration successful! Please login.');
        setAuthMode('login');
        setAuthForm({ ...authForm, password: '' });
      } else {
        const newSession: UserSession = {
          token: data.token,
          username: data.username,
          role: data.role
        };
        localStorage.setItem('dealership_session', JSON.stringify(newSession));
        setSession(newSession);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Server error occurred');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dealership_session');
    setSession(null);
    setVehicles([]);
  };

  // 2. Vehicle API calls
  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE}/vehicles`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to load vehicles');
      const data = await response.json();
      setVehicles(data);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Build query params
    const params = new URLSearchParams();
    if (filters.make) params.append('make', filters.make);
    if (filters.model) params.append('model', filters.model);
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

    try {
      const response = await fetch(`${API_BASE}/vehicles/search?${params.toString()}`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setVehicles(data);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleClearFilters = () => {
    setFilters({ make: '', model: '', category: '', minPrice: '', maxPrice: '' });
    fetchVehicles();
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/vehicles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          make: vehicleForm.make,
          model: vehicleForm.model,
          category: vehicleForm.category,
          price: parseFloat(vehicleForm.price),
          quantity: parseInt(vehicleForm.quantity, 10)
        })
      });

      if (!response.ok) throw new Error('Failed to add vehicle');
      
      showNotification('success', 'Vehicle added successfully!');
      setShowModal(null);
      fetchVehicles();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeVehicleId === null) return;

    try {
      const response = await fetch(`${API_BASE}/vehicles/${activeVehicleId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          make: vehicleForm.make,
          model: vehicleForm.model,
          category: vehicleForm.category,
          price: parseFloat(vehicleForm.price),
          quantity: parseInt(vehicleForm.quantity, 10)
        })
      });

      if (!response.ok) throw new Error('Failed to update vehicle');
      
      showNotification('success', 'Vehicle updated successfully!');
      setShowModal(null);
      fetchVehicles();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const response = await fetch(`${API_BASE}/vehicles/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to delete vehicle');

      showNotification('success', 'Vehicle deleted successfully!');
      fetchVehicles();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // 3. Purchase & Restock
  const handlePurchase = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/vehicles/${id}/purchase`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to purchase vehicle');
      }

      showNotification('success', 'Purchase completed successfully! Stock updated.');
      fetchVehicles();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleRestock = async (id: number) => {
    const amountStr = restockAmounts[id] || '';
    const amount = parseInt(amountStr, 10);

    if (isNaN(amount) || amount <= 0) {
      showNotification('error', 'Please enter a valid quantity to restock');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/vehicles/${id}/restock?quantity=${amount}`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to restock vehicle');
      }

      showNotification('success', 'Stock restocked successfully!');
      setRestockAmounts({ ...restockAmounts, [id]: '' });
      fetchVehicles();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const openAddModal = () => {
    setVehicleForm({ make: '', model: '', category: 'Sedan', price: '', quantity: '' });
    setShowModal('add');
  };

  const openEditModal = (vehicle: Vehicle) => {
    setActiveVehicleId(vehicle.id);
    setVehicleForm({
      make: vehicle.make,
      model: vehicle.model,
      category: vehicle.category,
      price: vehicle.price.toString(),
      quantity: vehicle.quantity.toString()
    });
    setShowModal('edit');
  };

  // Helper for rendering custom gradient icons for car categories
  const renderCarSvg = (category: string) => {
    const lowerCat = category.toLowerCase();
    
    // Truck / Pickup
    if (lowerCat.includes('truck') || lowerCat.includes('pickup')) {
      return (
        <svg viewBox="0 0 24 24" className="vehicle-img-icon" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l4 4h6a2 2 0 0 1 2 2v2" />
          <path d="M16 10h4l2 3v3h-6v-6Z" />
          <circle cx="7.5" cy="18.5" r="2.5" />
          <circle cx="17.5" cy="18.5" r="2.5" />
        </svg>
      );
    }
    // SUV / Crossover
    if (lowerCat.includes('suv') || lowerCat.includes('crossover')) {
      return (
        <svg viewBox="0 0 24 24" className="vehicle-img-icon" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 13h2l2-4h10l2 4h4v4H2v-4Z" />
          <circle cx="6.5" cy="17.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
          <path d="M14 9l1-3h-6l1 3" />
        </svg>
      );
    }
    // Electric / Sports
    if (lowerCat.includes('electric') || lowerCat.includes('sports') || lowerCat.includes('convertible')) {
      return (
        <svg viewBox="0 0 24 24" className="vehicle-img-icon" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 14.5l3-3h12l3 3h2v3H2v-3Z" />
          <circle cx="6.5" cy="17.5" r="2" />
          <circle cx="17.5" cy="17.5" r="2" />
          <path d="M13 6l-4 4h5l-4 5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    }
    // Default Sedan / Coupe
    return (
      <svg viewBox="0 0 24 24" className="vehicle-img-icon" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    );
  };

  // Auth View Render
  if (!session) {
    return (
      <div className="app-container">
        <div className="app-bg-glow"></div>
        <div className="auth-wrapper">
          <div className="auth-card glass">
            <div className="auth-header">
              <div className="auth-logo">
                <Car size={32} color="#6366f1" />
                <span>Drive<span>Vault</span></span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {authMode === 'login' ? 'Sign in to access dealership inventory' : 'Create an account to browse inventory'}
              </p>
            </div>

            <div className="auth-tabs">
              <button 
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
              >
                Sign In
              </button>
              <button 
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
              >
                Register
              </button>
            </div>

            {authError && <div className="auth-error">{authError}</div>}
            {authSuccess && <div className="auth-success">{authSuccess}</div>}

            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter your username"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter your password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                />
              </div>

              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select 
                    className="form-select"
                    value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                  >
                    <option value="USER">Standard User (Standard Access)</option>
                    <option value="ADMIN">Administrator (Write & Delete Access)</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                {authMode === 'login' ? 'Sign In' : 'Register Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View Render
  return (
    <div className="app-container">
      <div className="app-bg-glow"></div>
      
      {/* Top Header */}
      <header className="dashboard-header">
        <a href="#" className="dashboard-logo">
          <Car size={26} color="#6366f1" />
          <span>Drive<span>Vault</span></span>
        </a>

        <div className="header-actions">
          <div className="user-badge">
            <UserIcon size={14} color="var(--text-secondary)" />
            <span style={{ fontWeight: 600 }}>{session.username}</span>
            <span className={`role-tag ${session.role.toLowerCase()}`}>
              {session.role}
            </span>
          </div>

          <button className="btn-secondary" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Floating Notification */}
        {notification && (
          <div 
            className="glass" 
            style={{
              position: 'fixed',
              top: '80px',
              right: '40px',
              zIndex: 99,
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderLeft: `4px solid ${notification.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: notification.type === 'success' ? 'var(--success)' : 'var(--danger)'
            }}></div>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{notification.message}</span>
          </div>
        )}

        {/* Dynamic Filters */}
        <section className="filter-card glass">
          <div className="filter-title">
            <Filter size={18} color="var(--primary)" />
            Search & Filter Catalog
          </div>

          <form onSubmit={handleSearch}>
            <div className="filter-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px' }}>Make</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Toyota"
                  value={filters.make}
                  onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px' }}>Model</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Camry"
                  value={filters.model}
                  onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px' }}>Category</label>
                <select 
                  className="form-select"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  style={{ padding: '10px 14px' }}
                >
                  <option value="">All Categories</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Electric">Electric</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px' }}>Min Price ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '6px', fontSize: '12px' }}>Max Price ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="no limit"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn-search" style={{ flex: 2 }}>
                  <Search size={16} />
                  Apply
                </button>
                <button type="button" className="btn-secondary" onClick={handleClearFilters} style={{ height: '46px' }}>
                  Reset
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Dashboard Title & Actions */}
        <section style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>Vehicles Catalog</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Showing {vehicles.length} vehicles matching your search
            </p>
          </div>

          {session.role === 'ADMIN' && (
            <button className="btn-primary" onClick={openAddModal} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} />
              Add New Vehicle
            </button>
          )}
        </section>

        {/* Vehicles Grid */}
        <section className="grid-container">
          {vehicles.length === 0 ? (
            <div className="glass" style={{ gridColumn: '1 / -1', padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <AlertTriangle size={48} color="var(--warning)" />
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>No Vehicles Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
                We couldn't find any vehicles matching your filter criteria. Try resetting the filters or add a new vehicle to get started.
              </p>
              <button className="btn-secondary" onClick={handleClearFilters}>
                Clear Search Filters
              </button>
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <div className="vehicle-card glass" key={vehicle.id}>
                {/* Visual Area */}
                <div className="vehicle-img-area">
                  {renderCarSvg(vehicle.category)}
                  <span className="category-badge">{vehicle.category}</span>
                </div>

                {/* Details Area */}
                <div className="vehicle-info">
                  <div className="vehicle-header">
                    <div>
                      <h3 className="vehicle-title">{vehicle.model}</h3>
                      <span className="vehicle-make">{vehicle.make}</span>
                    </div>
                    <span className="vehicle-price">
                      ${vehicle.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span className={`stock-indicator ${vehicle.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      <Package size={14} />
                      {vehicle.quantity > 0 ? `${vehicle.quantity} In Stock` : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Standard Actions */}
                  <div className="vehicle-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => handlePurchase(vehicle.id)}
                      disabled={vehicle.quantity <= 0}
                      style={{ flex: 1 }}
                    >
                      Purchase
                    </button>
                  </div>

                  {/* Administrator Controls */}
                  {session.role === 'ADMIN' && (
                    <div className="admin-card-controls">
                      <div className="restock-row">
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', flex: 1 }}>
                          Restock Quantity:
                        </span>
                        <input 
                          type="number" 
                          className="restock-input" 
                          min="1"
                          placeholder="Qty"
                          value={restockAmounts[vehicle.id] || ''}
                          onChange={(e) => setRestockAmounts({ ...restockAmounts, [vehicle.id]: e.target.value })}
                        />
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleRestock(vehicle.id)}
                        >
                          Restock
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-action-sm edit"
                          onClick={() => openEditModal(vehicle)}
                        >
                          <Edit2 size={12} />
                          Edit Details
                        </button>
                        <button 
                          className="btn-action-sm delete"
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h3 className="modal-title">
                {showModal === 'add' ? 'Add New Vehicle' : 'Edit Vehicle Details'}
              </h3>
              <button className="btn-close" onClick={() => setShowModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={showModal === 'add' ? handleAddVehicle : handleEditVehicle}>
              <div className="form-group">
                <label className="form-label">Make</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Tesla"
                  value={vehicleForm.make}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Model Y"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={vehicleForm.category}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, category: e.target.value })}
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Electric">Electric</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-input" 
                  placeholder="0.00"
                  value={vehicleForm.price}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantity in Stock</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="0"
                  value={vehicleForm.quantity}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                  {showModal === 'add' ? 'Add Vehicle' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
