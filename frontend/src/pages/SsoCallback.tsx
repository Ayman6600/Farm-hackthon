import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function SsoCallback() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isLoaded && !hasNavigated.current) {
      hasNavigated.current = true;
      if (isSignedIn) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, navigate]);

  return <LoadingSpinner message="Completing sign in..." />;
}

