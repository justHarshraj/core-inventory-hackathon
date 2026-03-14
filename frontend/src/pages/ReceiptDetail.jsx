/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import API from "../services/api";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(null);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMove, setShowAddMove] = useState(false);
  const [newMove, setNewMove] = useState({ product_id: "", quantity: 1 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pickRes, locRes, prodRes] = await Promise.all([
        API.get("/inventory/picking"),
        API.get("/inventory/locations"),
        API.get("/products")
      ]);
      const current = pickRes.data.find(p => p.id.toString() === id);
      setPicking(current);
      setLocations(locRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("ReceiptDetail fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await API.put(`/inventory/picking/${picking.id}/status`, null, { params: { status: newStatus }});
      fetchData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleValidate = async () => {
    try {
      await API.post(`/inventory/picking/${picking.id}/validate`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to validate.");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this receipt?")) return;
    try {
      await API.put(`/inventory/picking/${picking.id}/status`, null, { params: { status: "Cancelled" }});
      fetchData();
    } catch (err) {
      alert("Failed to cancel.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddMove = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/inventory/picking/${picking.id}/add-move`, {
        product_id: parseInt(newMove.product_id),
        quantity: parseFloat(newMove.quantity)
      });
      setShowAddMove(false);
      setNewMove({ product_id: "", quantity: 1 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add product.");
    }
  };

  if (loading) return null;
  if (!picking) return <div className="p-8" style={{ color: 'var(--odoo-purple)' }}>Receipt not found.</div>;

  const getLocationName = (locId) => locations.find(l => l.id === locId)?.name || "Unknown";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fromContact = getLocationName(picking.location_id);
  const isCancelled = picking.status === "Cancelled";
  const isDone = picking.status === "Done";
  
  const pipeline = ["Draft", "Ready", "Done"];
  const currentIndex = pipeline.indexOf(picking.status);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4 w-fit mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 border rounded-lg hover:bg-gray-100 transition-colors print:hidden"
          style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-purple)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--odoo-purple)' }}>
          New
        </span>
        <span className="text-2xl font-bold capitalize" style={{ color: 'var(--odoo-purple)' }}>
          {picking.type}
        </span>
        {isCancelled && <span className="text-sm font-bold px-3 py-1 rounded-full bg-red-100 text-red-600 border border-red-300">Cancelled</span>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--odoo-border)' }}>
        {/* Action Bar */}
        <div className="border-b p-5 flex justify-between items-center print:hidden" style={{ borderColor: 'var(--odoo-border)', backgroundColor: 'var(--odoo-bg)' }}>
          <div className="flex items-center gap-3">
            {picking.status === "Draft" && (
              <button 
                onClick={() => handleStatusChange("Ready")}
                className="px-5 py-2 border rounded-lg font-medium text-sm transition-colors hover:bg-gray-100"
                style={{ borderColor: 'var(--odoo-purple)', color: 'var(--odoo-purple)' }}
              >
                To DO
              </button>
            )}
            
            {picking.status === "Ready" && (
              <button 
                onClick={handleValidate}
                className="px-5 py-2 rounded-lg font-medium text-sm text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: 'var(--odoo-teal)' }}
              >
                Validate
              </button>
            )}

            <button 
              onClick={handlePrint}
              className="px-4 py-2 border rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors" 
              style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}
            >
              Print
            </button>
            {!isCancelled && !isDone && (
              <button 
                onClick={handleCancel}
                className="px-4 py-2 border rounded-lg font-medium text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors" 
                style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 border rounded-full px-5 py-2 bg-white" style={{ borderColor: 'var(--odoo-border)' }}>
            {pipeline.map((step, i) => (
              <React.Fragment key={step}>
                <span className={`text-xs font-bold tracking-wide uppercase ${currentIndex >= i ? '' : 'opacity-30'}`} style={{ color: currentIndex === i ? 'var(--odoo-teal)' : 'var(--odoo-purple)' }}>
                  {step}
                </span>
                {i < pipeline.length - 1 && <ChevronRight className="w-4 h-4" style={{ color: currentIndex > i ? 'var(--odoo-purple)' : 'var(--odoo-border)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-8" style={{ color: 'var(--odoo-purple)' }}>{picking.name}</h2>
          
          <div className="grid grid-cols-2 gap-16 mb-12">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--odoo-text-muted)' }}>Receive From</label>
                <div className="mt-1 border-b py-2 font-semibold text-lg" style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}>{fromContact}</div>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--odoo-text-muted)' }}>Responsible</label>
                <div className="mt-1 border-b py-2 font-semibold text-lg" style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}>{user.login_id || 'Admin'}</div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--odoo-text-muted)' }}>Schedule date</label>
                <div className="mt-1 border-b py-2 font-semibold text-lg" style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}>{new Date(picking.scheduled_date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="mt-8">
            <h3 className="text-base font-bold mb-4 uppercase tracking-wide" style={{ color: 'var(--odoo-purple)' }}>Products</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-y font-semibold text-sm" style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-purple)' }}>
                  <th className="px-4 py-3 w-2/3">Product</th>
                  <th className="px-4 py-3">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {picking.moves && picking.moves.map((move) => (
                  <tr key={move.id} className="border-b hover:bg-gray-50 transition-colors text-sm" style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}>
                    <td className="px-4 py-3 font-medium">{move.product ? `[${move.product.sku}] ${move.product.name}` : `Product #${move.product_id}`}</td>
                    <td className="px-4 py-3">{move.quantity}</td>
                  </tr>
                ))}
                {showAddMove && (
                  <tr className="border-b" style={{ borderColor: 'var(--odoo-border)' }}>
                    <td className="px-4 py-3">
                      <select 
                        required 
                        className="w-full border p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                        style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }}
                        value={newMove.product_id} 
                        onChange={e => setNewMove({...newMove, product_id: e.target.value})}
                      >
                        <option value="">Select Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" step="0.01" min="0.01" required 
                          className="w-24 border p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                          style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }}
                          value={newMove.quantity} 
                          onChange={e => setNewMove({...newMove, quantity: e.target.value})} 
                        />
                        <button 
                          onClick={handleAddMove} 
                          disabled={!newMove.product_id}
                          className="px-3 py-2 rounded-lg text-white text-xs font-medium hover:opacity-90 disabled:opacity-40" 
                          style={{ backgroundColor: 'var(--odoo-teal)' }}
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => { setShowAddMove(false); setNewMove({ product_id: "", quantity: 1 }); }}
                          className="px-3 py-2 rounded-lg text-xs font-medium border hover:bg-gray-100" 
                          style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text-muted)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {!isDone && !isCancelled && !showAddMove && (
              <button 
                onClick={() => setShowAddMove(true)}
                className="mt-4 px-4 py-2 font-semibold text-sm hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1" 
                style={{ color: 'var(--odoo-teal)' }}
              >
                <Plus className="w-4 h-4" /> New Product
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
