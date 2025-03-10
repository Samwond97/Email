import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import Landing from "@/pages/Landing";
import Index from "./pages/Index";
import Inbox from "./pages/Inbox";
import Starred from "./pages/Starred";
import Sent from "./pages/Sent";
import Drafts from "./pages/Drafts";
import Trash from "./pages/Trash";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/compose" element={
            <AuthGuard>
              <Index />
            </AuthGuard>
          } />
          <Route path="/inbox" element={
            <AuthGuard>
              <Inbox />
            </AuthGuard>
          } />
          <Route path="/starred" element={
            <AuthGuard>
              <Starred />
            </AuthGuard>
          } />
          <Route path="/sent" element={
            <AuthGuard>
              <Sent />
            </AuthGuard>
          } />
          <Route path="/drafts" element={
            <AuthGuard>
              <Drafts />
            </AuthGuard>
          } />
          <Route path="/trash" element={
            <AuthGuard>
              <Trash />
            </AuthGuard>
          } />
          <Route path="/settings" element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
