import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/ChatPage";
import AuthPage from "@/pages/AuthPage";
import { useEffect, useState } from "react";

// Protected route component that redirects to login if not authenticated
function ProtectedRoute({ component: Component, ...rest }: any) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    setIsAuthenticated(!!userId && !!username);
  }, []);
  
  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return null;
  }
  
  // Render the component or redirect to login
  return isAuthenticated ? <Component {...rest} /> : <Redirect to="/auth" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/chat" />} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/chat">
        {(params) => <ProtectedRoute component={ChatPage} params={params} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Fix mobile viewport height issue
  useEffect(() => {
    const setVhVariable = () => {
      // First we get the viewport height and we multiply it by 1% to get a value for a vh unit
      const vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial set
    setVhVariable();

    // Add event listener to update on resize
    window.addEventListener('resize', setVhVariable);
    window.addEventListener('orientationchange', setVhVariable);

    return () => {
      window.removeEventListener('resize', setVhVariable);
      window.removeEventListener('orientationchange', setVhVariable);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
