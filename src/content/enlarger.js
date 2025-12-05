/**
 * Enlarger - Allows users to enlarge specific elements on the page
 */
console.log("🚀 Enlarger.js is loading...");

const Enlarger = {
   domain: window.location.hostname,
   isActive: false,
   enlargedElements: [],

   init: async () => {
      console.log("🔧 Enlarger.init() called");
      try {
         // Load enlarged elements for this domain using the correct storage method
         const rules = await StorageManager.getEnlargedElements(Enlarger.domain);
         Enlarger.enlargedElements = rules || [];
         Enlarger.applyEnlargements();
         console.log(
            `✅ Enlarger initialized successfully with ${Enlarger.enlargedElements.length} saved rules`
         );
         Logger.log(
            `Enlarger initialized with ${Enlarger.enlargedElements.length} rules`
         );
      } catch (e) {
         console.error("❌ Enlarger init error:", e);
         Logger.error("Enlarger init error:", e);
      }
   },

   enable: () => {
      // Disable Edit mode if active (mutual exclusion)
      if (window.Selector && Selector.isActive) {
         console.log("🔄 Disabling Edit mode to enable Enlarge mode");
         Selector.disable();
      }

      Enlarger.isActive = true;
      document.body.style.cursor = "zoom-in";
      document.body.style.backgroundColor = "rgba(16, 185, 129, 0.02)"; // Visual feedback
      document.addEventListener("click", Enlarger.handleClick, true);
      document.addEventListener("mouseover", Enlarger.handleHover);
      document.addEventListener("mouseout", Enlarger.handleHoverOut);
      console.log(
         "✅ ENLARGER MODE ENABLED - Click any element to enlarge it!"
      );
      Logger.log("Enlarger mode enabled");
   },

   disable: () => {
      Enlarger.isActive = false;
      document.body.style.cursor = "";
      document.body.style.backgroundColor = "";
      document.removeEventListener("click", Enlarger.handleClick, true);
      document.removeEventListener("mouseover", Enlarger.handleHover);
      document.removeEventListener("mouseout", Enlarger.handleHoverOut);
      Enlarger.removeHighlights();

      // Reset all enlarged elements to normal size
      Enlarger.resetAllEnlargements();

      console.log("❌ ENLARGER MODE DISABLED");
      Logger.log("Enlarger mode disabled");
   },

   handleHover: (e) => {
      if (!Enlarger.isActive) return;
      const target = e.target;
      if (
         target &&
         !target.classList.contains("webcleaner-enlarge-highlight")
      ) {
         target.classList.add("webcleaner-enlarge-highlight");
      }
   },

   handleHoverOut: (e) => {
      if (!Enlarger.isActive) return;
      const target = e.target;
      if (target) {
         target.classList.remove("webcleaner-enlarge-highlight");
      }
   },

   removeHighlights: () => {
      document
         .querySelectorAll(".webcleaner-enlarge-highlight")
         .forEach((el) => el.classList.remove("webcleaner-enlarge-highlight"));
   },

   /**
    * Reset all enlarged elements to their normal size
    */
   resetAllEnlargements: () => {
      console.log("🔄 Resetting all enlarged elements to normal size");

      // Find all enlarged elements
      const enlargedElements = document.querySelectorAll('.webcleaner-enlarged');

      enlargedElements.forEach(el => {
         // Remove the class
         el.classList.remove('webcleaner-enlarged');

         // Restore original styles
         el.style.width = el.getAttribute('data-original-width') || '';
         el.style.height = el.getAttribute('data-original-height') || '';
         el.style.maxWidth = el.getAttribute('data-original-max-width') || '';
         el.style.maxHeight = el.getAttribute('data-original-max-height') || '';
         el.style.minWidth = el.getAttribute('data-original-min-width') || '';
         el.style.minHeight = el.getAttribute('data-original-min-height') || '';
         el.style.transform = el.getAttribute('data-original-transform') || '';
         el.style.transformOrigin = el.getAttribute('data-original-transform-origin') || '';
         el.style.zIndex = el.getAttribute('data-original-z-index') || '';
         el.style.position = el.getAttribute('data-original-position') || '';
         el.style.overflow = el.getAttribute('data-original-overflow') || '';

         // Remove data attributes
         el.removeAttribute('data-original-width');
         el.removeAttribute('data-original-height');
         el.removeAttribute('data-original-max-width');
         el.removeAttribute('data-original-max-height');
         el.removeAttribute('data-original-min-width');
         el.removeAttribute('data-original-min-height');
         el.removeAttribute('data-original-transform');
         el.removeAttribute('data-original-transform-origin');
         el.removeAttribute('data-original-z-index');
         el.removeAttribute('data-original-position');
         el.removeAttribute('data-original-overflow');
      });

      Logger.log(`Reset ${enlargedElements.length} enlarged elements`);
   },

   handleClick: (e) => {
      console.log("🔍 Click detected in enlarger mode");

      if (!Enlarger.isActive) {
         console.log("❌ Enlarger not active");
         return;
      }

      e.preventDefault();
      e.stopPropagation();

      const target = e.target;
      console.log("🎯 Target element:", target.tagName, target.className);

      // Check if DomPath is available
      if (typeof DomPath === "undefined" || !DomPath.getSelector) {
         console.error("❌ DomPath not available yet");
         Logger.error("DomPath not available yet");
         return;
      }

      const domPath = DomPath.getSelector(target);
      console.log("📍 DOM Path:", domPath);

      // Check if already enlarged
      const isEnlarged = target.classList.contains("webcleaner-enlarged");

      if (isEnlarged) {
         console.log("📉 Removing enlargement");
         // Remove enlargement
         Enlarger.removeEnlargement(domPath, target);
      } else {
         console.log("📈 Adding enlargement");
         // Add enlargement
         Enlarger.addEnlargement(domPath, target);
      }
   },

   addEnlargement: (domPath, element) => {
      try {
         // Apply enlargement immediately
         Enlarger.enlargeElement(element);
         Enlarger.enlargedElements.push(domPath);

         // Save to storage (async, but don't wait)
         chrome.runtime
            .sendMessage({
               action: "SAVE_ENLARGEMENT",
               payload: { domain: Enlarger.domain, domPath },
            })
            .catch((err) => {
               Logger.error("Error saving enlargement:", err);
            });

         Logger.log(`Element enlarged: ${domPath}`);
      } catch (e) {
         Logger.error("Error adding enlargement:", e);
      }
   },

   removeEnlargement: (domPath, element) => {
      try {
         // Restore original styles immediately
         element.classList.remove("webcleaner-enlarged");

         const origWidth = element.getAttribute("data-original-width");
         const origHeight = element.getAttribute("data-original-height");
         const origFontSize = element.getAttribute("data-original-fontsize");
         const origLineHeight = element.getAttribute(
            "data-original-lineheight"
         );
         const origPadding = element.getAttribute("data-original-padding");
         const origMaxWidth = element.getAttribute("data-original-maxwidth");
         const origMaxHeight = element.getAttribute("data-original-maxheight");

         element.style.width = origWidth || "";
         element.style.height = origHeight || "";
         element.style.fontSize = origFontSize || "";
         element.style.lineHeight = origLineHeight || "";
         element.style.padding = origPadding || "";
         element.style.maxWidth = origMaxWidth || "";
         element.style.maxHeight = origMaxHeight || "";
         element.style.minWidth = "";
         element.style.minHeight = "";
         element.style.fontWeight = "";
         element.style.border = "";
         element.style.borderRadius = "";
         element.style.backgroundColor = "";
         element.style.boxShadow = "";
         element.style.outline = "";
         element.style.outlineOffset = "";
         element.style.zIndex = "";
         element.style.position = "";
         element.style.margin = "";
         element.style.transition = "";
         element.style.display = "";

         // Remove data attributes
         element.removeAttribute("data-original-width");
         element.removeAttribute("data-original-height");
         element.removeAttribute("data-original-fontsize");
         element.removeAttribute("data-original-lineheight");
         element.removeAttribute("data-original-padding");
         element.removeAttribute("data-original-maxwidth");
         element.removeAttribute("data-original-maxheight");

         Enlarger.enlargedElements = Enlarger.enlargedElements.filter(
            (p) => p !== domPath
         );

         // Remove from storage (async, but don't wait)
         chrome.runtime
            .sendMessage({
               action: "REMOVE_ENLARGEMENT",
               payload: { domain: Enlarger.domain, domPath },
            })
            .catch((err) => {
               Logger.error("Error removing from storage:", err);
            });

         Logger.log(`Enlargement removed: ${domPath}`);
      } catch (e) {
         Logger.error("Error removing enlargement:", e);
      }
   },

   enlargeElement: (element) => {
      if (element.classList.contains("webcleaner-enlarged")) {
         console.log("⚠️ Element already enlarged");
         return;
      }

      console.log("✨ ENLARGING ELEMENT:", element.tagName);
      element.classList.add("webcleaner-enlarged");

      // Store original styles
      const computed = window.getComputedStyle(element);
      const tagName = element.tagName.toLowerCase();

      element.setAttribute("data-original-width", element.style.width || "");
      element.setAttribute("data-original-height", element.style.height || "");
      element.setAttribute(
         "data-original-fontsize",
         element.style.fontSize || ""
      );
      element.setAttribute(
         "data-original-lineheight",
         element.style.lineHeight || ""
      );
      element.setAttribute(
         "data-original-padding",
         element.style.padding || ""
      );
      element.setAttribute(
         "data-original-maxwidth",
         element.style.maxWidth || ""
      );
      element.setAttribute(
         "data-original-maxheight",
         element.style.maxHeight || ""
      );

      // Get current dimensions
      const currentWidth = element.offsetWidth;
      const currentHeight = element.offsetHeight;
      const currentFontSize = parseFloat(computed.fontSize);

      // Universal border and glow
      element.style.border = "2px solid #10B981";
      element.style.borderRadius = "6px";
      element.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.3)";
      element.style.outline = "1px dashed #10B981";
      element.style.outlineOffset = "3px";
      element.style.zIndex = "999999";
      element.style.position = "relative";
      element.style.transition = "all 0.3s ease";

      // Handle different element types
      if (tagName === "img") {
         // Images: scale up
         element.style.width = currentWidth * 1.7 + "px";
         element.style.height = "auto";
         element.style.maxWidth = "none";
         element.style.maxHeight = "none";
         element.style.display = "block";
         element.style.margin = "20px auto";
         element.style.padding = "10px";
         element.style.backgroundColor = "white";
         Logger.log(
            `Image enlarged: ${currentWidth}px -> ${currentWidth * 1.7}px`
         );
      } else if (tagName === "video" || tagName === "iframe") {
         // Videos/iframes: scale up
         element.style.width = currentWidth * 1.5 + "px";
         element.style.height = currentHeight * 1.5 + "px";
         element.style.maxWidth = "none";
         element.style.maxHeight = "none";
         element.style.display = "block";
         element.style.margin = "20px auto";
         Logger.log(
            `Video/iframe enlarged: ${currentWidth}x${currentHeight} -> ${currentWidth * 1.5
            }x${currentHeight * 1.5}`
         );
      } else if (
         tagName === "p" ||
         tagName === "span" ||
         tagName === "div" ||
         tagName === "h1" ||
         tagName === "h2" ||
         tagName === "h3" ||
         tagName === "h4" ||
         tagName === "h5" ||
         tagName === "h6" ||
         tagName === "li" ||
         tagName === "a"
      ) {
         // Text elements: increase font size
         const newFontSize = currentFontSize * 1.5;
         element.style.fontSize = newFontSize + "px";
         element.style.lineHeight = "1.6";
         element.style.padding = "15px";
         element.style.backgroundColor = "rgba(16, 185, 129, 0.03)";
         element.style.display = "block";
         element.style.margin = "15px auto";
         element.style.maxWidth = "90%";
         element.style.fontWeight = "600";
         Logger.log(`Text enlarged: ${currentFontSize}px -> ${newFontSize}px`);
      } else if (
         tagName === "button" ||
         tagName === "input" ||
         tagName === "select" ||
         tagName === "textarea"
      ) {
         // Form elements: make bigger and more visible
         element.style.fontSize = currentFontSize * 1.4 + "px";
         element.style.padding = "12px 20px";
         element.style.minWidth = currentWidth * 1.5 + "px";
         element.style.minHeight = currentHeight * 1.5 + "px";
         element.style.display = "inline-block";
         element.style.margin = "10px";
         Logger.log(`Form element enlarged`);
      } else {
         // Generic elements: scale everything
         if (currentWidth > 0) {
            element.style.width = currentWidth * 1.5 + "px";
            element.style.maxWidth = "none";
         }
         if (currentHeight > 0) {
            element.style.height = currentHeight * 1.5 + "px";
            element.style.maxHeight = "none";
         }
         if (currentFontSize > 0) {
            element.style.fontSize = currentFontSize * 1.5 + "px";
         }
         element.style.padding = "15px";
         element.style.display = "block";
         element.style.margin = "20px auto";
         element.style.backgroundColor = "rgba(16, 185, 129, 0.03)";
         Logger.log(
            `Generic element enlarged: ${currentWidth}x${currentHeight} -> ${currentWidth * 1.5
            }x${currentHeight * 1.5}`
         );
      }
   },

   applyEnlargements: () => {
      Enlarger.enlargedElements.forEach((selector) => {
         try {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => Enlarger.enlargeElement(el));
         } catch (e) {
            Logger.error(`Error applying enlargement for ${selector}:`, e);
         }
      });
   },

   refresh: async () => {
      // Reset all current enlargements first
      Enlarger.resetAllEnlargements();

      // Reload and reapply saved enlargements
      const rules = await StorageManager.getEnlargedElements(Enlarger.domain);
      Enlarger.enlargedElements = rules || [];
      Enlarger.applyEnlargements();

      Logger.log("Enlargements refreshed");
   },
};

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   console.log("📨 Enlarger received message:", message);

   if (message.action === "TOGGLE_ENLARGE_MODE") {
      console.log("🔄 Toggling enlarge mode:", message.payload.enable);
      if (message.payload.enable) {
         Enlarger.enable();
      } else {
         Enlarger.disable();
      }
      sendResponse({ success: true });
      return true;
   }

   // Disable Enlarge mode when Edit mode is activated
   if (message.action === "TOGGLE_EDIT_MODE") {
      if (message.payload.enable && Enlarger.isActive) {
         console.log("🔄 Disabling Enlarge mode because Edit mode is activating");
         Enlarger.disable();
      }
      sendResponse({ success: true });
      return true;
   }
   if (message.action === "RESET_ENLARGEMENTS") {
      document.querySelectorAll(".webcleaner-enlarged").forEach((el) => {
         el.classList.remove("webcleaner-enlarged");
         el.style.width = "";
         el.style.height = "";
         el.style.fontSize = "";
         el.style.padding = "";
         el.style.display = "";
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
         el.removeAttribute("data-original-width");
         el.removeAttribute("data-original-height");
         el.removeAttribute("data-original-fontsize");
         el.removeAttribute("data-original-padding");
         el.removeAttribute("data-original-display");
      });
      Enlarger.enlargedElements = [];
      sendResponse({ success: true });
      return true;
   }
});

// Initialize on load
if (document.readyState === "loading") {
   document.addEventListener("DOMContentLoaded", Enlarger.init);
} else {
   Enlarger.init();
}

if (typeof window !== "undefined") {
   window.Enlarger = Enlarger;
}
