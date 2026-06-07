// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GatewayConfig from "./pages/GatewayConfig";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/gateway-config" element={<GatewayConfig />} />
      </Routes>
    </BrowserRouter>
  );
}