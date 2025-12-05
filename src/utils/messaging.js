/**
 * Messaging utility for WebCleaner
 * Wraps chrome.runtime and chrome.tabs messaging APIs.
 */
const Messaging = {
   /**
    * Send a message to the background script or other extension parts.
    * @param {string} action - The action identifier.
    * @param {any} payload - Data to send.
    * @returns {Promise<any>} - Response from the receiver.
    */
   sendToBackground: (action, payload = {}) => {
      return new Promise((resolve, reject) => {
         try {
            chrome.runtime.sendMessage({ action, payload }, (response) => {
               if (chrome.runtime.lastError) {
                  Logger.error("Messaging error:", chrome.runtime.lastError);
                  reject(chrome.runtime.lastError);
               } else {
                  resolve(response);
               }
            });
         } catch (e) {
            Logger.error("Messaging exception:", e);
            reject(e);
         }
      });
   },

   /**
    * Send a message to a specific tab (content script).
    * @param {number} tabId - The ID of the tab.
    * @param {string} action - The action identifier.
    * @param {any} payload - Data to send.
    * @returns {Promise<any>} - Response from the content script.
    */
   sendToTab: (tabId, action, payload = {}) => {
      return new Promise((resolve) => {
         try {
            chrome.tabs.sendMessage(tabId, { action, payload }, (response) => {
               if (chrome.runtime.lastError) {
                  // Silently fail - tab might not have content scripts loaded
                  resolve(null);
               } else {
                  resolve(response);
               }
            });
         } catch (e) {
            // Silently fail for messaging errors
            resolve(null);
         }
      });
   },
};

if (typeof window !== "undefined") {
   window.Messaging = Messaging;
}
