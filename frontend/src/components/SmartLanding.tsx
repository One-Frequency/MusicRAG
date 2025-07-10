import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

interface SmartLandingProps {
  children: React.ReactNode;
}

export const SmartLanding = ({ children }: SmartLandingProps) => {
  const { isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize authentication state on app load
    initializeAuth();
  }, [initializeAuth]);

  // Show loading spinner while checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children (main app)
  // If not authenticated, children should contain the login/register interface
  return <>{children}</>;
};

export default SmartLanding;
