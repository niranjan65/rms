import RMACreateForm from "../component/RMACreateForm";
import RMASearch from "../component/RMASearch";
import RMAStatusCard from "../component/RMAStatusCard";
import RecentRMATable from "../component/RecentRMATable";

export default function RMA() {

  return (

    <div>

      <div className="page-header">

        <h1>RMA Management</h1>

        <p>
          Create and manage repair requests
        </p>

      </div>

      <div className="rma-status-grid">

        <RMAStatusCard
          title="Open RMAs"
          count="128"
        />

        <RMAStatusCard
          title="Under Repair"
          count="42"
        />

        <RMAStatusCard
          title="Awaiting QC"
          count="17"
        />

        <RMAStatusCard
          title="Completed"
          count="88"
        />

      </div>

      <div className="rma-grid">

        <RMACreateForm />

        <RMASearch />

      </div>

      <div style={{ marginTop: "20px" }}>
        <RecentRMATable />
      </div>

    </div>

  );
}