import GlassCard from "./GlassCard";

export default function RepairQueueCard() {
  return (
    <GlassCard>

      <h3>Repair Queue</h3>

      <div className="queue-row">
        <span>Pending</span>
        <strong>42</strong>
      </div>

      <div className="queue-row">
        <span>In Progress</span>
        <strong>18</strong>
      </div>

      <div className="queue-row">
        <span>Completed</span>
        <strong>12</strong>
      </div>

    </GlassCard>
  );
}