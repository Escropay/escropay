import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams || {};

if (!appId) {
  console.error('Base44 SDK: appId is not configured');
}

export const base44 = createClient({
  appId: appId || '',
  token: token || undefined,
  functionsVersion: functionsVersion || 'v1',
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl: appBaseUrl || ''
});