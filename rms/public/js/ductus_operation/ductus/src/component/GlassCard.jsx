export default function GlassCard({
  children,
  className=""
}){

  return(

    <div
      className={`glass-card ${className}`}
    >

      <div className="glass-reflection"/>

      {children}

    </div>

  );
}