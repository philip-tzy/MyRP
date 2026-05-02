import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  Warehouse,
  Cpu,
  ListChecks,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";


const MenuGroup = ({ label, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = children.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`sidebar-item w-full justify-between ${isActive ? "text-gray-900 font-medium" : ""}`}
      >
        <span className="flex items-center gap-2.5">
          <Icon size={16} />
          {label}
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className="ml-4 pl-2 border-l border-gray-100 mt-0.5 space-y-0.5">
          {children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              className={({ isActive }) =>
                `sidebar-item text-[13px] ${isActive ? "active" : ""}`
              }
            >
              <c.icon size={14} />
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-gray-50 border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
        <img
          src="/MyRPLogo.png"
          alt="MyRP Logo"
          className="w-8 h-8 object-contain"
        />
        <div>
          <div className="text-sm font-semibold text-gray-900 leading-tight">
            MyRP
          </div>
          <div className="text-[10px] text-gray-400">v1.0.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">
          Master Data
        </p>

        <NavLink
          to="/master/parts"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <Package size={16} />
          Parts
        </NavLink>

        <NavLink
          to="/master/customers"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <Users size={16} />
          Customers
        </NavLink>

        <NavLink
          to="/master/suppliers"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <Truck size={16} />
          Suppliers
        </NavLink>

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">
          Transactions
        </p>

        <NavLink
          to="/transactions/so"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <ShoppingCart size={16} />
          Sales Orders
        </NavLink>

        <NavLink
          to="/transactions/inventory"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <Warehouse size={16} />
          Inventory
        </NavLink>

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">
          MRP Engine
        </p>

        <NavLink
          to="/mrp/engine"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <Cpu size={16} />
          Run MRP
        </NavLink>

        <NavLink
          to="/mrp/suggestions"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <ListChecks size={16} />
          Suggestions
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[11px] font-semibold text-brand-600">
            AD
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">Admin</div>
            <div className="text-[10px] text-gray-400">Production Planner</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
