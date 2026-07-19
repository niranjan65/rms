import { motion } from "framer-motion";
import GlassCard from "./GlassCard";

export default function StatWidget({
  title,
  value,
  color
}) {

  return (

    <motion.div

      whileHover={{
        y:-8,
        scale:1.02
      }}

    >

      <GlassCard>

        <div
          className="stat-title"
        >
          {title}
        </div>

        <h2
          style={{
            color
          }}
        >
          {value}
        </h2>

      </GlassCard>

    </motion.div>

  );
}