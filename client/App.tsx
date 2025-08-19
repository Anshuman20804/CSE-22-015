import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Index from "./pages/Index";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/statistics" element={<Statistics />} />
          {/* Redirect route for shortened URLs */}
          <Route path="/r/:shortcode" element={<RedirectHandler />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Component to handle shortened URL redirects
const RedirectHandler = () => {
  const { shortcode } = useParams();
  const [redirecting, setRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shortcode) {
      handleRedirect(shortcode);
    }
  }, [shortcode]);

  const handleRedirect = async (shortcode: string) => {
    try {
      const response = await fetch(`/api/redirect/${shortcode}`);
      const data = await response.json();

      if (response.ok) {
        // Log the click and redirect
        window.location.href = data.originalUrl;
      } else {
        setError(data.error || 'Link not found or expired');
        setRedirecting(false);
      }
    } catch (error) {
      setError('Failed to process redirect');
      setRedirecting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Link Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button asChild>
            <a href="/">Create New Short Link</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-800">Redirecting...</h1>
        <p className="text-gray-600">Taking you to your destination</p>
      </div>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
