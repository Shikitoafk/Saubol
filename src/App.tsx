import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
const IeltsPrep = lazy(() => import("@/pages/ielts"));
const IELTSTestViewer = lazy(() => import("@/pages/ielts-test-viewer"));
const SatPrep = lazy(() => import("@/pages/sat"));
const SATTestViewer = lazy(() => import("@/pages/sat-test-viewer"));
const SATPractice = lazy(() => import("@/pages/sat-practice"));
const SATPastPapers = lazy(() => import("@/pages/sat-past-papers"));
const SATCollections = lazy(() => import("@/pages/sat-collections"));
const SATTests = lazy(() => import("@/pages/sat-tests"));
const SATDiagnostic = lazy(() => import("@/pages/sat-diagnostic"));
const SATRoadmap = lazy(() => import("@/pages/sat-roadmap"));
const SATStudyPlan = lazy(() => import("@/pages/sat-study-plan"));
const SATDashboard = lazy(() => import("@/pages/sat-dashboard"));
const IELTSWritingChecker = lazy(() => import("@/pages/ielts-writing-checker"));
const Programs = lazy(() => import("@/pages/programs"));
const Admissions = lazy(() => import("@/pages/admissions"));
const AdmissionsCalculator = lazy(() => import("@/pages/admissions-calculator"));
const Login = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));

const queryClient = new QueryClient();

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
              <Route path="/ielts/test/:slug" element={<IELTSTestViewer />} />
              <Route path="/ielts/writing-checker" element={<IELTSWritingChecker />} />
              <Route path="/sat" element={<SatPrep />} />
              <Route path="/sat/practice" element={<SATPractice />} />
              <Route path="/sat/past-papers" element={<SATPastPapers />} />
              <Route path="/sat/collections" element={<SATCollections />} />
              <Route path="/sat/tests" element={<SATTests />} />
              <Route path="/sat/diagnostic" element={<SATDiagnostic />} />
              <Route path="/sat/roadmap" element={<SATRoadmap />} />
              <Route path="/sat/study-plan" element={<SATStudyPlan />} />
              <Route path="/sat/dashboard" element={<SATDashboard />} />
              <Route path="/sat/question-bank" element={<SATPractice />} />
              <Route path="/sat/test/:section/:slug" element={<SATTestViewer />} />
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
