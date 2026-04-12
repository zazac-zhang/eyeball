import { useRef, useCallback } from 'react';

export type LogEntry = {
  timestamp: number;
  action: string;
  details?: Record<string, unknown>;
};

const MAX_LOG_ENTRIES = 500;

class ActionLogger {
  private entries: LogEntry[] = [];

  log(action: string, details?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      action,
      details,
    };
    this.entries.push(entry);
    if (this.entries.length > MAX_LOG_ENTRIES) {
      this.entries.shift();
    }
    // eslint-disable-next-line no-console
    console.log(
      `[Action] %c${action}`,
      'color: #4488ff; font-weight: bold',
      details ? details : ''
    );
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
  }

  exportJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }
}

const globalLogger = new ActionLogger();

export function useActionLogger() {
  const loggerRef = useRef(globalLogger);

  const log = useCallback((action: string, details?: Record<string, unknown>) => {
    loggerRef.current.log(action, details);
  }, []);

  const getLog = useCallback(() => loggerRef.current.getEntries(), []);
  const clearLog = useCallback(() => loggerRef.current.clear(), []);
  const exportLog = useCallback(() => loggerRef.current.exportJSON(), []);

  return { log, getLog, clearLog, exportLog };
}
