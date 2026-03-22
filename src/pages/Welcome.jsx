import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    async function check() {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        navigate('/Dashboard', { replace: true });
      } else {
        base44.auth.redirectToLogin(window.location.origin + '/Dashboard');
      }
    }
    check();
  }, [navigate]);

  return null;
}