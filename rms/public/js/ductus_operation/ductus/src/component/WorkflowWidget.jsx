import GlassCard from "./GlassCard";

export default function WorkflowWidget(){

  const steps = [
    "Receiving",
    "Repair",
    "QC",
    "Delivery",
    "Invoice"
  ];

  return(

    <GlassCard
      className="workflow-card"
    >

      <h3>
        RMS Workflow
      </h3>

      <div className="workflow">

        {steps.map((step,index)=>(
          <div
            key={index}
            className="workflow-step"
          >

            <div className="workflow-dot"/>

            <span>
              {step}
            </span>

          </div>
        ))}

      </div>

    </GlassCard>

  );
}