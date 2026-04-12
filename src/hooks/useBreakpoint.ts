import { useState, useEffect } from 'react';

export type Breakpoint = 'sm' | 'md' | 'lg';

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    const w = window.innerWidth;
    if (w < 640) return 'sm';
    if (w < 1024) return 'md';
    return 'lg';
  });

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setBreakpoint(w < 640 ? 'sm' : w < 1024 ? 'md' : 'lg');
    };
    const mql = window.matchMedia('(min-width: 640px)');
    const mql2 = window.matchMedia('(min-width: 1024px)');
    mql.addEventListener('change', handler);
    mql2.addEventListener('change', handler);
    return () => {
      mql.removeEventListener('change', handler);
      mql2.removeEventListener('change', handler);
    };
  }, []);

  return breakpoint;
}
