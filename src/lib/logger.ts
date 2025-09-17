// Simple logger for DarkCanvas MVP
const log = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data ? data : '');
  },

  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error ? error : '');
  },

  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data ? data : '');
  }
};

export { log };