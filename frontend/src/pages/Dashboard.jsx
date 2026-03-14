import React, { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";
import { Package, AlertTriangle, XCircle, ArrowRightLeft, TruckIcon, DownloadCloud } from "lucide-react";

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    total_products: 0,
    low_stock: 0,
    out_of_stock: 0,
    receipts: { late: 0, waiting: 0, ready: 0, operations: 0, total: 0 },
    deliveries: { late: 0, waiting: 0, ready: 0, operations: 0, total: 0 },
    internal_transfers: { late: 0, waiting: 0, ready: 0, operations: 0, total: 0 }
  });

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const { data } = await API.get("/dashboard/kpis");
      setKpis(data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  const summaryCards = [
    { label: "Total Products", value: kpis.total_products, icon: Package, color: "var(--odoo-purple)", bg: "#714B6710", link: "/products" },
    { label: "Low Stock Items", value: kpis.low_stock, icon: AlertTriangle, color: "#E67E22", bg: "#E67E2210", link: "/products" },
    { label: "Out of Stock", value: kpis.out_of_stock, icon: XCircle, color: "#DC3545", bg: "#DC354510", link: "/products" },
    { label: "Internal Transfers", value: kpis.internal_transfers?.total || 0, icon: ArrowRightLeft, color: "var(--odoo-teal)", bg: "#00A09D10", link: "/operations/transfers" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 pb-2 w-fit mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--odoo-purple)' }}>Dashboard</h1>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {summaryCards.map((card) => (
          <Link key={card.label} to={card.link} className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow" style={{ borderColor: 'var(--odoo-border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: card.bg }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--odoo-text-muted)' }}>{card.label}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</div>
          </Link>
        ))}
      </div>

      {/* Operations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Receipts Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: 'var(--odoo-border)' }}>
          <div className="flex items-center gap-2 mb-6">
            <DownloadCloud className="w-5 h-5" style={{ color: 'var(--odoo-purple)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--odoo-purple)' }}>Receipts</h2>
          </div>
          <div className="flex items-end justify-between">
            <Link to="/operations/receipts" className="text-sm px-5 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--odoo-teal)' }}>
              {kpis.receipts.ready} to receive
            </Link>
            <div className="flex flex-col gap-1 text-xs text-right" style={{ color: 'var(--odoo-text-muted)' }}>
              {kpis.receipts.late > 0 && <div className="text-red-500 font-medium">{kpis.receipts.late} Late</div>}
              <div>{kpis.receipts.operations} operations</div>
            </div>
          </div>
        </div>

        {/* Deliveries Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: 'var(--odoo-border)' }}>
          <div className="flex items-center gap-2 mb-6">
            <TruckIcon className="w-5 h-5" style={{ color: 'var(--odoo-purple)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--odoo-purple)' }}>Deliveries</h2>
          </div>
          <div className="flex items-end justify-between">
            <Link to="/operations/deliveries" className="text-sm px-5 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--odoo-teal)' }}>
              {kpis.deliveries.ready} to deliver
            </Link>
            <div className="flex flex-col gap-1 text-xs text-right" style={{ color: 'var(--odoo-text-muted)' }}>
              {kpis.deliveries.late > 0 && <div className="text-red-500 font-medium">{kpis.deliveries.late} Late</div>}
              {kpis.deliveries.waiting > 0 && <div>{kpis.deliveries.waiting} waiting</div>}
              <div>{kpis.deliveries.operations} operations</div>
            </div>
          </div>
        </div>

        {/* Internal Transfers Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: 'var(--odoo-border)' }}>
          <div className="flex items-center gap-2 mb-6">
            <ArrowRightLeft className="w-5 h-5" style={{ color: 'var(--odoo-purple)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--odoo-purple)' }}>Internal Transfers</h2>
          </div>
          <div className="flex items-end justify-between">
            <Link to="/operations/transfers" className="text-sm px-5 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--odoo-teal)' }}>
              {kpis.internal_transfers?.ready || 0} scheduled
            </Link>
            <div className="flex flex-col gap-1 text-xs text-right" style={{ color: 'var(--odoo-text-muted)' }}>
              {(kpis.internal_transfers?.late || 0) > 0 && <div className="text-red-500 font-medium">{kpis.internal_transfers.late} Late</div>}
              <div>{kpis.internal_transfers?.operations || 0} operations</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
