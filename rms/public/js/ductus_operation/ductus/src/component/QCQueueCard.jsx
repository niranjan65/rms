import GlassCard from "./GlassCard";

export default function QCQueueCard() {
  return (
    <GlassCard>

      <h3>QC Queue</h3>

      <div className="queue-row">
        <span>Pending</span>
        <strong>17</strong>
      </div>

      <div className="queue-row">
        <span>Passed</span>
        <strong>88</strong>
      </div>

      <div className="queue-row">
        <span>Failed</span>
        <strong>4</strong>
      </div>

    </GlassCard>
  );
}