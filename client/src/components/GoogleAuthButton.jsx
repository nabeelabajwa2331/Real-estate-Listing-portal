import { useEffect, useRef, useState } from 'react';
import api from '../api/axios.js';

const SCRIPT_ID = 'google-identity-services';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const CONFIG_MESSAGE =
  "Google sign-in is not configured. Add GOOGLE_CLIENT_ID to the server environment and add this site to the OAuth client's Authorized JavaScript origins in Google Cloud.";

let scriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const timer = setTimeout(() => reject(new Error('Google script timed out')), 12000);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const fail = () => {
      clearTimeout(timer);
      reject(new Error('Google script failed to load'));
    };

    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', fail, { once: true });
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.2 5.2C36.9 40.3 44 35 44 24c0-1.3-.1-2.3-.4-3.5z"
    />
  </svg>
);

export default function GoogleAuthButton({ onCredential, onError, divider }) {
  const hostRef = useRef(null);
  const credentialRef = useRef(onCredential);
  const errorRef = useRef(onError);
  const envClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const [clientId, setClientId] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);

  credentialRef.current = onCredential;
  errorRef.current = onError;

  useEffect(() => {
    let active = true;

    api
      .get('/auth/google/config', { timeout: 60000 })
      .then(({ data }) => {
        if (!active) return;
        setClientId(String(data?.clientId || '').trim());
      })
      .catch(() => {
        if (active) setClientId(envClientId);
      })
      .finally(() => {
        if (active) setLoadingConfig(false);
      });

    return () => {
      active = false;
    };
  }, [envClientId]);

  useEffect(() => {
    if (loadingConfig || !clientId) return undefined;

    let cancelled = false;
    let resizeTimer;
    let renderCheckTimer;

    const renderButton = () => {
      const host = hostRef.current;
      if (cancelled || !host) return;
      if (!window.google?.accounts?.id) {
        errorRef.current?.(
          'Google sign-in could not start. Check the OAuth client configuration and Authorized JavaScript origins.'
        );
        return;
      }

      const width = Math.min(Math.max(host.clientWidth || 320, 220), 400);
      host.innerHTML = '';
      window.google.accounts.id.renderButton(host, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width,
      });

      clearTimeout(renderCheckTimer);
      renderCheckTimer = setTimeout(() => {
        if (!cancelled && host.childElementCount === 0) {
          errorRef.current?.(
            'Google sign-in could not start. Check that this site is listed under Authorized JavaScript origins for the OAuth client.'
          );
        }
      }, 1200);
    };

    const start = () => {
      if (cancelled || !window.google?.accounts?.id) {
        errorRef.current?.(
          'Google sign-in could not start. Check the OAuth client configuration and Authorized JavaScript origins.'
        );
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) credentialRef.current?.(response.credential);
          else errorRef.current?.('Google sign-in was cancelled. Please try again.');
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'popup',
      });

      renderButton();
    };

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderButton, 150);
    };

    loadGoogleScript()
      .then(start)
      .catch(() => {
        if (cancelled) return;
        errorRef.current?.(
          window.google?.accounts?.id
            ? 'Google sign-in could not start. Check the OAuth client configuration and Authorized JavaScript origins.'
            : 'Google sign-in could not load. Check your connection and try again.'
        );
      });

    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      clearTimeout(renderCheckTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [clientId, loadingConfig]);

  const withDivider = (content) => (
    <>
      {content}
      {divider && (
        <div className="auth-divider">
          <span>{divider}</span>
        </div>
      )}
    </>
  );

  if (loadingConfig) {
    return withDivider(
      <button type="button" className="btn google-btn" disabled>
        <GoogleIcon />
        Checking Google…
      </button>
    );
  }

  if (!clientId) {
    if (import.meta.env.DEV) console.info(CONFIG_MESSAGE);
    return null;
  }

  return withDivider(<div className="google-auth" ref={hostRef} aria-label="Continue with Google" />);
}
