import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Plus, CheckCircle } from "lucide-react";

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lines, setLines] = useState([{ product_id: "", location_id: "", counted_quantity: "" }]);

  const fetchData = async () => {
    try {
      const [adjRes, prodRes, locRes] = await Promise.all([
        API.get("/inventory/adjustments"),
        API.get("/products"),
        API.get("/inventory/locations")
      ]);
      setAdjustments(adjRes.data);
      setProducts(prodRes.data);
      setLocations(locRes.data.filter(l => l.type === "Internal"));
    } catch (err) {
      console.error("Adjustments fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post("/inventory/adjustments", {
        lines: lines.map(l => ({
          product_id: parseInt(l.product_id),
          location_id: parseInt(l.location_id),
          counted_quantity: parseFloat(l.counted_quantity)
        }))
      });
      setShowModal(false);
      setLines([{ product_id: "", location_id: "", counted_quantity: "" }]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create adjustment.");
    }
  };

  const handleValidate = async (adjId) => {
    if (!window.confirm("Apply this adjustment? Stock quantities will be updated.")) return;
    try {
      await API.post(`/inventory/adjustments/${adjId}/validate`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to validate.");
    }
  };

  const addLine = () => {
    setLines([...lines, { product_id: "", location_id: "", counted_quantity: "" }]);
  };

  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4 w-fit mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--odoo-purple)' }}>Stock Adjustments</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg font-medium text-white text-sm transition-colors flex items-center gap-2 hover:opacity-90"
          style={{ backgroundColor: 'var(--odoo-purple)' }}
        >
          <Plus className="w-4 h-4" /> New Adjustment
        </button>
      </div>

      {/* Adjustments List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--odoo-border)' }}>
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm font-semibold border-b" style={{ color: 'var(--odoo-text)', borderColor: 'var(--odoo-border)' }}>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {adjustments.map(adj => (
              <tr key={adj.id} className="border-b hover:bg-gray-50" style={{ borderColor: 'var(--odoo-border)' }}>
                <td className="px-4 py-3 font-semibold" style={{ color: 'var(--odoo-purple)' }}>ADJ/{String(adj.id).padStart(4, '0')}</td>
                <td className="px-4 py-3" style={{ color: 'var(--odoo-text-muted)' }}>{new Date(adj.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {adj.lines.map((line, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium">[{line.product_sku}] {line.product_name}</span>
                        <span className="mx-2" style={{ color: 'var(--odoo-text-muted)' }}>@</span>
                        <span style={{ color: 'var(--odoo-text-muted)' }}>{line.location_name}</span>
                        <span className="mx-2">—</span>
                        <span style={{ color: 'var(--odoo-text-muted)' }}>System: {line.theoretical_quantity}</span>
                        <span className="mx-1">→</span>
                        <span className="font-semibold">Counted: {line.counted_quantity}</span>
                        <span className={`ml-2 font-bold ${line.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({line.difference >= 0 ? '+' : ''}{line.difference})
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${adj.status === 'Done' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                    {adj.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {adj.status === "Draft" && (
                    <button 
                      onClick={() => handleValidate(adj.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90"
                      style={{ backgroundColor: 'var(--odoo-teal)' }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Apply
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {adjustments.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8" style={{ color: 'var(--odoo-text-muted)' }}>No adjustments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-8 shadow-xl border" style={{ borderColor: 'var(--odoo-border)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--odoo-purple)' }}>New Stock Adjustment</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--odoo-text-muted)' }}>Select a product and location, then enter the physical counted quantity. The system will calculate the difference automatically.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end border p-4 rounded-xl" style={{ borderColor: 'var(--odoo-border)', backgroundColor: 'var(--odoo-bg)' }}>
                  <div className="col-span-4">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--odoo-text-muted)' }}>Product</label>
                    <select required className="w-full border p-2 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={line.product_id} onChange={e => updateLine(idx, 'product_id', e.target.value)}>
                      <option value="">Select...</option>
                      {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--odoo-text-muted)' }}>Location</label>
                    <select required className="w-full border p-2 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={line.location_id} onChange={e => updateLine(idx, 'location_id', e.target.value)}>
                      <option value="">Select...</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--odoo-text-muted)' }}>Counted Qty</label>
                    <input type="number" step="0.01" min="0" required className="w-full border p-2 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={line.counted_quantity} onChange={e => updateLine(idx, 'counted_quantity', e.target.value)} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addLine} className="text-sm font-semibold hover:underline" style={{ color: 'var(--odoo-teal)' }}>+ Add another line</button>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium" style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ backgroundColor: 'var(--odoo-purple)' }}>Create Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
