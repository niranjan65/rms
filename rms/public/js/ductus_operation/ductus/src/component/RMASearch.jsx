import GlassCard from "./GlassCard";
import { Search } from "lucide-react";

export default function RMASearch() {
  return (
    <GlassCard>

      <h3>Search RMA</h3>

      <div className="search-wrapper">

        <Search size={18} />

        <input
          className="glass-search"
          placeholder="Search by RMA Number..."
        />

      </div>

    </GlassCard>
  );
}