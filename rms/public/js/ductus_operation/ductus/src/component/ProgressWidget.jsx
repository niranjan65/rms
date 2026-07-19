import GlassCard from "./GlassCard";

export default function ProgressWidget({
  title,
  value,
  color
}) {

  return (

    <GlassCard>

      <div className="progress-wrap">

        <svg
          width="120"
          height="120"
        >

          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />

          <circle
            cx="60"
            cy="60"
            r="50"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray="314"
            strokeDashoffset={
              314 - (314 * value) / 100
            }
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />

        </svg>

        <div className="progress-center">

          {value}%

        </div>

      </div>

      <h4>{title}</h4>

    </GlassCard>
  );
}