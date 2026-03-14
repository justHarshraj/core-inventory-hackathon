import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Search, LayoutList, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Operations({ type }) {
  const [pickings, setPickings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [newPicking, setNewPicking] = useState({ 
    location_id: "", 
    location_dest_id: "", 
    moves: [{ product_id: "", quantity: 1 }] 
  });
  
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [pickRes, locRes, prodRes] = await Promise.all([
        API.get("/inventory/picking"),
        API.get("/inventory/locations"),
        API.get("/products")
      ]);
      setPickings(pickRes.data.filter(p => p.type === type).sort((a,b) => b.id - a.id));
      setLocations(locRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("Operations fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post("/inventory/picking", {
        ...newPicking,
        type: type,
        location_id: parseInt(newPicking.location_id),
        location_dest_id: parseInt(newPicking.location_dest_id),
        moves: newPicking.moves.map(m => ({ 
          product_id: parseInt(m.product_id), 
          quantity: parseFloat(m.quantity) 
        }))
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Create picking error:", err);
      alert("Failed to create operation.");
    }
  };

  const getContact = (p) => {
    if (type === "Receipt") return locations.find(l => l.id === p.location_id)?.name || "Vendor";
    if (type === "Delivery") return locations.find(l => l.id === p.location_dest_id)?.name || "Customer";
    return "Internal";
  };

  const filteredPickings = pickings.filter(p => {
    const term = searchQuery.toLowerCase();
    const contact = getContact(p).toLowerCase();
    return p.name.toLowerCase().includes(term) || contact.includes(term);
  });

  const statusColor = (status) => {
    if (status === "Done") return "bg-green-100 text-green-700 border-green-300";
    if (status === "Ready") return "bg-blue-100 text-blue-700 border-blue-300";
    if (status === "Waiting") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (status === "Draft") return "bg-gray-100 text-gray-600 border-gray-300";
    return "bg-gray-100 text-gray-500 border-gray-300";
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
        <button 
          onClick={() => setShowModal(true)}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--odoo-purple)' }}
        >
          New
        </button>
        <h1 className="text-2xl font-bold capitalize" style={{ color: 'var(--odoo-purple)' }}>{type === 'Delivery' ? 'Deliveries' : type === 'Internal' ? 'Internal Transfers' : `${type}s`}</h1>
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
            <div className="p-2.5 cursor-pointer transition-colors text-white" style={{ backgroundColor: 'var(--odoo-purple)' }}>
              <Search className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: 'var(--odoo-border)' }}>
            <button 
              className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'text-white' : 'hover:bg-gray-100'}`}
              style={viewMode === 'list' ? { backgroundColor: 'var(--odoo-purple)', color: 'white' } : { color: 'var(--odoo-purple)' }}
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <div className="w-[1px]" style={{ backgroundColor: 'var(--odoo-border)' }}></div>
            <button 
              className={`px-3 py-2 transition-colors ${viewMode === 'kanban' ? 'text-white' : 'hover:bg-gray-100'}`}
              style={viewMode === 'kanban' ? { backgroundColor: 'var(--odoo-purple)', color: 'white' } : { color: 'var(--odoo-purple)' }}
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
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Schedule date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredPickings.map((p, i) => (
                <tr 
                  key={p.id} 
                  onClick={() => navigate(`/operations/${type === 'Delivery' ? 'deliveries' : type === 'Internal' ? 'transfers' : type.toLowerCase() + 's'}/${p.id}`)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors border-b"
                  style={{ borderColor: 'var(--odoo-border)' }}
                >
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--odoo-purple)' }}>{p.name}</td>
                  <td className="px-4 py-3">{locations.find(l => l.id === p.location_id)?.name || "Vendor"}</td>
                  <td className="px-4 py-3">{locations.find(l => l.id === p.location_dest_id)?.name || "Customer"}</td>
                  <td className="px-4 py-3">{getContact(p)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--odoo-text-muted)' }}>{new Date(p.scheduled_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(p.status)}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
              {filteredPickings.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8" style={{ color: 'var(--odoo-text-muted)' }}>No operations found.</td>
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
                    <div 
                      key={p.id} 
                      onClick={() => navigate(`/operations/${type === 'Delivery' ? 'deliveries' : type === 'Internal' ? 'transfers' : type.toLowerCase() + 's'}/${p.id}`)}
                      className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ borderColor: 'var(--odoo-border)' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm" style={{ color: 'var(--odoo-purple)' }}>{p.name}</span>
                        <span className="text-xs" style={{ color: 'var(--odoo-text-muted)' }}>{new Date(p.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--odoo-text-muted)' }}>{getContact(p)}</div>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-8 shadow-xl border" style={{ borderColor: 'var(--odoo-border)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--odoo-purple)' }}>Create {type}</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>Source Location</label>
                  <select required className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newPicking.location_id} onChange={e => setNewPicking({...newPicking, location_id: e.target.value})}>
                    <option value="">Select Location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>Destination Location</label>
                  <select required className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newPicking.location_dest_id} onChange={e => setNewPicking({...newPicking, location_dest_id: e.target.value})}>
                    <option value="">Select Location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="border p-6 rounded-xl" style={{ borderColor: 'var(--odoo-border)', backgroundColor: 'var(--odoo-bg)' }}>
                <h3 className="font-medium text-sm mb-4" style={{ color: 'var(--odoo-purple)' }}>Item to Move</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <select required className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newPicking.moves[0].product_id} onChange={e => {
                        const newMoves = [...newPicking.moves];
                        newMoves[0].product_id = e.target.value;
                        setNewPicking({...newPicking, moves: newMoves});
                      }}>
                      <option value="">Select Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <input type="number" step="0.01" min="0.01" required placeholder="Qty" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newPicking.moves[0].quantity} onChange={e => {
                        const newMoves = [...newPicking.moves];
                        newMoves[0].quantity = parseFloat(e.target.value);
                        setNewPicking({...newPicking, moves: newMoves});
                      }} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium" style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ backgroundColor: 'var(--odoo-purple)' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
