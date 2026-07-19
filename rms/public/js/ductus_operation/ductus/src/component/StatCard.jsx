import { motion } from "framer-motion";
import {
  TrendingUp
} from "lucide-react";

export default function StatCard({
  title,
  value,
  growth,
  type
}) {
  return (
    <motion.div
      className={`stat-card ${type}`}
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: .4
      }}
    >
      <div className="stat-top">
        <span>{title}</span>

        <TrendingUp size={18} />
      </div>

      <h2>{value}</h2>

      <p>{growth} this month</p>
    </motion.div>
  );
}