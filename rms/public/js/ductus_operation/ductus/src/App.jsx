import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/animations.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import Dashboard from "./pages/Dashboard";
import RMA from "./pages/RMA";
import RepairReturn from "./pages/RepairReturn";
import TechnicianView from "./pages/TechnicianView";
import QualityCheck from "./pages/QualityCheck";
import QualityTechnician from "./pages/QualityTechnician";
import DeliveryNote from "./pages/DeliveryNote";
import SalesInvoice from "./pages/SalesInvoice";

import Particles from "./component/Particles";

export default function App(){

  return(

    <BrowserRouter>

      <div className="app-shell">

        <div className="glow one"/>

        <div className="glow two"/>

        <Particles/>

        <MainLayout>

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/rma"
              element={<RMA />}
            />

            <Route
              path="/repair"
              element={<RepairReturn />}
            />

            <Route
              path="/repair-tech"
              element={<TechnicianView />}
            />

            <Route
              path="/qc"
              element={<QualityCheck />}
            />

            <Route
              path="/qc-tech"
              element={<QualityTechnician />}
            />

            <Route
              path="/delivery"
              element={<DeliveryNote />}
            />

            <Route
              path="/invoice"
              element={<SalesInvoice />}
            />

          </Routes>

        </MainLayout>

      </div>

    </BrowserRouter>

  );
}