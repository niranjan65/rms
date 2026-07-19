import GlassCard from "./GlassCard";

export default function TechnicianCard({
  name,
  jobs,
  score
}) {

  return (

    <GlassCard className="tech-card">

      <div className="tech-avatar">

        {name[0]}

      </div>

      <h4>{name}</h4>

      <p>
        Jobs: {jobs}
      </p>

      <span
        className="live-status"
      />

      <small>
        Performance: {score}%
      </small>

    </GlassCard>

  );
}