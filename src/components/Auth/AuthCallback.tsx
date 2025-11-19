import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');
        
        // Get the session from the URL fragment
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('📊 Session after OAuth:', session);
        console.log('❌ Error after OAuth:', error);

        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          return;
        }

        if (session) {
          console.log('✅ OAuth successful, redirecting to dashboard...');
          // Successful login - redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          console.error('❌ No session found after OAuth');
          setError('Authentication failed. No session found.');
        }
      } catch (err) {
        console.error('💥 Unexpected error in auth callback:', err);
        setError('An unexpected error occurred during authentication');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Completing authentication...</h2>
        <p className="text-gray-600 mt-2">Please wait while we sign you in.</p>
      </div>
    </div>
  );
};