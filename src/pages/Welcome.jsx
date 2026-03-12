import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function Welcome() {
  useEffect(() => {
    async function check() {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        window.location.href = createPageUrl('Dashboard');
      } else {
        base44.auth.redirectToLogin(createPageUrl('Dashboard'));
      }
    }
    check();
  }, []);

  return null;
}