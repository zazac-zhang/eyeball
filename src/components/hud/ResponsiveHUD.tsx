import { useState, type ReactNode } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

/**
 * HUDPanel: responsive wrapper for HUD panels.
 * - Desktop: renders children inline
 * - Mobile: renders as a collapsible bottom sheet
 */
export function HUDPanel({
  children,
  title,
  defaultOpen = true,
}: {
  children: ReactNode;
  title: string;
  defaultOpen?: boolean;
}) {
  const bp = useBreakpoint();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isMobile = bp === 'sm';

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="pointer-events-auto">
      <button
        onClick={() => { setIsOpen(!isOpen); }}
        className="flex w-full items-center justify-between rounded-t-lg border border-blue-500/30 bg-gray-950/90 px-3 py-2 text-xs font-semibold tracking-wider text-blue-400 uppercase backdrop-blur"
      >
        <span>{title}</span>
        <span className="text-blue-300/60">{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && (
        <div className="border-x border-b border-blue-500/30 bg-gray-950/90 backdrop-blur">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * HUDLayout: responsive layout for HUD panels.
 * - Desktop: fixed corner positions
 * - Mobile: stacked bottom drawer
 */
export function HUDLayout({
  topLeft,
  topRight,
  bottomRight,
  bottomLeft,
}: {
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomRight?: ReactNode;
  bottomLeft?: ReactNode;
}) {
  const bp = useBreakpoint();
  const isMobile = bp === 'sm';
  const isTablet = bp === 'md';

  if (isMobile) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-2">
        {bottomLeft}
        {bottomRight}
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="max-w-[45%]">{topLeft}</div>
          <div className="max-w-[45%]">{topRight}</div>
        </div>
        <div className="flex justify-end">{bottomRight}</div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
      <div className="flex items-start justify-between">
        {topLeft}
        {topRight}
      </div>
      <div className="flex justify-end">{bottomRight}</div>
    </div>
  );
}
