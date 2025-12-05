/**
 * Hider Module
 * Applies blur rules on page load and dynamically using MutationObserver.
 */
const Hider = {
   observer: null,
   rules: [],
   isDisabled: false,
   debounceTimer: null,

   init: async () => {
      Logger.log("Hider initialized");
      const domain = window.location.hostname;

      try {
         Hider.isDisabled = await StorageManager.isSiteDisabled(domain);
         if (Hider.isDisabled) {
            Logger.log("Cleaning disabled for this site.");
            return;
         }

         Hider.rules = await StorageManager.get(domain);
         if (Hider.rules.length > 0) {
            Hider.applyRules();
            Hider.startObserver();
         }
      } catch (e) {
         Logger.error("Hider init error:", e);
      }
   },

   applyRules: () => {
      if (Hider.isDisabled || Hider.rules.length === 0) return;

      let appliedCount = 0;
      const invalidSelectors = [];

      Hider.rules.forEach((selector) => {
         try {
            const elements = document.querySelectorAll(selector);

            if (elements.length === 0) {
               Logger.warn("No elements found for selector:", selector);
               invalidSelectors.push(selector);
               return;
            }

            elements.forEach((el) => {
               // Skip if already hidden
               if (el.classList.contains("webcleaner-hidden")) {
                  return;
               }

               // Skip if parent is already hidden (prevent nested blur)
               if (Hider.hasHiddenParent(el)) {
                  return;
               }

               // Skip if element contains already hidden children (prevent double blur)
               if (el.querySelector(".webcleaner-hidden")) {
                  return;
               }

               // Skip if element is not visible
               const rect = el.getBoundingClientRect();
               if (rect.width === 0 && rect.height === 0) {
                  return;
               }

               // Add class
               el.classList.add("webcleaner-hidden");

               // Force inline styles with !important to override any existing styles
               el.style.setProperty("filter", "blur(8px)", "important");
               el.style.setProperty("pointer-events", "none", "important");
               el.style.setProperty("user-select", "none", "important");

               // For inline elements, force them to be block-level for blur to work
               const display = window.getComputedStyle(el).display;
               if (display === "inline" || display === "inline-block") {
                  el.style.setProperty("display", "inline-block", "important");
               }

               appliedCount++;
            });
         } catch (e) {
            // Invalid selector
            Logger.warn("Invalid selector:", selector, e);
            invalidSelectors.push(selector);
         }
      });

      // Remove invalid selectors from storage
      if (invalidSelectors.length > 0) {
         Logger.warn(`Removing ${invalidSelectors.length} invalid selectors`);
         const domain = window.location.hostname;
         invalidSelectors.forEach((selector) => {
            StorageManager.removeRule(domain, selector);
         });
      }

      if (appliedCount > 0) {
         Logger.log(`Applied ${appliedCount} hiding rules`);
      }
   },

   /**
    * Check if element has a hidden parent
    */
   hasHiddenParent: (element) => {
      let parent = element.parentElement;
      while (parent) {
         if (parent.classList.contains("webcleaner-hidden")) {
            return true;
         }
         parent = parent.parentElement;
      }
      return false;
   },

   startObserver: () => {
      if (Hider.observer) return;

      Hider.observer = new MutationObserver((mutations) => {
         if (Hider.debounceTimer) clearTimeout(Hider.debounceTimer);
         Hider.debounceTimer = setTimeout(() => {
            Hider.applyRules();
         }, 200); // Debounce 200ms
      });

      Hider.observer.observe(document.body, {
         childList: true,
         subtree: true,
      });
   },

   stopObserver: () => {
      if (Hider.observer) {
         Hider.observer.disconnect();
         Hider.observer = null;
      }
   },

   hideElement: (element) => {
      if (!element) return;

      // Don't hide if already hidden
      if (element.classList.contains("webcleaner-hidden")) return;

      // Don't hide if parent is hidden
      if (Hider.hasHiddenParent(element)) return;

      // Don't hide if contains hidden children
      if (element.querySelector(".webcleaner-hidden")) return;

      // Add class
      element.classList.add("webcleaner-hidden");

      // Force inline styles with !important
      element.style.setProperty("filter", "blur(8px)", "important");
      element.style.setProperty("pointer-events", "none", "important");
      element.style.setProperty("user-select", "none", "important");

      // For inline elements, force them to be block-level
      const display = window.getComputedStyle(element).display;
      if (display === "inline" || display === "inline-block") {
         element.style.setProperty("display", "inline-block", "important");
      }
   },

   unhideAll: () => {
      const hidden = document.querySelectorAll(".webcleaner-hidden");
      hidden.forEach((el) => {
         el.classList.remove("webcleaner-hidden");
         // Remove inline styles
         el.style.removeProperty("filter");
         el.style.removeProperty("pointer-events");
         el.style.removeProperty("user-select");
         el.style.removeProperty("display");
      });
   },

   refresh: async () => {
      Hider.unhideAll();
      Hider.stopObserver();
      await Hider.init();
   },
};

// Listen for rule updates and toggle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message.action === "RULE_ADDED") {
      Hider.rules.push(message.payload.domPath);
      Hider.hideBySelector(message.payload.domPath);
      sendResponse({ success: true });
      return true;
   }
   if (message.action === "RESET_SITE") {
      Hider.unhideAll();
      Hider.rules = [];

      // Also reset enlargements
      if (window.Enlarger) {
         const domain = window.location.hostname;
         // Reset enlarged elements visually
         document.querySelectorAll(".webcleaner-enlarged").forEach((el) => {
            el.classList.remove("webcleaner-enlarged");
            // Remove all enlargement styles
            el.style.width = "";
            el.style.height = "";
            el.style.fontSize = "";
            el.style.lineHeight = "";
            el.style.padding = "";
            el.style.maxWidth = "";
            el.style.maxHeight = "";
            el.style.minWidth = "";
            el.style.minHeight = "";
            el.style.fontWeight = "";
            el.style.border = "";
            el.style.borderRadius = "";
            el.style.backgroundColor = "";
            el.style.boxShadow = "";
            el.style.outline = "";
            el.style.outlineOffset = "";
            el.style.zIndex = "";
            el.style.position = "";
            el.style.margin = "";
            el.style.transition = "";
            el.style.display = "";
            // Remove data attributes
            el.removeAttribute("data-original-width");
            el.removeAttribute("data-original-height");
            el.removeAttribute("data-original-fontsize");
            el.removeAttribute("data-original-lineheight");
            el.removeAttribute("data-original-padding");
            el.removeAttribute("data-original-maxwidth");
            el.removeAttribute("data-original-maxheight");
         });

         // Reset storage
         chrome.runtime.sendMessage({
            action: "RESET_ENLARGEMENTS",
            payload: { domain }
         }).catch(() => { });

         // Clear local array
         if (Enlarger.enlargedElements) {
            Enlarger.enlargedElements = [];
         }
      }

      sendResponse({ success: true });
      return true;
   }
   if (message.action === "TOGGLE_SITE") {
      Hider.refresh();
      sendResponse({ success: true });
      return true;
   }
});

// Helper for single selector (used by RULE_ADDED)
Hider.hideBySelector = (selector) => {
   try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => Hider.hideElement(el));
   } catch (e) { }
};

// Run on load
if (document.readyState === "loading") {
   document.addEventListener("DOMContentLoaded", Hider.init);
} else {
   Hider.init();
}

if (typeof window !== "undefined") {
   window.Hider = Hider;
}
