import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Edit2, Trash2, X } from "lucide-react";

export default function Settings() {
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [newWarehouse, setNewWarehouse] = useState({ name: "", short_code: "", address: "" });
  const [newLocation, setNewLocation] = useState({ name: "", short_code: "", warehouse_id: "" });
  const [editingWhId, setEditingWhId] = useState(null);
  const [editingLocId, setEditingLocId] = useState(null);

  const fetchData = async () => {
    try {
      const [locRes, whRes] = await Promise.all([
        API.get("/inventory/locations"),
        API.get("/inventory/warehouses")
      ]);
      setLocations(locRes.data);
      setWarehouses(whRes.data);
    } catch (err) {
      console.error("Settings fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!newWarehouse.name) return;
    try {
      if (editingWhId) {
        await API.put(`/inventory/warehouses/${editingWhId}`, newWarehouse);
      } else {
        await API.post("/inventory/warehouses", newWarehouse);
      }
      setNewWarehouse({ name: "", short_code: "", address: "" });
      setEditingWhId(null);
      fetchData();
    } catch (err) {
      console.error("Warehouse action error:", err);
      alert(editingWhId ? "Failed to update warehouse" : "Failed to create warehouse");
    }
  };

  const handleEditWarehouse = (wh) => {
    setEditingWhId(wh.id);
    setNewWarehouse({ name: wh.name, short_code: wh.short_code || "", address: wh.address || "" });
  };

  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this warehouse? All its locations must be removed first.")) return;
    try {
      await API.delete(`/inventory/warehouses/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete warehouse.");
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.name) return;
    try {
      if (editingLocId) {
        await API.put(`/inventory/locations/${editingLocId}`, newLocation);
      } else {
        await API.post("/inventory/locations", newLocation);
      }
      setNewLocation({ name: "", short_code: "", warehouse_id: "" });
      setEditingLocId(null);
      fetchData();
    } catch (err) {
      console.error("Location action error:", err);
      alert(editingLocId ? "Failed to update location" : "Failed to create location");
    }
  };

  const handleEditLocation = (loc) => {
    setEditingLocId(loc.id);
    setNewLocation({ name: loc.name, short_code: loc.short_code || "", warehouse_id: loc.warehouse_id || "" });
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this location? It must have no current stock or movement history.")) return;
    try {
      await API.delete(`/inventory/locations/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete location.");
    }
  };

  return (
    <div className="space-y-10 max-w-4xl pb-16">
      <div className="flex items-center gap-4 w-fit mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--odoo-purple)' }}>Settings</h1>
      </div>

      {/* Warehouse Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--odoo-border)' }}>
        <div className="border-b p-5 flex items-center justify-between" style={{ borderColor: 'var(--odoo-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--odoo-purple)' }}>{editingWhId ? 'Edit Warehouse' : 'Warehouse'}</h2>
          {editingWhId && (
            <button 
              onClick={() => { setEditingWhId(null); setNewWarehouse({ name: "", short_code: "", address: "" }); }}
              className="text-sm font-medium hover:underline flex items-center gap-1"
              style={{ color: 'var(--odoo-text-muted)' }}
            >
              <X className="w-4 h-4" /> Cancel Edit
            </button>
          )}
        </div>
        
        <form onSubmit={handleCreateWarehouse} className="p-6 space-y-5 max-w-lg" id="warehouse-form">
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium" style={{ color: 'var(--odoo-text-muted)' }}>Name:</label>
            <input 
              required
              type="text"
              className="flex-1 border-b px-2 py-1 focus:outline-none text-sm font-medium"
              style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}
              value={newWarehouse.name}
              onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})}
            />
          </div>
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium" style={{ color: 'var(--odoo-text-muted)' }}>Short Code:</label>
            <input 
              type="text"
              className="flex-1 border-b px-2 py-1 focus:outline-none text-sm font-medium"
              style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}
              value={newWarehouse.short_code}
              onChange={e => setNewWarehouse({...newWarehouse, short_code: e.target.value})}
            />
          </div>
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium" style={{ color: 'var(--odoo-text-muted)' }}>Address:</label>
            <input 
              type="text"
              className="flex-1 border-b px-2 py-1 focus:outline-none text-sm font-medium"
              style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}
              value={newWarehouse.address}
              onChange={e => setNewWarehouse({...newWarehouse, address: e.target.value})}
            />
          </div>
          <button type="submit" className="hidden">Submit</button>
        </form>

        <div className="px-6 pb-6 border-t pt-4" style={{ borderColor: 'var(--odoo-border)' }}>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--odoo-text-muted)' }}>
            {warehouses.map(wh => (
              <li key={wh.id} className="flex items-center justify-between py-1 group border-b border-transparent hover:border-[#eee] transition-colors">
                <span>• {wh.name} {wh.short_code ? `(${wh.short_code})` : ''} - {wh.address || 'No address'}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                  <button onClick={() => handleEditWarehouse(wh)} className="p-1 hover:bg-gray-100 rounded" style={{ color: 'var(--odoo-purple)' }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteWarehouse(wh.id)} className="p-1 hover:bg-red-50 rounded" style={{ color: '#DC3545' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
            <li>
              <button form="warehouse-form" type="submit" className="font-medium text-sm mt-2 hover:underline" style={{ color: 'var(--odoo-teal)' }}>
                {editingWhId ? 'Save Changes' : warehouses.length > 0 ? '+ Create Another Warehouse' : '+ Save Warehouse'}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Location Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--odoo-border)' }}>
        <div className="border-b p-5 flex items-center justify-between" style={{ borderColor: 'var(--odoo-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--odoo-purple)' }}>{editingLocId ? 'Edit Location' : 'Location'}</h2>
          {editingLocId && (
            <button 
              onClick={() => { setEditingLocId(null); setNewLocation({ name: "", short_code: "", warehouse_id: "" }); }}
              className="text-sm font-medium hover:underline flex items-center gap-1"
              style={{ color: 'var(--odoo-text-muted)' }}
            >
              <X className="w-4 h-4" /> Cancel Edit
            </button>
          )}
        </div>
        
        <form onSubmit={handleCreateLocation} className="p-6 space-y-5 max-w-lg" id="location-form">
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium" style={{ color: 'var(--odoo-text-muted)' }}>Name:</label>
            <input 
              required
              type="text"
              className="flex-1 border-b px-2 py-1 focus:outline-none text-sm font-medium"
              style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}
              value={newLocation.name}
              onChange={e => setNewLocation({...newLocation, name: e.target.value})}
            />
          </div>
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium" style={{ color: 'var(--odoo-text-muted)' }}>Short Code:</label>
            <input 
              type="text"
              className="flex-1 border-b px-2 py-1 focus:outline-none text-sm font-medium"
              style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}
              value={newLocation.short_code}
              onChange={e => setNewLocation({...newLocation, short_code: e.target.value})}
            />
          </div>
          <div className="flex items-center">
            <label className="w-32 text-sm font-medium" style={{ color: 'var(--odoo-text-muted)' }}>Warehouse:</label>
            <select 
              className="flex-1 border-b px-2 py-1 focus:outline-none cursor-pointer text-sm font-medium"
              style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}
              value={newLocation.warehouse_id}
              onChange={e => setNewLocation({...newLocation, warehouse_id: e.target.value})}
            >
              <option value="">Select Warehouse...</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="hidden">Submit</button>
        </form>

        <div className="px-6 pb-6 border-t pt-4" style={{ borderColor: 'var(--odoo-border)' }}>
          <p className="text-center text-xs mb-4" style={{ color: 'var(--odoo-text-muted)' }}>This holds the multiple locations of warehouse, rooms etc.</p>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--odoo-text-muted)' }}>
            {locations.map(loc => (
              <li key={loc.id} className="flex items-center justify-between py-1 group border-b border-transparent hover:border-[#eee] transition-colors">
                <span>• {loc.name} {loc.short_code ? `(${loc.short_code})` : ''}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                  <button onClick={() => handleEditLocation(loc)} className="p-1 hover:bg-gray-100 rounded" style={{ color: 'var(--odoo-purple)' }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteLocation(loc.id)} className="p-1 hover:bg-red-50 rounded" style={{ color: '#DC3545' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
            <li>
              <button form="location-form" type="submit" className="font-medium text-sm mt-2 hover:underline" style={{ color: 'var(--odoo-teal)' }}>
                {editingLocId ? 'Save Changes' : locations.length > 0 ? '+ Create Another Location' : '+ Save Location'}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
