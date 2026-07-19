import GlassCard from "./GlassCard";

export default function RMAStatusCard({
  title,
  count
}) {
  return (
    <GlassCard>

      <div className="status-title">
        {title}
      </div>

      <h2>{count}</h2>

    </GlassCard>
  );
}