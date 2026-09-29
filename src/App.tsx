import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
const IeltsPrep = lazy(() => import("@/pages/ielts"));
const IELTSTestViewer = lazy(() => import("@/pages/ielts-test-viewer"));
const IELTSWritingPractice = lazy(() => import("@/pages/ielts-writing-practice"));
const IELTSSpeakingPractice = lazy(() => import("@/pages/ielts-speaking-practice"));
const IELTSWritingChecker = lazy(() => import("@/pages/ielts-writing-checker"));
const Programs = lazy(() => import("@/pages/programs"));
const Admissions = lazy(() => import("@/pages/admissions"));
const AdmissionsCalculator = lazy(() => import("@/pages/admissions-calculator"));
const Login = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));

const queryClient = new QueryClient();

function IELTSPracticeRoute() {
  const { slug } = useParams();
  if (slug?.startsWith("speaking-topic-")) return <Navigate to="/ielts/speaking" replace />;
  return <IELTSTestViewer />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ielts" element={<IeltsPrep />} />
              <Route path="/ielts/test/:slug" element={<IELTSPracticeRoute />} />
              <Route path="/ielts/writing" element={<IELTSWritingPractice />} />
              <Route path="/ielts/speaking/:topicId" element={<IELTSSpeakingPractice />} />
              <Route path="/ielts/speaking" element={<Navigate to="/ielts/speaking/neighbourhood" replace />} />
              <Route path="/ielts/writing-checker" element={<IELTSWritingChecker />} />
              <Route path="/sat/*" element={<Navigate to="/ielts" replace />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/admissions/calculator" element={<AdmissionsCalculator />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
