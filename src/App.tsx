import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <div>{session ? <Dashboard /> : <AuthPage />}</div>;
}

export default App;
