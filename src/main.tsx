import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AuthGate from './AuthGate.tsx';
import './index.css';

// AuthGate owns the Supabase session and gates the dashboard behind the
// Google sign-in -> personal info -> preferences survey -> terms flow.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate />
  </StrictMode>,
);
