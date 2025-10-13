// BUGFIX S5.1: Disable console logs in production to prevent sensitive data leaks

const isDevelopment = process.env.NODE_ENV === 'development';

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

// Create safe logger that only works in development
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      originalConsole.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      originalConsole.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors (but sanitize sensitive data in production)
    if (isDevelopment) {
      originalConsole.error(...args);
    } else {
      // In production, log error message only (no stack traces or sensitive data)
      const sanitized = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return arg.message;
        return '[Object]';
      });
      originalConsole.error(...sanitized);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      originalConsole.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      originalConsole.debug(...args);
    }
  },
};

// Override global console in production
export const disableConsoleInProduction = () => {
  if (!isDevelopment) {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.warn = () => {};
    // Keep console.error but sanitize it
    console.error = logger.error;

    // Log that console has been disabled
    originalConsole.info('Console logging disabled in production');
  }
};

// Auto-run on import
// TEMPORARILY DISABLED: Keep console.log enabled in production for pre-launch debugging
// TODO: Re-enable before public launch to prevent sensitive data leaks
// disableConsoleInProduction();

export default logger;
