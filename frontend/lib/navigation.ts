/**
 * Navigation utilities for Next.js routing
 */

export function createPageUrl(pageName: string): string {
  const routes: Record<string, string> = {
    'Home': '/home',
    'Dashboard': '/dashboard',
    'Upload': '/upload',
    'Configure': '/configure',
    'Results': '/results',
  };
  
  return routes[pageName] || '/home';
}

export function getPageNameFromPath(pathname: string): string {
  const pathToName: Record<string, string> = {
    '/home': 'Home',
    '/dashboard': 'Dashboard',
    '/upload': 'Upload',
    '/configure': 'Configure',
    '/results': 'Results',
  };
  
  return pathToName[pathname] || 'Home';
}
