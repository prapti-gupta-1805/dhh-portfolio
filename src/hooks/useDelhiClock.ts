import { useEffect, useState } from 'react';

const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });

/** Live HH:MM in Delhi, refreshed every 15s. */
export function useDelhiClock(): string {
  const [now, setNow] = useState(() => fmt.format(new Date()));
  useEffect(() => {
    const t = window.setInterval(() => setNow(fmt.format(new Date())), 15000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}
