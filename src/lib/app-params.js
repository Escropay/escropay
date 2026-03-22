const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	if (!paramName || typeof paramName !== 'string') {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	try {
		const urlParams = new URLSearchParams(window?.location?.search || '');
		const searchParam = urlParams.get(paramName);
		if (removeFromUrl && urlParams) {
			urlParams.delete(paramName);
			const newUrl = `${window?.location?.pathname || ''}${urlParams.toString() ? `?${urlParams.toString()}` : ''}${window?.location?.hash || ''}`;
			window?.history?.replaceState({}, document?.title || '', newUrl);
		}
		if (searchParam) {
			storage?.setItem(storageKey, searchParam);
			return searchParam;
		}
		const storedValue = storage?.getItem(storageKey);
		if (storedValue) {
			return storedValue;
		}
	} catch (e) {
		console.error('Error accessing URL params:', e?.message);
	}
	if (defaultValue) {
		storage?.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	return null;
}

const getAppParams = () => {
	try {
		if (getAppParamValue("clear_access_token") === 'true') {
			storage?.removeItem('base44_access_token');
			storage?.removeItem('token');
		}
		return {
			appId: getAppParamValue("app_id", { defaultValue: import.meta?.env?.VITE_BASE44_APP_ID || '' }),
			token: getAppParamValue("access_token", { removeFromUrl: true }),
			fromUrl: getAppParamValue("from_url", { defaultValue: typeof window !== 'undefined' ? window.location.href : '' }),
			functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta?.env?.VITE_BASE44_FUNCTIONS_VERSION || 'v1' }),
			appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta?.env?.VITE_BASE44_APP_BASE_URL || '' }),
		};
	} catch (e) {
		console.error('Error getting app params:', e?.message);
		return {
			appId: import.meta?.env?.VITE_BASE44_APP_ID || '',
			token: null,
			fromUrl: typeof window !== 'undefined' ? window.location.href : '',
			functionsVersion: 'v1',
			appBaseUrl: '',
		};
	}
}


export const appParams = {
	...getAppParams()
}