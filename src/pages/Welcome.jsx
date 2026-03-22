import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function Welcome() {
  useEffect(() => {
    async function check() {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        window.location.href = '/Dashboard';
      } else {
        base44.auth.redirectToLogin(window.location.origin + '/Dashboard');
      }
    }
    check();
  }, []);

  return null;
}