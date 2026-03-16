"use client";
import { useNavigate } from '../utils/router';


import React, { useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { openLogin, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    } else {
      openLogin();
      navigate('/', { replace: true });
    }
  }, [currentUser, openLogin, navigate]);

  return null;
};

export default Login;
