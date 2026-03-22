export function createPageUrl(pageName: string) {
    if (!pageName || typeof pageName !== 'string') return '/';
    return '/' + pageName.trim().replace(/ /g, '-').toLowerCase();
}