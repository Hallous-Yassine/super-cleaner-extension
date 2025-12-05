try {
   importScripts("../utils/logger.js", "../storage/storageManager.js");
} catch (e) {
   console.error(e);
}

Logger.log("Background script loaded.");

chrome.runtime.onInstalled.addListener(() => {
   Logger.log("SuperCleaner installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   Logger.log("Received message:", message);

   const { action, payload } = message;

   if (action === "SAVE_RULE") {
      const { domain, domPath } = payload;
      StorageManager.add(domain, domPath)
         .then(() => {
            Logger.log(`Rule saved for ${domain}: ${domPath}`);

            // Increment global stats
            StorageManager.incrementStats(1);

            sendResponse({ success: true });

            // Notify the tab to apply the rule immediately if not already handled
            if (sender.tab && sender.tab.id) {
               chrome.tabs.sendMessage(sender.tab.id, {
                  action: "RULE_ADDED",
                  payload: { domPath },
               });
            }
         })
         .catch((err) => {
            Logger.error("Error saving rule:", err);
            sendResponse({ success: false, error: err.message });
         });
      return true; // Keep channel open for async response
   }

   if (action === "GET_RULES") {
      const { domain } = payload;
      StorageManager.get(domain)
         .then((rules) => {
            sendResponse({ success: true, rules });
         })
         .catch((err) => {
            sendResponse({ success: false, error: err.message });
         });
      return true;
   }

   if (action === "UPDATE_BADGE") {
      const { count } = payload;
      if (count > 0 && sender.tab && sender.tab.id) {
         chrome.action.setBadgeText({
            text: count.toString(),
            tabId: sender.tab.id,
         });
         chrome.action.setBadgeBackgroundColor({
            color: "#DC2626",
            tabId: sender.tab.id,
         });
      }
      sendResponse({ success: true });
      return true;
   }

   if (action === "SAVE_ENLARGEMENT") {
      const { domain, domPath } = payload;
      const key = `enlarged_${domain}`;

      chrome.storage.local.get([key], (result) => {
         const enlargements = result[key] || [];
         if (!enlargements.includes(domPath)) {
            enlargements.push(domPath);
            chrome.storage.local.set({ [key]: enlargements }, () => {
               Logger.log(`Enlargement saved for ${domain}: ${domPath}`);
               sendResponse({ success: true });
            });
         } else {
            sendResponse({ success: true });
         }
      });
      return true;
   }

   if (action === "REMOVE_ENLARGEMENT") {
      const { domain, domPath } = payload;
      const key = `enlarged_${domain}`;

      chrome.storage.local.get([key], (result) => {
         let enlargements = result[key] || [];
         enlargements = enlargements.filter((p) => p !== domPath);
         chrome.storage.local.set({ [key]: enlargements }, () => {
            Logger.log(`Enlargement removed for ${domain}: ${domPath}`);
            sendResponse({ success: true });
         });
      });
      return true;
   }

   if (action === "RESET_ENLARGEMENTS") {
      const { domain } = payload;
      const key = `enlarged_${domain}`;

      chrome.storage.local.remove([key], () => {
         Logger.log(`All enlargements reset for ${domain}`);
         sendResponse({ success: true });
      });
      return true;
   }
});
