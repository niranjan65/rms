import { Search, Bell, Settings } from "lucide-react";

export default function TopBar() {
  return (
    <div className="topbar">

      <div className="search-box">
        <Search size={20} />

        <input
          type="text"
          placeholder="Search RMS..."
        />
      </div>

      <div className="top-actions">

        <button className="icon-btn">
          <Bell size={18} />
        </button>

        <button className="icon-btn">
          <Settings size={18} />
        </button>

        <div className="user-bubble">
          PK
        </div>

      </div>

    </div>
  );
}