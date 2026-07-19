import GlassCard from "./GlassCard";

export default function QueuePanel({
  title,
  count
}) {

  return (

    <GlassCard
      className="queue-panel"
    >

      <div>

        <h4>{title}</h4>

        <p>
          Pending Tasks
        </p>

      </div>

      <h1>{count}</h1>

    </GlassCard>

  );
}