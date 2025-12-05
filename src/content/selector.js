/**
 * Selector Module
 * Handles intelligent "Edit Mode" interaction with smart element detection.
 */
const Selector = {
   isActive: false,

   enable: () => {
      if (Selector.isActive) return;

      // Disable Enlarge mode if active (mutual exclusion)
      if (window.Enlarger && Enlarger.isActive) {
         console.log("🔄 Disabling Enlarge mode to enable Edit mode");
         Enlarger.disable();
      }

      Selector.isActive = true;
      Logger.log("Edit Mode Enabled");

      // Use capture phase (true) to intercept events before ad scripts
      document.addEventListener("mouseover", Selector.handleMouseOver, true);
      document.addEventListener("mousedown", Selector.handleMouseDown, true);
      document.addEventListener("click", Selector.handleClick, true);
      document.addEventListener("keydown", Selector.handleKeyDown, true);
   },

   disable: () => {
      if (!Selector.isActive) return;
      Selector.isActive = false;
      Logger.log("Edit Mode Disabled");

      // Remove highlight
      Highlighter.remove();

      // Remove all event listeners
      document.removeEventListener("mouseover", Selector.handleMouseOver, true);
      document.removeEventListener("mousedown", Selector.handleMouseDown, true);
      document.removeEventListener("click", Selector.handleClick, true);
      document.removeEventListener("keydown", Selector.handleKeyDown, true);

      // Reset cursor to normal on body and all elements
      document.body.style.cursor = "";

      // Remove any lingering crosshair cursors from highlighted elements
      document.querySelectorAll("*").forEach((el) => {
         if (el.style.cursor === "crosshair") {
            el.style.cursor = "";
         }
      });
   },

   handleMouseOver: (e) => {
      if (!Selector.isActive) return;

      // Stop all propagation to prevent ad scripts from interfering
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Get the refined element (most meaningful element under cursor)
      const refinedElement = Selector.refineElement(e.target);

      if (refinedElement) {
         Highlighter.highlight(refinedElement);
      } else {
         Highlighter.remove();
      }
   },

   handleMouseDown: (e) => {
      if (!Selector.isActive) return;

      // Prevent default mousedown behavior on ads (prevents navigation)
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
   },

   handleClick: (e) => {
      if (!Selector.isActive) return;

      // CRITICAL: Stop all event propagation immediately to prevent ad clicks
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Get the refined element
      const element = Selector.refineElement(e.target);
      if (!element) {
         Logger.warn("No valid element found");
         return;
      }

      // Generate Path
      const domPath = DomPath.getSelector(element);

      // Validate selector is not empty
      if (!domPath || domPath.trim() === "") {
         Logger.error("Failed to generate selector for element:", element);
         alert(
            "Impossible de générer un sélecteur pour cet élément. Veuillez essayer un autre élément."
         );
         return;
      }

      Logger.log("Selected element:", element);
      Logger.log("Generated selector:", domPath);

      // Verify the selector works
      try {
         const testElements = document.querySelectorAll(domPath);
         Logger.log(`Selector matches ${testElements.length} element(s)`);

         if (testElements.length === 0) {
            Logger.error("Selector does not match any elements!");
            alert(
               "Le sélecteur généré ne correspond à aucun élément. Veuillez réessayer."
            );
            return;
         }

         // Verify the selector matches the intended element
         let matchesTarget = false;
         testElements.forEach((el) => {
            if (el === element) matchesTarget = true;
         });

         if (!matchesTarget) {
            Logger.warn(
               "Selector does not match the target element, but matches others"
            );
         }
      } catch (e) {
         Logger.error("Invalid selector generated:", domPath, e);
         alert("Le sélecteur généré est invalide. Veuillez réessayer.");
         return;
      }

      // Hide immediately (visual feedback)
      Hider.hideElement(element);

      // Save Rule
      const domain = window.location.hostname;
      Messaging.sendToBackground("SAVE_RULE", { domain, domPath })
         .then(() => {
            Logger.log("Rule saved successfully.");
         })
         .catch((err) => {
            Logger.error("Failed to save rule:", err);
            alert("Erreur lors de la sauvegarde de la règle.");
         });

      // Remove highlight
      Highlighter.remove();
   },

   /**
    * Refine element selection to find the most meaningful element
    * @param {Element} element - The raw hovered element
    * @returns {Element|null} - The refined element or null
    */
   refineElement: (element) => {
      if (!element || !element.tagName) return null;

      let candidate = element;
      const viewport = {
         width: window.innerWidth,
         height: window.innerHeight,
      };

      // Step 1: Avoid root elements
      if (Selector.isRootElement(candidate)) {
         // Try to find a meaningful child
         candidate = Selector.findMeaningfulChild(candidate) || candidate;
      }

      // Step 2: If element is too generic, go deeper
      if (Selector.isGenericContainer(candidate)) {
         const deeperElement = Selector.findMeaningfulChild(candidate);
         if (deeperElement) {
            candidate = deeperElement;
         }
      }

      // Step 3: If element is too large (covers most of viewport), try parent
      const rect = candidate.getBoundingClientRect();
      if (Selector.isTooLarge(rect, viewport)) {
         // Try to find a better child element
         const betterChild = Selector.findMeaningfulChild(candidate);
         if (
            betterChild &&
            !Selector.isTooLarge(betterChild.getBoundingClientRect(), viewport)
         ) {
            candidate = betterChild;
         }
      }

      // Step 4: Final validation
      if (!Selector.isValidElement(candidate)) {
         return null;
      }

      return candidate;
   },

   /**
    * Check if element is a root element (html, body, or main wrapper)
    */
   isRootElement: (element) => {
      const tagName = element.tagName.toLowerCase();
      if (tagName === "html" || tagName === "body") return true;

      // Check if element covers almost entire viewport
      const rect = element.getBoundingClientRect();
      const viewportArea = window.innerWidth * window.innerHeight;
      const elementArea = rect.width * rect.height;

      return elementArea > viewportArea * 0.9; // 90% of viewport
   },

   /**
    * Check if element is a generic container (div, section, etc. with no meaningful content)
    */
   isGenericContainer: (element) => {
      const tagName = element.tagName.toLowerCase();
      const genericTags = [
         "div",
         "section",
         "article",
         "main",
         "aside",
         "header",
         "footer",
         "nav",
      ];

      if (!genericTags.includes(tagName)) return false;

      // If it has meaningful classes or IDs, it might be intentional
      const meaningfulPatterns =
         /container|wrapper|content|box|card|panel|widget|component/i;
      if (element.className && meaningfulPatterns.test(element.className)) {
         return false; // Keep it, it's meaningful
      }

      // If it only has one child, it's probably just a wrapper
      const meaningfulChildren = Array.from(element.children).filter(
         (child) => {
            return child.offsetWidth > 0 && child.offsetHeight > 0;
         }
      );

      return meaningfulChildren.length === 1;
   },

   /**
    * Find the most meaningful child element
    */
   findMeaningfulChild: (element) => {
      const children = Array.from(element.children);

      // Filter visible children
      const visibleChildren = children.filter((child) => {
         const rect = child.getBoundingClientRect();
         return rect.width > 0 && rect.height > 0;
      });

      if (visibleChildren.length === 0) return null;

      // Prioritize meaningful tags
      const meaningfulTags = [
         "img",
         "video",
         "iframe",
         "button",
         "a",
         "form",
         "input",
         "textarea",
         "select",
      ];
      const meaningfulChild = visibleChildren.find((child) =>
         meaningfulTags.includes(child.tagName.toLowerCase())
      );

      if (meaningfulChild) return meaningfulChild;

      // If only one visible child, return it
      if (visibleChildren.length === 1) return visibleChildren[0];

      // Return the largest visible child
      return visibleChildren.reduce((largest, child) => {
         const rect = child.getBoundingClientRect();
         const largestRect = largest.getBoundingClientRect();
         const area = rect.width * rect.height;
         const largestArea = largestRect.width * largestRect.height;
         return area > largestArea ? child : largest;
      });
   },

   /**
    * Check if element is too large (covers most of viewport)
    */
   isTooLarge: (rect, viewport) => {
      const elementArea = rect.width * rect.height;
      const viewportArea = viewport.width * viewport.height;

      // Element is too large if it covers more than 70% of viewport
      return elementArea > viewportArea * 0.7;
   },

   /**
    * Validate if an element can be hidden
    */
   isValidElement: (element) => {
      if (!element || !element.tagName) return false;

      const tagName = element.tagName.toLowerCase();

      // Prevent hiding critical elements
      if (tagName === "html" || tagName === "body") {
         return false;
      }

      // Prevent hiding already hidden elements (avoid nested blur)
      if (element.classList.contains("webcleaner-hidden")) {
         return false;
      }

      // Prevent hiding parent of already hidden elements
      if (element.querySelector(".webcleaner-hidden")) {
         return false;
      }

      // Element must be visible
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
         return false;
      }

      return true;
   },

   handleKeyDown: (e) => {
      if (e.key === "Escape") {
         Selector.disable();
      }
   },
};

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message.action === "TOGGLE_EDIT_MODE") {
      if (message.payload.enable) {
         Selector.enable();
      } else {
         Selector.disable();
      }
      sendResponse({ success: true });
      return true;
   }
});

if (typeof window !== "undefined") {
   window.Selector = Selector;
}
