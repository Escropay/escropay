import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function Welcome() {
  useEffect(() => {
    window.location.replace('/' + createPageUrl('Home'));
  }, []);

  return null;
}