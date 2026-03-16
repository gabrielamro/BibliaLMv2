"use client";
import { useNavigate } from '../utils/router';

import React from 'react';


// This component is currently unused directly as pages/LoginPage.tsx handles the full login logic.
// Kept as a redirect or placeholder to avoid build errors if referenced elsewhere.

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};

export default Login;
