export const PUBLIC_AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export function isPublicAuthPath(path: string) {
  return PUBLIC_AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}
