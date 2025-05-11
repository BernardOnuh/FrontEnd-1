import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SwapPage from "./pages/SwapPage";
import ActivityPage from "./pages/ActivityPage";
import ProvidersPage from "./pages/ProvidersPage";
function App() {
   return (
      <Routes>
         <Route path="/" element={<LandingPage />} />
         <Route path="/app" element={<SwapPage />} />
         <Route path="/activity" element={<ActivityPage />} />
         <Route path="/liquidity" element={<ProvidersPage />} />
      </Routes>
   );
}

export default App;
