import GlassCard from "./GlassCard";

const data = [
  {
    rma: "RMA-1001",
    customer: "ABC Electronics",
    product: "LED TV",
    status: "Repair",
    tech: "Rahul",
  },
  {
    rma: "RMA-1002",
    customer: "XYZ Retail",
    product: "Monitor",
    status: "QC",
    tech: "Amit",
  },
  {
    rma: "RMA-1003",
    customer: "Tech Store",
    product: "Laptop",
    status: "Ready",
    tech: "Vijay",
  },
];

export default function RecentRMATable() {
  return (
    <GlassCard>

      <h3>Recent RMAs</h3>

      <table className="rma-table">

        <thead>
          <tr>
            <th>RMA</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Status</th>
            <th>Technician</th>
          </tr>
        </thead>

        <tbody>

          {data.map((row) => (

            <tr key={row.rma}>

              <td>{row.rma}</td>

              <td>{row.customer}</td>

              <td>{row.product}</td>

              <td>
                <span className="status-pill">
                  {row.status}
                </span>
              </td>

              <td>{row.tech}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </GlassCard>
  );
}