import * as Sentry from '@sentry/react';

export const initFrontendSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: 'kiara-medicals-web@1.0.0',
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    });
    console.log('[Sentry] Initialized frontend error monitoring');
  }
};
