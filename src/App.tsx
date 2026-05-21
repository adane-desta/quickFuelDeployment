import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { initSessionRefreshOnVisibility } from './lib/supabase/client';
//fRAnjhTNDnmu
export default function App() {
  
  useEffect(() => {
    const cleanup = initSessionRefreshOnVisibility();
    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}