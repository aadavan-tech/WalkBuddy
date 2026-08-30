import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGate from "./AuthGate.tsx";
import LandingSelect from "./components/LandingSelect";
import FitnessComingSoon from "./components/FitnessComingSoon";
import "./index.css";

// Root layout:
//   /          → LandingSelect (public, no auth)
//   /running   → AuthGate (auth → onboarding → WalkBuddy dashboard)
//   /fitness   → FitnessComingSoon placeholder (public, no auth)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingSelect />} />
        <Route path="/running" element={<AuthGate />} />
        <Route path="/fitness" element={<FitnessComingSoon />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
