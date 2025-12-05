/**
 * Logger utility for WebCleaner
 * Provides consistent logging with prefixes and toggleable debug mode.
 */
const Logger = {
  prefix: '[WebCleaner] ',
  debugMode: true, // Set to false in production if needed

  log: (...args) => {
    if (Logger.debugMode) {
      console.log(Logger.prefix, ...args);
    }
  },

  warn: (...args) => {
    console.warn(Logger.prefix, ...args);
  },

  error: (...args) => {
    console.error(Logger.prefix, ...args);
  }
};

// Expose globally if running in a non-module environment (like content scripts without modules)
if (typeof window !== 'undefined') {
  window.Logger = Logger;
}
// Also support module export if needed later
if (typeof module !== 'undefined') {
  module.exports = Logger;
}
