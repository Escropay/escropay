export function createPageUrl(pageName?: string | null): string {
    if (!pageName || typeof pageName !== 'string') return '/';
    const trimmed = pageName.trim();
    if (!trimmed) return '/';
    return '/' + trimmed.replace(/\s+/g, '-').toLowerCase();
}