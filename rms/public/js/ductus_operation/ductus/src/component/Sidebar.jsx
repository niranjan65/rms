import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  UserCog,
  ShieldCheck,
  Truck,
  Receipt
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menus = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/"
  },
  {
    name: "RMA",
    icon: ClipboardList,
    path: "/rma"
  },
  {
    name: "Repair Return",
    icon: Wrench,
    path: "/repair-return"
  },
  {
    name: "Technician",
    icon: UserCog,
    path: "/technician"
  },
  {
    name: "Quality Check",
    icon: ShieldCheck,
    path: "/quality-check"
  },
  {
    name: "Delivery Note",
    icon: Truck,
    path: "/delivery-note"
  },
  {
    name: "Sales Invoice",
    icon: Receipt,
    path: "/sales-invoice"
  }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="logo-area">
        <div className="logo-box">D</div>

        <div>
          <h3>DUCTUS</h3>
          <p>RMS Platform</p>
        </div>
      </div>

      <div className="menu-list">
        {menus.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "menu-item active"
                  : "menu-item"
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}