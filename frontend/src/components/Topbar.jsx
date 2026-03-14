import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Package, LayoutDashboard, Truck, ArrowRightLeft, History, Settings, User, X } from "lucide-react";

export default function TopBar() {
  const [showOps, setShowOps] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Products", path: "/products", icon: Package },
    { label: "Move History", path: "/operations/history", icon: History },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const opsItems = [
    { label: "Receipts", path: "/operations/receipts" },
    { label: "Deliveries", path: "/operations/deliveries" },
    { label: "Internal Transfers", path: "/operations/transfers" },
    { label: "Adjustments", path: "/operations/adjustments" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 shadow-md border-b" style={{ backgroundColor: 'var(--odoo-purple)', borderColor: 'var(--odoo-purple-dark)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-2 group">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-extrabold text-xl tracking-tight group-hover:opacity-90 transition-opacity">
                CoreInventory
              </span>
            </NavLink>

            {/* Main Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink 
                to="/dashboard" 
                className={({isActive}) => `px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                Dashboard
              </NavLink>

              <div className="relative">
                <button 
                  onClick={() => setShowOps(!showOps)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${location.pathname.startsWith('/operations') && location.pathname !== '/operations/history' ? 'bg-white/10 text-white shadow-inner' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
                >
                  Operations <ChevronDown className={`w-4 h-4 transition-transform ${showOps ? 'rotate-180' : ''}`} />
                </button>
                
                {showOps && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setShowOps(false)}></div>
                    <div className="absolute left-0 mt-2 w-56 bg-white border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {opsItems.map(item => (
                        <NavLink 
                          key={item.path}
                          to={item.path}
                          onClick={() => setShowOps(false)}
                          className={({isActive}) => `block px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-[#714B6715] font-semibold text-[#714B67]' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <NavLink 
                to="/products" 
                className={({isActive}) => `px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                Products
              </NavLink>

              <NavLink 
                to="/operations/history" 
                className={({isActive}) => `px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                Move History
              </NavLink>

              <NavLink 
                to="/settings" 
                className={({isActive}) => `px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                Settings
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3 relative">
             <div 
               onClick={() => setShowUserMenu(!showUserMenu)}
               className="hidden sm:flex items-center gap-2 group cursor-pointer px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10"
             >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
                   <User className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white tracking-wide">
                  {(() => {
                    try {
                      return JSON.parse(localStorage.getItem('user') || '{}').login_id || 'User';
                    } catch {
                      return 'User';
                    }
                  })()}
                </span>
                <ChevronDown className={`w-3 h-3 text-white/70 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
             </div>

             {showUserMenu && (
               <>
                 <div className="fixed inset-0 z-0" onClick={() => setShowUserMenu(false)}></div>
                 <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                   <NavLink 
                     to="/settings" 
                     onClick={() => setShowUserMenu(false)}
                     className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                   >
                     Account Settings
                   </NavLink>
                   <div className="h-px bg-gray-100 my-1 mx-2"></div>
                   <button 
                     onClick={handleLogout}
                     className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                   >
                     Logout
                   </button>
                 </div>
               </>
             )}
          </div>
        </div>
      </div>
    </header>
  );
}
