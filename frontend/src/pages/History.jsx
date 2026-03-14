/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Search, LayoutList, LayoutGrid, Trash2 } from "lucide-react";

export default function History() {
  const [pickings, setPickings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [pickRes, locRes] = await Promise.all([
        API.get("/inventory/picking"),
        API.get("/inventory/locations")
      ]);
      setPickings(pickRes.data.sort((a,b) => b.id - a.id));
      setLocations(locRes.data);
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };
  
  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all completed and cancelled operations? This action cannot be undone.")) return;
    try {
      await API.delete("/inventory/picking/history");
      fetchData();
    } catch (err) {
      alert("Failed to clear history.");
    }
  };

  const handleDeleteIndividual = async (id) => {
    if (!window.confirm("Are you sure you want to delete this specific record?")) return;
    try {
      await API.delete(`/inventory/picking/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete record.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getContact = (p) => {
    if (p.type === "Receipt") return locations.find(l => l.id === p.location_id)?.name || "Vendor";
    if (p.type === "Delivery") return locations.find(l => l.id === p.location_dest_id)?.name || "Customer";
    return "Internal";
  };

  const getQuantity = (p) => {
    if (!p.moves) return 0;
    return p.moves.reduce((sum, move) => sum + move.quantity, 0);
  };

  const filteredPickings = pickings.filter(p => {
    const term = searchQuery.toLowerCase();
    const contact = getContact(p).toLowerCase();
    return p.name.toLowerCase().includes(term) || contact.includes(term);
  });

  const getRowColor = (type) => {
    if (type === "Receipt") return "#28A745";
    if (type === "Delivery") return "#DC3545";
    return "var(--odoo-text)";
  };

  const statusColor = (status) => {
    if (status === "Done") return "bg-green-100 text-green-700 border-green-300";
    if (status === "Ready") return "bg-blue-100 text-blue-700 border-blue-300";
    if (status === "Waiting") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-gray-100 text-gray-600 border-gray-300";
  };

  const kanbanGroups = {
    "Draft": filteredPickings.filter(p => p.status === "Draft"),
    "Waiting": filteredPickings.filter(p => p.status === "Waiting"),
    "Ready": filteredPickings.filter(p => p.status === "Ready"),
    "Done": filteredPickings.filter(p => p.status === "Done")
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4 w-fit mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--odoo-purple)' }}>Move History</h1>
        <button 
          onClick={handleClearHistory}
          className="ml-auto px-4 py-2 border rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-300" 
          style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}
        >
          <Trash2 className="w-4 h-4" /> Clear History
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--odoo-border)' }}>
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--odoo-border)' }}>
          <div className="relative border rounded-lg overflow-hidden flex items-center" style={{ borderColor: 'var(--odoo-border)' }}>
            <input 
              type="text" 
              placeholder="Search reference or contact..." 
              className="px-4 py-2 w-64 focus:outline-none text-sm"
              style={{ color: 'var(--odoo-text)' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="p-2.5 cursor-pointer text-white" style={{ backgroundColor: 'var(--odoo-purple)' }}>
              <Search className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: 'var(--odoo-border)' }}>
            <button 
              className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'text-white' : 'hover:bg-gray-100'}`}
              style={viewMode === 'list' ? { backgroundColor: 'var(--odoo-purple)' } : { color: 'var(--odoo-purple)' }}
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <div className="w-[1px]" style={{ backgroundColor: 'var(--odoo-border)' }}></div>
            <button 
              className={`px-3 py-2 transition-colors ${viewMode === 'kanban' ? 'text-white' : 'hover:bg-gray-100'}`}
              style={viewMode === 'kanban' ? { backgroundColor: 'var(--odoo-purple)' } : { color: 'var(--odoo-purple)' }}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {viewMode === "list" && (
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm font-semibold border-b" style={{ color: 'var(--odoo-text)', borderColor: 'var(--odoo-border)' }}>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">From</th>
                 <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredPickings.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50 border-b" style={{ color: getRowColor(p.type), borderColor: 'var(--odoo-border)' }}>
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3">{new Date(p.scheduled_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{getContact(p)}</td>
                  <td className="px-4 py-3">{locations.find(l => l.id === p.location_id)?.name || "Vendor"}</td>
                  <td className="px-4 py-3">{locations.find(l => l.id === p.location_dest_id)?.name || "Customer"}</td>
                  <td className="px-4 py-3">{getQuantity(p)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDeleteIndividual(p.id)}
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                      style={{ color: '#DC3545' }}
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
               {filteredPickings.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8" style={{ color: 'var(--odoo-text-muted)' }}>No history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto p-4">
            {Object.entries(kanbanGroups).map(([status, items]) => (
              <div key={status} className="flex-1 min-w-[260px]">
                <div className="rounded-t-lg px-4 py-3 font-semibold text-sm flex justify-between items-center border border-b-0" style={{ backgroundColor: 'var(--odoo-bg)', borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}>
                  {status} 
                  <span className="text-xs font-bold rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: 'var(--odoo-purple)' }}>{items.length}</span>
                </div>
                <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--odoo-border)' }}>
                  {items.map(p => (
                    <div key={p.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: 'var(--odoo-border)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm" style={{ color: getRowColor(p.type) }}>{p.name}</span>
                        <span className="text-xs" style={{ color: 'var(--odoo-text-muted)' }}>{new Date(p.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm mb-2" style={{ color: 'var(--odoo-text-muted)' }}>{getContact(p)}</div>
                      <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t" style={{ borderColor: 'var(--odoo-border)' }}>
                        <span>Qty: <strong>{getQuantity(p)}</strong></span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full font-semibold text-white text-xs" style={{ backgroundColor: p.type === 'Receipt' ? '#28A745' : '#DC3545' }}>{p.type}</span>
                          <button 
                            onClick={() => handleDeleteIndividual(p.id)}
                            className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-sm py-8 border border-dashed rounded-lg font-medium" style={{ color: 'var(--odoo-text-muted)', borderColor: 'var(--odoo-border)' }}>Empty</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
