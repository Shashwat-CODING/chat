import { useState } from "react";
import { useLocation } from "wouter";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { type SignInCredentials } from "@shared/schema";
import { socketClient } from "@/lib/socket";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignIn, setIsSignIn] = useState(true);
  const [, setLocation] = useLocation();
  
  // Toggle between sign in and sign up forms
  const toggleForm = () => {
    setIsSignIn(!isSignIn);
  };
  
  // Handle sign in
  const handleSignIn = async (credentials: SignInCredentials): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      // Connect via WebSocket with credentials
      return new Promise((resolve) => {
        socketClient.initWithCredentials(credentials, {
          onMessage: () => {
            // Initial message handling, will be overridden in ChatPage
          },
          onStatusChange: () => {
            // Status handling, will be overridden in ChatPage
          },
          onError: () => {
            // Error handling, will be overridden in ChatPage
            toast({
              title: "Connection Error",
              description: "Failed to connect to the chat server. Please try again.",
              variant: "destructive"
            });
            resolve(false);
          },
          onAuthResult: (success, userId, username) => {
            if (success && userId && username) {
              // Save user info to session/localStorage
              localStorage.setItem('userId', userId.toString());
              localStorage.setItem('username', username);
              
              // Show welcome toast
              toast({
                title: "Welcome back!",
                description: `You're now signed in as ${username}.`,
                variant: "default"
              });
              
              // Redirect to chat page
              setLocation("/chat");
              resolve(true);
            } else {
              resolve(false);
            }
          }
        });
      });
    } catch (error) {
      console.error("Sign in error:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle sign up
  const handleSignUp = async (formValues: any): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      // Extract values we need to send
      const { confirmPassword, ...userValues } = formValues;
      
      // Register the user through API
      const response = await apiRequest('/api/register', {
        method: 'POST',
        body: userValues
      });
      
      // Check response
      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Registration Failed",
          description: errorData.message || "Could not create account. Please try again.",
          variant: "destructive"
        });
        return false;
      }
      
      // Registration succeeded, show toast
      toast({
        title: "Account Created",
        description: "Your account has been created successfully. You can now sign in.",
        variant: "default"
      });
      
      // Switch to sign in form
      setIsSignIn(true);
      return true;
    } catch (error) {
      console.error("Sign up error:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">
          React Chat App
        </h1>
        <p className="text-muted-foreground">
          Sign in to connect with other users and start chatting
        </p>
      </div>
      
      {isSignIn ? (
        <SignInForm 
          onSubmit={handleSignIn} 
          onToggleForm={toggleForm} 
          isSubmitting={isSubmitting}
        />
      ) : (
        <SignUpForm 
          onSubmit={handleSignUp} 
          onToggleForm={toggleForm} 
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}