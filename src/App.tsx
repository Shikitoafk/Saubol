import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Programs from "@/pages/programs";
import IeltsPrep from "@/pages/ielts";
import IELTSTestViewer from "@/pages/ielts-test-viewer";
import SatPrep from "@/pages/sat";
import SATTestViewer from "@/pages/sat-test-viewer";
import SATPractice from "@/pages/sat-practice";
import Admissions from "@/pages/admissions";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/ielts" element={<IeltsPrep />} />
              <Route path="/ielts/test/:slug" element={<IELTSTestViewer />} />
              <Route path="/sat" element={<SatPrep />} />
              <Route path="/sat/practice" element={<SATPractice />} />
              <Route path="/sat/test/:section/:slug" element={<SATTestViewer />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
