/**
 * Ad Blocker Module
 * Blocks ads using multiple techniques:
 * 1. CSS-based hiding (instant)
 * 2. DOM element detection and removal
 * 3. Network request blocking
 */
const AdBlocker = {
   isEnabled: true,
   blockedCount: 0,
   observer: null,
   networkBlockingSetup: false,

   // Common ad selectors (EasyList style)
   AD_SELECTORS: [
      // Google Ads
      "ins.adsbygoogle",
      'iframe[src*="googlesyndication"]',
      'iframe[src*="doubleclick.net"]',
      'div[id*="google_ads"]',
      'div[class*="google-ad"]',

      // Generic ad containers
      'div[id*="ad-"]',
      'div[id*="-ad-"]',
      'div[id*="_ad_"]',
      'div[class*="ad-container"]',
      'div[class*="ad_container"]',
      'div[class*="advertisement"]',
      'div[class*="ad-banner"]',
      'div[class*="adsbanner"]',
      'div[id^="div-gpt-ad"]',

      // Data attributes
      "[data-ad-slot]",
      "[data-ad-unit]",
      "[data-advertisement]",
      "[data-ad-name]",

      // Taboola, Outbrain
      'div[id*="taboola"]',
      'div[class*="taboola"]',
      'div[id*="outbrain"]',
      'div[class*="outbrain"]',

      // Video ads
      'div[class*="video-ad"]',
      'div[id*="video-ad"]',

      // Sidebar ads
      'aside[class*="ad"]',
      'aside[id*="ad"]',

      // Sponsored content
      '[class*="sponsored"]',
      '[id*="sponsored"]',

      // Amazon ads
      'iframe[src*="amazon-adsystem"]',

      // Common ad networks
      'iframe[src*="adnxs.com"]',
      'iframe[src*="advertising.com"]',
      'iframe[src*="adsrvr.org"]',
      'iframe[src*="adform.net"]',
      'iframe[src*="criteo.com"]',
   ],

   // Ad URL patterns for network blocking
   AD_URL_PATTERNS: [
      "googlesyndication.com",
      "doubleclick.net",
      "googleadservices.com",
      "google-analytics.com",
      "googletagmanager.com",
      "amazon-adsystem.com",
      "advertising.com",
      "adnxs.com",
      "adsrvr.org",
      "adform.net",
      "criteo.com",
      "taboola.com",
      "outbrain.com",
      "scorecardresearch.com",
   ],

   init: async () => {
      Logger.log("AdBlocker initialized");

      // Check if ad blocking is enabled
      const settings = await StorageManager.getSettings();
      AdBlocker.isEnabled = settings?.adBlockerEnabled !== false;

      if (!AdBlocker.isEnabled) {
         Logger.log("Ad Blocker is disabled");
         return;
      }

      // Apply instant CSS hiding
      AdBlocker.injectBlockingCSS();

      // Block existing ads
      AdBlocker.blockAds();

      // Watch for new ads
      AdBlocker.startObserver();

      // Setup network blocking
      AdBlocker.setupNetworkBlocking();
   },

   injectBlockingCSS: () => {
      const style = document.createElement("style");
      style.id = "webcleaner-adblock-css";
      style.textContent = AdBlocker.AD_SELECTORS.map(
         (selector) =>
            `${selector} { 
                display: none !important; 
                visibility: hidden !important; 
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                overflow: hidden !important;
            }`
      ).join("\n");

      const inject = () => {
         if (
            document.head &&
            !document.getElementById("webcleaner-adblock-css")
         ) {
            document.head.appendChild(style);
         }
      };

      if (document.head) {
         inject();
      } else {
         const observer = new MutationObserver(() => {
            if (document.head) {
               inject();
               observer.disconnect();
            }
         });
         observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
         });
      }
   },

   removeBlockingCSS: () => {
      const style = document.getElementById("webcleaner-adblock-css");
      if (style) {
         style.remove();
      }
   },

   unhideAds: () => {
      const blockedElements = document.querySelectorAll(
         '[data-adblocked="true"]'
      );
      blockedElements.forEach((el) => {
         el.removeAttribute("data-adblocked");
         el.style.removeProperty("display");
         el.style.removeProperty("visibility");
         el.style.removeProperty("opacity");
         el.style.removeProperty("height");
         el.style.removeProperty("width");
         el.style.removeProperty("max-height");
         el.style.removeProperty("max-width");
         el.style.removeProperty("margin");
         el.style.removeProperty("padding");
         el.style.removeProperty("border");
         el.style.removeProperty("overflow");
         el.style.removeProperty("pointer-events");
      });
      Logger.log("Restored all blocked ads");
   },

   blockAds: () => {
      if (!document.body) return;

      let blocked = 0;

      AdBlocker.AD_SELECTORS.forEach((selector) => {
         try {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
               if (!el.hasAttribute("data-adblocked")) {
                  AdBlocker.removeElement(el);
                  blocked++;
               }
            });
         } catch (e) {
            // Silently skip invalid selectors
         }
      });

      // Heuristic detection
      blocked += AdBlocker.detectByHeuristics();

      if (blocked > 0) {
         AdBlocker.blockedCount += blocked;
         Logger.log(
            `Blocked ${blocked} ads (Total: ${AdBlocker.blockedCount})`
         );
         AdBlocker.updateBadge();
      }
   },

   detectByHeuristics: () => {
      if (!document.body) return 0;

      let blocked = 0;
      const allElements = document.querySelectorAll(
         "div, aside, section, iframe"
      );

      allElements.forEach((el) => {
         if (el.hasAttribute("data-adblocked")) return;

         let adScore = 0;
         const id = (el.id || "").toLowerCase();
         const className = (el.className || "").toLowerCase();
         const attrs = Array.from(el.attributes)
            .map((a) => a.name.toLowerCase())
            .join(" ");

         // Score based on attributes
         if (
            id.includes("ad") ||
            id.includes("banner") ||
            id.includes("sponsor")
         )
            adScore += 2;
         if (
            className.includes("ad") ||
            className.includes("banner") ||
            className.includes("sponsor")
         )
            adScore += 2;
         if (attrs.includes("data-ad")) adScore += 3;

         // Check iframe sources
         if (el.tagName === "IFRAME") {
            const src = (el.src || "").toLowerCase();
            if (
               AdBlocker.AD_URL_PATTERNS.some((pattern) =>
                  src.includes(pattern)
               )
            ) {
               adScore += 5;
            }
         }

         // High confidence threshold
         if (adScore >= 4) {
            AdBlocker.removeElement(el);
            blocked++;
         }
      });

      return blocked;
   },

   removeElement: (element) => {
      if (!element || element.hasAttribute("data-adblocked")) return;

      element.setAttribute("data-adblocked", "true");

      // Completely collapse and hide (keep in DOM for unhide)
      element.style.setProperty("display", "none", "important");
      element.style.setProperty("visibility", "hidden", "important");
      element.style.setProperty("opacity", "0", "important");
      element.style.setProperty("height", "0", "important");
      element.style.setProperty("width", "0", "important");
      element.style.setProperty("max-height", "0", "important");
      element.style.setProperty("max-width", "0", "important");
      element.style.setProperty("margin", "0", "important");
      element.style.setProperty("padding", "0", "important");
      element.style.setProperty("border", "none", "important");
      element.style.setProperty("overflow", "hidden", "important");
      element.style.setProperty("pointer-events", "none", "important");
   },

   startObserver: () => {
      if (AdBlocker.observer) return;
      if (!document.documentElement) return;

      AdBlocker.observer = new MutationObserver((mutations) => {
         let needsCheck = false;

         for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
               needsCheck = true;
               break;
            }
         }

         if (needsCheck) {
            AdBlocker.blockAds();
         }
      });

      AdBlocker.observer.observe(document.documentElement, {
         childList: true,
         subtree: true,
      });
   },

   stopObserver: () => {
      if (AdBlocker.observer) {
         AdBlocker.observer.disconnect();
         AdBlocker.observer = null;
      }
   },

   setupNetworkBlocking: () => {
      if (AdBlocker.networkBlockingSetup) return;
      AdBlocker.networkBlockingSetup = true;

      // Block XHR requests
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url, ...rest) {
         if (AdBlocker.isEnabled && AdBlocker.shouldBlockURL(url)) {
            Logger.log("Blocked XHR request:", url);
            AdBlocker.blockedCount++;
            AdBlocker.updateBadge();
            return;
         }
         return originalOpen.call(this, method, url, ...rest);
      };

      // Block fetch requests
      const originalFetch = window.fetch;
      window.fetch = function (resource, ...rest) {
         const url = typeof resource === "string" ? resource : resource.url;
         if (AdBlocker.isEnabled && AdBlocker.shouldBlockURL(url)) {
            Logger.log("Blocked fetch request:", url);
            AdBlocker.blockedCount++;
            AdBlocker.updateBadge();
            return Promise.reject(new Error("Blocked by AdBlocker"));
         }
         return originalFetch.call(this, resource, ...rest);
      };
   },

   shouldBlockURL: (url) => {
      if (!url || !AdBlocker.isEnabled) return false;
      const urlLower = url.toLowerCase();
      return AdBlocker.AD_URL_PATTERNS.some((pattern) =>
         urlLower.includes(pattern)
      );
   },

   updateBadge: () => {
      chrome.runtime
         .sendMessage({
            action: "UPDATE_BADGE",
            payload: { count: AdBlocker.blockedCount },
         })
         .catch(() => {});
   },

   toggle: async (enabled) => {
      AdBlocker.isEnabled = enabled;

      // Save setting
      const settings = await StorageManager.getSettings();
      settings.adBlockerEnabled = enabled;
      await StorageManager.updateSettings(settings);

      if (enabled) {
         Logger.log("Ad Blocker enabled");
         AdBlocker.injectBlockingCSS();
         AdBlocker.blockAds();
         AdBlocker.startObserver();
         if (!AdBlocker.networkBlockingSetup) {
            AdBlocker.setupNetworkBlocking();
         }
      } else {
         Logger.log("Ad Blocker disabled");
         AdBlocker.stopObserver();
         AdBlocker.removeBlockingCSS();
         AdBlocker.unhideAds();
      }
   },
};

// Initialize after DOMContentLoaded
if (document.readyState === "loading") {
   document.addEventListener("DOMContentLoaded", () => {
      setTimeout(AdBlocker.init, 50);
   });
} else if (
   document.readyState === "interactive" ||
   document.readyState === "complete"
) {
   setTimeout(AdBlocker.init, 50);
}

// Listen for toggle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message.action === "TOGGLE_ADBLOCKER") {
      AdBlocker.toggle(message.payload.enabled).then(() => {
         sendResponse({ success: true });
      });
      return true;
   }
});

if (typeof window !== "undefined") {
   window.AdBlocker = AdBlocker;
}
