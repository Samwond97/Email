import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail } from "lucide-react";

const supabaseUrl = 'https://qdlkeoopswibuklaahvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGtlb29wc3dpYnVrbGFhaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDcyNzMsImV4cCI6MjA1NDAyMzI3M30.qevlY-vl7bVrmzUNjOtz0aicWoZR1CKWU53etMIMCEc';
const supabase = createClient(supabaseUrl, supabaseKey);

const Landing = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success("Account created! Please sign in.");
        setIsSignUp(false);
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success("Successfully signed in!");
        navigate("/compose");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-black" />
              <span className="ml-2 text-xl font-semibold">Mail AI</span>
            </div>
            <div>
              <Button 
                variant="link" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Left side - Hero section */}
        <div className="w-full md:w-1/2 bg-gray-50 p-8 md:p-16 flex items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Send emails with your own handwriting
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Mail AI transforms your digital messages with the personal touch of handwritten notes. 
              Create, customize, and send emails that stand out in a crowded inbox.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                  <span className="text-xl font-medium">1</span>
                </div>
                <p className="text-gray-800">Train your handwriting style</p>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                  <span className="text-xl font-medium">2</span>
                </div>
                <p className="text-gray-800">Compose your message</p>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                  <span className="text-xl font-medium">3</span>
                </div>
                <p className="text-gray-800">Send personalized emails</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-center mb-8">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </span>
                ) : (
                  <span>{isSignUp ? "Create account" : "Sign in"}</span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
