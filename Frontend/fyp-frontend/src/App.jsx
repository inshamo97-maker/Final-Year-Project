import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";

// Invigilator
import InvigilatorDashboard from "./pages/invigilator/InvigilatorDashboard";  // merged
import InvigilatorAlertsPage from "./pages/invigilator/InvigilatorAlertsPage";
import InvigilatorViolations from "./pages/invigilator/InvigilatorViolations";
import InvigilatorExamHalls from "./pages/invigilator/InvigilatorExamHalls";
import InvigilatorStudents from "./pages/invigilator/InvigilatorStudents";

// Admin
import AdminOverview from "./pages/admin/AdminOverview";
import AdminInvigilators from "./pages/admin/AdminInvigilators";
import AdminExamSchedule from "./pages/admin/AdminExamSchedule";  // merged exams + halls
import AdminHardware from "./pages/admin/AdminHardware";           // merged cameras + mics + speakers
import AdminViolations from "./pages/admin/AdminViolations";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminSeating from "./pages/admin/AdminSeating";
import AdminReports from "./pages/admin/AdminReports";
import AdminStudents from "./pages/admin/AdminStudents";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Invigilator */}
          <Route path="/invigilator/dashboard"  element={<InvigilatorDashboard />} />
          <Route path="/invigilator/alerts"     element={<InvigilatorAlertsPage />} />
          <Route path="/invigilator/violations" element={<InvigilatorViolations />} />
          <Route path="/invigilator/exam-halls" element={<InvigilatorExamHalls />} />
          <Route path="/invigilator/students"   element={<InvigilatorStudents />} />

          {/* Admin */}
          <Route path="/admin/dashboard"   element={<AdminOverview />} />
          <Route path="/admin/invigilators" element={<AdminInvigilators />} />
          <Route path="/admin/schedule"    element={<AdminExamSchedule />} />
          <Route path="/admin/hardware"    element={<AdminHardware />} />
          <Route path="/admin/violations"  element={<AdminViolations />} />
          <Route path="/admin/alerts"      element={<AdminAlerts />} />
          <Route path="/admin/seating"     element={<AdminSeating />} />
          <Route path="/admin/reports"     element={<AdminReports />} />
          <Route path="/admin/students" element={<AdminStudents/>} />
   
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;