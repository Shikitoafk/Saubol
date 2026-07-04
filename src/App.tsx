import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Analytics } from "@vercel/analytics/react";

import Home from "@/pages/home";
import IeltsPrep from "@/pages/ielts";
import IELTSTestViewer from "@/pages/ielts-test-viewer";
import SatPrep from "@/pages/sat";
import SATTestViewer from "@/pages/sat-test-viewer";
import SATPractice from "@/pages/sat-practice";
import SATPastPapers from "@/pages/sat-past-papers";
import SATQuestionBank from "@/pages/sat-question-bank";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ielts" element={<IeltsPrep />} />
            <Route path="/ielts/test/:slug" element={<IELTSTestViewer />} />
            <Route path="/sat" element={<SatPrep />} />
            <Route path="/sat/practice" element={<SATPractice />} />
            <Route path="/sat/past-papers" element={<SATPastPapers />} />
            <Route path="/sat/question-bank" element={<SATQuestionBank />} />
            <Route path="/sat/test/:section/:slug" element={<SATTestViewer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
