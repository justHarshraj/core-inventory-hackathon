import React from "react";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--odoo-bg)', color: 'var(--odoo-text)' }}>
      <Topbar />
      <div className="max-w-7xl mx-auto py-8 px-6">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
