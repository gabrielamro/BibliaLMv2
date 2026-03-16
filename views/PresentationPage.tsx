"use client";
import { useNavigate } from '../utils/router';


import React, { useEffect } from 'react';


const PresentationPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/intro', { replace: true });
  }, [navigate]);

  return null;
};

export default PresentationPage;
