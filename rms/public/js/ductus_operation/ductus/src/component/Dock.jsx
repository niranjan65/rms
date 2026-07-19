import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Hammer,
  ShieldCheck,
  CheckCircle,
  Truck,
  Receipt
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function Dock() {

  const navigate = useNavigate();

  const menu = [
    {
      icon: LayoutDashboard,
      path: "/",
    },
    {
      icon: ClipboardList,
      path: "/rma",
    },
    {
      icon: Wrench,
      path: "/repair",
    },
    {
      icon: Hammer,
      path: "/repair-tech",
    },
    {
      icon: ShieldCheck,
      path: "/qc",
    },
    {
      icon: CheckCircle,
      path: "/qc-tech",
    },
    {
      icon: Truck,
      path: "/delivery",
    },
    {
      icon: Receipt,
      path: "/invoice",
    }
  ];

  return (

    <div className="dock">

      {menu.map((item,index)=>{

        const Icon = item.icon;

        return (

          <button
            key={index}
            className="dock-item"
            onClick={() =>
              navigate(item.path)
            }
          >
            <Icon size={22}/>
          </button>

        );

      })}

    </div>

  );
}