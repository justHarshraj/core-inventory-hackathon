/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Plus, Search, Send, AlertTriangle, Edit2, Trash2, X, MapPin } from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", category_id: "", unit_of_measure: "Units", reorder_rule: 0, cost: 0 });
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [adjustingId, setAdjustingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get("/products"),
        API.get("/products/categories")
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Products fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      let productToCreate = { ...newProduct };
      if (!productToCreate.category_id && categories.length > 0) {
        productToCreate.category_id = categories[0].id;
      }
      
      if (editingId) {
        await API.put(`/products/${editingId}`, productToCreate);
      } else {
        await API.post("/products", productToCreate);
      }
      
      setShowModal(false);
      setEditingId(null);
      setNewProduct({ name: "", sku: "", category_id: "", unit_of_measure: "Units", reorder_rule: 0, cost: 0 });
      fetchData();
    } catch (err) {
      console.error("Product action error:", err);
      alert(editingId ? "Failed to update product" : "Failed to create product");
    }
  };

  const handleEditClick = (p) => {
    setEditingId(p.id);
    setNewProduct({
      name: p.name,
      sku: p.sku,
      category_id: p.category_id || "",
      unit_of_measure: p.unit_of_measure || "Units",
      reorder_rule: p.reorder_rule || 0,
      cost: p.cost || 0
    });
    setShowModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await API.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete product.");
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await API.put(`/products/categories/${editingCategoryId}`, newCategory);
      } else {
        await API.post("/products/categories", newCategory);
      }
      setEditingCategoryId(null);
      setNewCategory({ name: "", description: "" });
      fetchData();
    } catch (err) {
      console.error("Category action error:", err);
      alert(editingCategoryId ? "Failed to update category" : "Failed to create category");
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setNewCategory({ name: cat.name, description: cat.description || "" });
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await API.delete(`/products/categories/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete category.");
    }
  };

  const submitAdjust = async (productId) => {
    if (adjustQuantity === "") return;
    try {
      const newQty = parseFloat(adjustQuantity);
      if (isNaN(newQty)) return;
      await API.post(`/products/${productId}/adjust`, { quantity: newQty });
      setAdjustingId(null);
      setAdjustQuantity("");
      fetchData();
    } catch (err) {
      console.error("Adjust error:", err);
      alert(err.response?.data?.detail || "Failed to adjust stock. Ensure an internal location exists first.");
    }
  };

  const filteredProducts = products.filter(p => {
    const term = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
  });

  const isLowStock = (p) => p.reorder_rule > 0 && p.on_hand > 0 && p.on_hand <= p.reorder_rule;
  const isOutOfStock = (p) => p.on_hand <= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 w-fit mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--odoo-purple)' }}>Products</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg font-medium text-white text-sm transition-colors flex items-center gap-2 hover:opacity-90"
          style={{ backgroundColor: 'var(--odoo-purple)' }}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
        <button 
          onClick={() => setShowCategoryModal(true)}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 hover:bg-gray-100 border"
          style={{ borderColor: 'var(--odoo-purple)', color: 'var(--odoo-purple)' }}
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--odoo-border)' }}>
        <div className="p-4 flex items-center justify-end border-b" style={{ borderColor: 'var(--odoo-border)' }}>
          <div className="relative border rounded-lg overflow-hidden flex items-center" style={{ borderColor: 'var(--odoo-border)' }}>
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              className="px-4 py-2 w-64 focus:outline-none text-sm"
              style={{ color: 'var(--odoo-text)' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="p-2.5 cursor-pointer text-white" style={{ backgroundColor: 'var(--odoo-purple)' }}>
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm font-semibold border-b" style={{ color: 'var(--odoo-text)', borderColor: 'var(--odoo-border)' }}>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Per Unit Cost</th>
              <th className="px-4 py-3">On Hand</th>
              <th className="px-4 py-3">Free to Use</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredProducts.map((p, i) => {
              const lowStock = isLowStock(p);
              const outStock = isOutOfStock(p);
              return (
                <tr key={p.id} className={`border-b hover:bg-gray-50 transition-colors ${outStock ? 'bg-red-50' : lowStock ? 'bg-yellow-50' : ''}`} style={{ borderColor: 'var(--odoo-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--odoo-text)' }}>{p.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--odoo-text-muted)' }}>{p.sku}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--odoo-text-muted)' }}>{p.category?.name || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--odoo-text-muted)' }}>{p.cost} Rs</td>
                  <td className="px-4 py-3 group relative">
                    {adjustingId === p.id ? (
                       <div className="flex items-center gap-2">
                         <input 
                           autoFocus
                           className="w-20 border-b px-1 outline-none font-medium text-sm"
                           style={{ borderColor: 'var(--odoo-purple)', color: 'var(--odoo-text)' }}
                           type="number" 
                           value={adjustQuantity} 
                           onChange={e => setAdjustQuantity(e.target.value)}
                           onKeyDown={e => {
                             if (e.key === 'Enter') submitAdjust(p.id);
                             if (e.key === 'Escape') setAdjustingId(null);
                           }}
                         />
                         <button onClick={() => submitAdjust(p.id)} style={{ color: 'var(--odoo-teal)' }}>
                           <Send className="w-4 h-4" />
                         </button>
                       </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div 
                          className="cursor-pointer flex items-center gap-2"
                          onClick={() => {
                            setAdjustingId(p.id);
                            setAdjustQuantity(p.on_hand);
                          }}
                        >
                          <span style={{ color: outStock ? '#DC3545' : lowStock ? '#E67E22' : 'var(--odoo-text)' }}>{p.on_hand}</span>
                          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--odoo-teal)' }}>(update)</span>
                        </div>
                        
                        {p.stock_breakdown?.length > 1 && (
                          <div className="relative group/breakdown">
                            <MapPin className="w-3 h-3 cursor-help" style={{ color: 'var(--odoo-teal)' }} title="Stored in multiple locations" />
                            <div className="absolute left-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-xl p-3 z-50 opacity-0 invisible group-hover/breakdown:opacity-100 group-hover/breakdown:visible transition-all pointer-events-none">
                              <p className="text-[10px] uppercase tracking-wider font-bold mb-2 pb-1 border-b" style={{ color: 'var(--odoo-purple)' }}>Location Breakdown</p>
                              <div className="space-y-1.5">
                                {p.stock_breakdown.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span style={{ color: 'var(--odoo-text-muted)' }}>{item.location_name}</span>
                                    <span className="font-semibold">{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--odoo-text)' }}>{p.free_to_use}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(p)}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        style={{ color: 'var(--odoo-purple)' }}
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        style={{ color: '#DC3545' }}
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8" style={{ color: 'var(--odoo-text-muted)' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-8 shadow-xl border relative" style={{ borderColor: 'var(--odoo-border)' }}>
            <button 
              onClick={() => { setShowModal(false); setEditingId(null); setNewProduct({ name: "", sku: "", category_id: "", unit_of_measure: "Units", reorder_rule: 0, cost: 0 }); }}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--odoo-text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--odoo-purple)' }}>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>Name</label>
                <input required type="text" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>SKU</label>
                  <input required type="text" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>Cost (per unit)</label>
                  <input type="number" step="0.01" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>Category</label>
                <select className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newProduct.category_id} onChange={e => setNewProduct({...newProduct, category_id: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {categories.length === 0 && <p className="text-xs text-red-500 mt-1">No categories yet. Create one first.</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>Min Stock Rule</label>
                  <input type="number" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newProduct.reorder_rule} onChange={e => setNewProduct({...newProduct, reorder_rule: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>Unit</label>
                  <input type="text" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newProduct.unit_of_measure} onChange={e => setNewProduct({...newProduct, unit_of_measure: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setNewProduct({ name: "", sku: "", category_id: "", unit_of_measure: "Units", reorder_rule: 0, cost: 0 }); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium" style={{ borderColor: 'var(--odoo-border)', color: 'var(--odoo-text)' }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ backgroundColor: 'var(--odoo-purple)' }}>{editingId ? "Update Product" : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-8 shadow-xl border relative" style={{ borderColor: 'var(--odoo-border)' }}>
            <button 
              onClick={() => { setShowCategoryModal(false); setEditingCategoryId(null); setNewCategory({ name: "", description: "" }); }}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--odoo-text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--odoo-purple)' }}>Manage Categories</h2>
            
            <form onSubmit={handleCreateCategory} className="space-y-4 mb-8 pb-8 border-b" style={{ borderColor: 'var(--odoo-border)' }}>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>Name</label>
                  <input required type="text" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} />
                </div>
                <button type="submit" className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 h-[38px]" style={{ backgroundColor: 'var(--odoo-purple)' }}>
                  {editingCategoryId ? "Update" : "Add"}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--odoo-text)' }}>Description</label>
                <input type="text" className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 text-sm" style={{ borderColor: 'var(--odoo-border)', '--tw-ring-color': 'var(--odoo-purple)' }} value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} />
              </div>
            </form>

            <div className="max-h-60 overflow-y-auto pr-2">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--odoo-text-muted)' }}>Existing Categories</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 group transition-colors hover:border-[#ddd]" style={{ borderColor: 'var(--odoo-border)' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--odoo-text)' }}>{cat.name}</p>
                      {cat.description && <p className="text-xs italic" style={{ color: 'var(--odoo-text-muted)' }}>{cat.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditCategory(cat)} className="p-1 hover:bg-gray-200 rounded transition-colors" style={{ color: 'var(--odoo-purple)' }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 hover:bg-red-100 rounded transition-colors" style={{ color: '#DC3545' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
