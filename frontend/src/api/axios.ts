import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  withXSRFToken: true,
});

let unauthorizedRedirectInFlight = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const isAuthBootstrap = error.config?.url === '/auth/user';
    const isLoginRequest = error.config?.url === '/auth/login';

    if (
      error.response?.status === 401 &&
      !isAuthBootstrap &&
      !isLoginRequest &&
      window.location.pathname !== '/login' &&
      !unauthorizedRedirectInFlight
    ) {
      unauthorizedRedirectInFlight = true;
      window.dispatchEvent(new Event('auth:unauthorized'));
      window.location.assign(`/login?from=${encodeURIComponent(currentUrl)}`);
    }

    return Promise.reject(error);
  },
);

export default api;

export const getCsrfCookie = async (): Promise<void> => {
  await axios.get('/sanctum/csrf-cookie', {
    withCredentials: true,
    withXSRFToken: true,
  });
};
