/**
 * Storage Manager for WebCleaner
 * Handles saving and retrieving DOM paths, settings, and analytics.
 */
const StorageManager = {
   /**
    * Get all rules for a specific domain.
    * @param {string} domain
    * @returns {Promise<string[]>} List of DOM paths.
    */
   get: (domain) => {
      return new Promise((resolve, reject) => {
         chrome.storage.local.get([domain], (result) => {
            if (chrome.runtime.lastError)
               return reject(chrome.runtime.lastError);
            resolve(result[domain] || []);
         });
      });
   },

   /**
    * Add a new rule for a domain.
    * @param {string} domain
    * @param {string} domPath
    * @returns {Promise<void>}
    */
   add: (domain, domPath) => {
      return new Promise((resolve, reject) => {
         StorageManager.get(domain)
            .then((rules) => {
               if (!rules.includes(domPath)) {
                  rules.push(domPath);
                  chrome.storage.local.set({ [domain]: rules }, () => {
                     if (chrome.runtime.lastError)
                        return reject(chrome.runtime.lastError);
                     resolve();
                  });
               } else {
                  resolve();
               }
            })
            .catch(reject);
      });
   },

   /**
    * Remove a specific rule for a domain.
    * @param {string} domain
    * @param {string} domPath
    */
   removeRule: (domain, domPath) => {
      return new Promise((resolve, reject) => {
         StorageManager.get(domain)
            .then((rules) => {
               const newRules = rules.filter((r) => r !== domPath);
               chrome.storage.local.set({ [domain]: newRules }, () => {
                  if (chrome.runtime.lastError)
                     return reject(chrome.runtime.lastError);
                  resolve();
               });
            })
            .catch(reject);
      });
   },

   /**
    * Reset rules for a specific domain.
    * @param {string} domain
    * @returns {Promise<void>}
    */
   reset: (domain) => {
      return new Promise((resolve, reject) => {
         chrome.storage.local.remove(domain, () => {
            if (chrome.runtime.lastError)
               return reject(chrome.runtime.lastError);
            resolve();
         });
      });
   },

   /**
    * Reset all rules and settings.
    * @returns {Promise<void>}
    */
   resetAll: () => {
      return new Promise((resolve, reject) => {
         chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError)
               return reject(chrome.runtime.lastError);
            resolve();
         });
      });
   },

   /**
    * Get total count of cleaned sites.
    * @returns {Promise<number>}
    */
   getSiteCount: () => {
      return new Promise((resolve, reject) => {
         chrome.storage.local.get(null, (items) => {
            if (chrome.runtime.lastError)
               return reject(chrome.runtime.lastError);
            // Filter out settings keys
            const keys = Object.keys(items).filter(
               (k) => !k.startsWith("settings_") && !k.startsWith("stats_")
            );
            resolve(keys.length);
         });
      });
   },

   // --- Settings & Stats ---

   /**
    * Check if cleaning is disabled for a domain.
    * @param {string} domain
    * @returns {Promise<boolean>}
    */
   isSiteDisabled: (domain) => {
      return new Promise((resolve, reject) => {
         chrome.storage.local.get(["settings_disabled_sites"], (result) => {
            if (chrome.runtime.lastError)
               return reject(chrome.runtime.lastError);
            const disabled = result.settings_disabled_sites || [];
            resolve(disabled.includes(domain));
         });
      });
   },

   /**
    * Toggle disable status for a domain.
    * @param {string} domain
    * @param {boolean} disabled
    */
   setSiteDisabled: (domain, disabled) => {
      return new Promise((resolve, reject) => {
         chrome.storage.local.get(["settings_disabled_sites"], (result) => {
            let sites = result.settings_disabled_sites || [];
            if (disabled) {
               if (!sites.includes(domain)) sites.push(domain);
            } else {
               sites = sites.filter((d) => d !== domain);
            }
            chrome.storage.local.set({ settings_disabled_sites: sites }, () => {
               if (chrome.runtime.lastError)
                  return reject(chrome.runtime.lastError);
               resolve();
            });
         });
      });
   },

   /**
    * Increment total blurred elements count.
    * @param {number} count
    */
   incrementStats: (count) => {
      return new Promise((resolve) => {
         chrome.storage.local.get(["stats_total_blurred"], (result) => {
            const current = result.stats_total_blurred || 0;
            chrome.storage.local.set(
               { stats_total_blurred: current + count },
               () => resolve()
            );
         });
      });
   },

   /**
    * Get comprehensive statistics across all sites
    * @returns {Promise<Object>} Statistics object
    */
   getStats: () => {
      return new Promise((resolve) => {
         chrome.storage.local.get(null, (items) => {
            let totalBlurred = 0;
            let totalEnlarged = 0;
            let totalSites = 0;
            let totalRules = 0;

            Object.keys(items).forEach(key => {
               // Count blurred elements (rules for each domain)
               if (!key.startsWith('settings_') &&
                  !key.startsWith('stats_') &&
                  !key.startsWith('editmode_') &&
                  !key.startsWith('enlargemode_') &&
                  !key.startsWith('enlarged_') &&
                  !key.startsWith('preset_') &&
                  !key.startsWith('disabled_')) {

                  const rules = items[key];
                  if (Array.isArray(rules) && rules.length > 0) {
                     totalBlurred += rules.length;
                     totalRules += rules.length;
                     totalSites++;
                  }
               }

               // Count enlarged elements
               if (key.startsWith('enlarged_')) {
                  const enlargedElements = items[key];
                  if (Array.isArray(enlargedElements)) {
                     totalEnlarged += enlargedElements.length;
                  }
               }
            });

            resolve({
               totalBlurred,
               totalEnlarged,
               totalSites,
               totalRules
            });
         });
      });
   },

   // --- Preset Rules Management ---

   getPresetRules: (domain) => {
      return new Promise((resolve) => {
         chrome.storage.local.get([`preset_${domain}`], (result) => {
            const defaults = {
               removeImages: false,
               removeLinks: false,
               removeIcons: false,
               removeVideos: false,
               adultMode: false,
               educationMode: false,
            };
            resolve(result[`preset_${domain}`] || defaults);
         });
      });
   },

   setPresetRule: (domain, ruleName, enabled) => {
      return new Promise((resolve, reject) => {
         StorageManager.getPresetRules(domain)
            .then((rules) => {
               rules[ruleName] = enabled;
               chrome.storage.local.set({ [`preset_${domain}`]: rules }, () => {
                  if (chrome.runtime.lastError)
                     return reject(chrome.runtime.lastError);
                  resolve();
               });
            })
            .catch(reject);
      });
   },

   getAllDomains: () => {
      return new Promise((resolve) => {
         chrome.storage.local.get(null, (items) => {
            const domains = Object.keys(items).filter(
               (k) =>
                  !k.startsWith("settings_") &&
                  !k.startsWith("stats_") &&
                  !k.startsWith("preset_") &&
                  !k.startsWith("editmode_")
            );
            resolve(domains);
         });
      });
   },

   // --- Edit Mode State ---

   /**
    * Save edit mode state for a domain
    * @param {string} domain
    * @param {boolean} isActive
    */
   setEditModeState: (domain, isActive) => {
      return new Promise((resolve) => {
         chrome.storage.local.set({ [`editmode_${domain}`]: isActive }, () => {
            resolve();
         });
      });
   },

   /**
    * Get edit mode state for a domain
    * @param {string} domain
    * @returns {Promise<boolean>}
    */
   getEditModeState: (domain) => {
      return new Promise((resolve) => {
         chrome.storage.local.get([`editmode_${domain}`], (result) => {
            resolve(result[`editmode_${domain}`] || false);
         });
      });
   },

   /**
    * Get extension settings
    * @returns {Promise<object>}
    */
   getSettings: () => {
      return new Promise((resolve, reject) => {
         chrome.storage.local.get(["settings"], (result) => {
            if (chrome.runtime.lastError)
               return reject(chrome.runtime.lastError);
            resolve(result.settings || { adBlockerEnabled: true });
         });
      });
   },

   /**
    * Update extension settings
    * @param {object} settings
    * @returns {Promise<void>}
    */
   updateSettings: (settings) => {
      return new Promise((resolve, reject) => {
         chrome.storage.local.set({ settings }, () => {
            if (chrome.runtime.lastError)
               return reject(chrome.runtime.lastError);
            resolve();
         });
      });
   },

   // --- Enlarge Mode State ---

   /**
    * Save enlarge mode state for a domain
    * @param {string} domain
    * @param {boolean} isActive
    * @returns {Promise<void>}
    */
   setEnlargeModeState: (domain, isActive) => {
      return new Promise((resolve) => {
         chrome.storage.local.set({ [`enlargemode_${domain}`]: isActive }, () => {
            resolve();
         });
      });
   },

   /**
    * Get enlarge mode state for a domain
    * @param {string} domain
    * @returns {Promise<boolean>}
    */
   getEnlargeModeState: (domain) => {
      return new Promise((resolve) => {
         chrome.storage.local.get([`enlargemode_${domain}`], (result) => {
            resolve(result[`enlargemode_${domain}`] || false);
         });
      });
   },

   /**
    * Get enlarged elements for a domain
    * @param {string} domain
    * @returns {Promise<string[]>}
    */
   getEnlargedElements: (domain) => {
      return new Promise((resolve) => {
         chrome.storage.local.get([`enlarged_${domain}`], (result) => {
            resolve(result[`enlarged_${domain}`] || []);
         });
      });
   },

   /**
    * Reset enlarged elements for a domain
    * @param {string} domain
    * @returns {Promise<void>}
    */
   resetEnlargedElements: (domain) => {
      return new Promise((resolve) => {
         chrome.storage.local.remove([`enlarged_${domain}`], () => {
            resolve();
         });
      });
   },
};

if (typeof window !== "undefined") {
   window.StorageManager = StorageManager;
}
