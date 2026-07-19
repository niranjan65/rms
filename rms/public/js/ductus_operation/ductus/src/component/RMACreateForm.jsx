import GlassCard from "./GlassCard";

export default function RMACreateForm() {
  return (
    <GlassCard>

      <h3>Create New RMA</h3>

      <div className="form-grid">

        <input
          className="glass-input"
          placeholder="Customer Name"
        />

        <input
          className="glass-input"
          placeholder="Contact Number"
        />

        <input
          className="glass-input"
          placeholder="Product"
        />

        <input
          className="glass-input"
          placeholder="Serial Number"
        />

      </div>

      <textarea
        className="glass-input"
        rows="4"
        placeholder="Issue Description"
      />

      <button className="primary-btn">
        Create RMA
      </button>

    </GlassCard>
  );
}