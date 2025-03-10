import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = 'https://qdlkeoopswibuklaahvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbGtlb29wc3dpYnVrbGFhaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDcyNzMsImV4cCI6MjA1NDAyMzI3M30.qevlY-vl7bVrmzUNjOtz0aicWoZR1CKWU53etMIMCEc';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!data.session) {
          navigate('/');
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error: any) {
        toast.error('Authentication error: ' + error.message);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin h-8 w-8 border-2 border-black border-opacity-20 border-t-black rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
