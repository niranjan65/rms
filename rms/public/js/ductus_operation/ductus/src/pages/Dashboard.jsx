import StatWidget from "../component/StatWidget";
import ActivityFeed from "../component/ActivityFeed";
import GlassCard from "../component/GlassCard";
import AnalyticsChart from "../component/AnalyticsChart";
import ProgressWidget from "../component/ProgressWidget";
import TechnicianCard from "../component/TechnicianCard";
import QueuePanel from "../component/QueuePanel";
import RecentRMATable from "../component/RecentRMATable";
import RepairQueueCard from "../component/RepairQueueCard";
import QCQueueCard from "../component/QCQueueCard";

export default function Dashboard() {
    return (
        <div>
            {/* HERO GRID WITH PARALLEL LEFT/RIGHT COLUMNS */}
            <div className="hero-grid">
                
                {/* LEFT COLUMN: Mini Ductus Card + Analytics Chart */}
                <div className="hero-left-col">
                    <GlassCard className="hero-panel">
                        <h1>Ductus RMS</h1>
                        <p>Repair Operations Command Center</p>
                    </GlassCard>
                    
                    <AnalyticsChart />
                </div>

                {/* RIGHT COLUMN: Taller Live Activity Feed */}
                <ActivityFeed />

            </div>

            {/* QUICK STATS GRID */}
            <div className="stats-grid">
                <StatWidget
                    title="RMA Queue"
                    value="128"
                    color="#4f8cff"
                />
                <StatWidget
                    title="Repair Queue"
                    value="42"
                    color="#8b5cf6"
                />
                <StatWidget
                    title="QC Queue"
                    value="17"
                    color="#00c2ff"
                />
                <StatWidget
                    title="Delivery Queue"
                    value="8"
                    color="#10b981"
                />
            </div>

            {/* PROGRESS WIDGET SECTION */}
            <div className="progress-grid">
                <ProgressWidget
                    title="Repair Efficiency"
                    value={82}
                    color="#4f8cff"
                />
                <ProgressWidget
                    title="QC Success"
                    value={91}
                    color="#10b981"
                />
                <ProgressWidget
                    title="Delivery SLA"
                    value={88}
                    color="#8b5cf6"
                />
            </div>

            {/* QUEUE PANELS */}
            <div className="queue-grid">
                <QueuePanel
                    title="Pending RMAs"
                    count="128"
                />
                <QueuePanel
                    title="Repair Queue"
                    count="42"
                />
                <QueuePanel
                    title="QC Queue"
                    count="17"
                />
            </div>

            <div style={{ marginTop: "20px" }}>
                {/* <WorkflowTimeline /> */}
            </div>

            {/* TECHNICIAN CARDS */}
            <div className="tech-grid">
                <TechnicianCard
                    name="Rahul"
                    jobs="18"
                    score="92"
                />
                <TechnicianCard
                    name="Amit"
                    jobs="15"
                    score="88"
                />
                <TechnicianCard
                    name="Vijay"
                    jobs="12"
                    score="95"
                />
            </div>

            {/* RECENT RMA TABLE */}
            <div style={{ marginTop: "20px" }}>
                <RecentRMATable />
            </div>

            {/* QUEUE DETAILS */}
            <div className="queue-section">
                <RepairQueueCard />
                <QCQueueCard />
            </div>
        </div>
    );
}