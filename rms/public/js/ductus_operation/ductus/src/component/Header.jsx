import { Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="topbar">

      <div className="search-box">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search RMA, Device, Customer..."
        />
      </div>

      <div className="topbar-right">

        <div className="notification">
          <Bell size={18} />
        </div>

        <div className="profile">
          <div className="avatar">A</div>

          <div>
            <h4>Administrator</h4>
            <p>Operations Manager</p>
          </div>
        </div>

      </div>
    </header>
  );
}