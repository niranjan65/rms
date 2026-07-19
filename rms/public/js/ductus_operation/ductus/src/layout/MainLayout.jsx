import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

// PREMIUM VECTOR CUSTOM SVGs
const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L29 9.5V24.5L16 32L3 24.5V9.5L16 2Z" fill="url(#logoGlow)" stroke="white" strokeWidth="2"/>
    <path d="M16 8L23 12V20L16 24L9 20V12L16 8Z" fill="white" fillOpacity="0.2"/>
    <defs>
      <linearGradient id="logoGlow" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4f8cff" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

// SLIM LINE CHEVRON DESIGN
const ToggleIcon = ({ collapsed }) => (
  <svg 
    width="12" 
    height="12" 
    viewBox="0 0 12 12" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ 
      transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", 
      transition: "transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)" 
    }}
  >
    <path d="M7.5 9L4.5 6L7.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const RmaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const RepairIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const TechIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 0 1 0 12.72M15.54 9.46a5 5 0 0 1 0 7.08" />
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0" />
    <rect x="2" y="14" width="8" height="8" rx="2" />
    <path d="M6 14v-4a4 4 0 0 1 8-0v4" />
  </svg>
);

const QcIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 11 11 13 15 9" />
  </svg>
);

const QcTechIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <path d="M11 8v6M8 11h6" />
  </svg>
);

const DeliveryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const InvoiceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="12" y1="4" x2="12" y2="20" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

export default function MainLayout({ children }) {
  const location = useLocation();
  
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggle = () => {
    setCollapsed((prev) => {
      const updated = !prev;
      localStorage.setItem("sidebar_collapsed", JSON.stringify(updated));
      return updated;
    });
  };

  const menuItems = [
    { path: "/", label: "Dashboard", icon: <DashboardIcon /> },
    { path: "/rma", label: "RMA Register", icon: <RmaIcon /> },
    { path: "/repair", label: "Repair Queue", icon: <RepairIcon /> },
    { path: "/repair-tech", label: "Technician View", icon: <TechIcon /> },
    { path: "/qc", label: "Quality Control", icon: <QcIcon /> },
    { path: "/qc-tech", label: "QC Inspection", icon: <QcTechIcon /> },
    { path: "/delivery", label: "Delivery Notes", icon: <DeliveryIcon /> },
    { path: "/invoice", label: "Billing & Invoices", icon: <InvoiceIcon /> }
  ];

  return (
    <div className="main-layout">
      
      {/* SIDEBAR DOCK */}
      <div className={`dock ${collapsed ? "collapsed" : "expanded"}`}>
        
        {/* BRAND HEADER */}
        <div className={`dock-header ${collapsed ? "collapsed" : "expanded"}`}>
          <div className="brand-logo">
            <LogoIcon />
          </div>
          <span className="brand-title">DUCTUS</span>
        </div>

        {/* FLOATING SEAM TRIGGER HANDLE (Independent of Header Flow) */}
        <button className="sidebar-toggle" onClick={handleToggle}>
          <ToggleIcon collapsed={collapsed} />
        </button>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <nav className="dock-menu">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`dock-item ${isActive ? "active" : ""}`}
                title={collapsed ? item.label : ""}
              >
                <div className="dock-icon">{item.icon}</div>
                <span className="dock-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* DYNAMIC FLEXIBLE PAGE AREA */}
      <div className={`page-area ${collapsed ? "collapsed" : "expanded"}`}>
        
        {/* TOPBAR */}
        <div className="topbar">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search RMS Dashboard..." />
          </div>

          <div className="top-actions">
            <button className="icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <button className="icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <div className="user-bubble">PK</div>
          </div>
        </div>

        {/* CONTAINER OUTLET VIEW */}
        {children}
      </div>
    </div>
  );
}