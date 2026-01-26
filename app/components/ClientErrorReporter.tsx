"use client";

import { useEffect } from 'react';

export default function ClientErrorReporter() {
  useEffect(() => {
    // helper to POST errors to server
    const send = async (payload: any) => {
      try {
        await fetch('/api/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        // swallow - best effort
        // eslint-disable-next-line no-console
        console.warn('ClientErrorReporter: failed to send error', e);
      }
    };

    const originalConsoleError = console.error.bind(console);
    console.error = (...args: any[]) => {
      try {
        const payload: any = { type: 'console.error', args };
        // If React's maximum update depth error appears, capture a JS stack for better tracing
        if (args && args.length && typeof args[0] === 'string' && args[0].includes('Maximum update depth exceeded')) {
          payload.stack = new Error().stack;
        }
        send(payload);
      } catch (_) {}
      originalConsoleError(...args);
    };

    window.addEventListener('error', (event) => {
      send({ type: 'window.error', message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno, error: (event.error && event.error.stack) || null });
    });

    window.addEventListener('unhandledrejection', (event) => {
      send({ type: 'unhandledrejection', reason: event.reason });
    });

    return () => {
  // restore console.error (best effort)
  // assign via `any` to avoid strict typing issues
  (console as any).error = originalConsoleError;
    };
  }, []);

  return null;
}
