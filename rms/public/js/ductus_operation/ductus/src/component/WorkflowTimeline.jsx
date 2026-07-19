import GlassCard from "./GlassCard";

const stages = [
  "Receiving",
  "Repair",
  "QC",
  "Delivery",
  "Invoice"
];

export default function WorkflowTimeline(){

  return(

    <GlassCard>

      <h3>
        Live Workflow Timeline
      </h3>

      <div className="timeline">

        {stages.map((stage,i)=>(

          <div
            key={i}
            className="timeline-item"
          >

            <div
              className="timeline-node"
            />

            <span>
              {stage}
            </span>

          </div>

        ))}

      </div>

    </GlassCard>

  );
}