// import GlassCard from "./GlassCard";

// const activities = [
//   "RMA-1001 Assigned",
//   "RMA-1002 Under Repair",
//   "QC Passed For RMA-1005",
//   "Delivery Created",
//   "Invoice Generated"
// ];

// export default function ActivityFeed(){

//   return(

//     <GlassCard>

//       <h3>
//         Live Activity
//       </h3>

//       <ul className="activity-list">

//         {activities.map((item,i)=>(
//           <li key={i}>
//             {item}
//           </li>
//         ))}

//       </ul>

//     </GlassCard>

//   );
// }





import GlassCard from "./GlassCard";

export default function ActivityFeed() {

  const logs = [
    "RMA-1001 Assigned To Rahul",
    "RMA-1002 Repair Started",
    "QC Passed For RMA-1005",
    "Delivery Created",
    "Invoice Generated"
  ];

  return (

    <GlassCard className="activity-card">

      <h3>Live Activity</h3>

      <ul className="activity-list">

        {logs.map((item, index) => (

          <li key={index}>
            {item}
          </li>

        ))}

      </ul>

    </GlassCard>

  );
}