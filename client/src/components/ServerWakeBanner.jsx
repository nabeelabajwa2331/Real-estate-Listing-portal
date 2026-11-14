import { useEffect } from 'react';
import { useServerStatusStore } from '../store/serverStatusStore.js';

const RECOVERED_MS = 3000;

// Friendly notice shown while the free-tier API host is waking from sleep.
export default function ServerWakeBanner() {
  const waking = useServerStatusStore((s) => s.slowRequests > 0);
  const recovered = useServerStatusStore((s) => s.recovered);
  const dismiss = useServerStatusStore((s) => s.dismiss);

  useEffect(() => {
    if (!recovered) return undefined;
    const timer = setTimeout(dismiss, RECOVERED_MS);
    return () => clearTimeout(timer);
  }, [recovered, dismiss]);

  if (!waking && !recovered) return null;

  return (
    <div className={waking ? 'wake-banner' : 'wake-banner wake-banner-ok'} role="status" aria-live="polite">
      {waking ? (
        <>
          <span className="spinner" aria-hidden="true" />
          <span>
            Waking up the server. The first load after a quiet period can take up to a minute.
          </span>
        </>
      ) : (
        <span>Connected. Thanks for waiting.</span>
      )}
    </div>
  );
}
