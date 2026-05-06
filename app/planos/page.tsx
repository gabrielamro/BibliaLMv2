"use client";
import { useEffect } from 'react';
import { useNavigate } from '../../utils/router';

export default function Page() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, [navigate]);
  
  return null;
}
