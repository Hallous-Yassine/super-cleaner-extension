/**
 * Preset Rules Applier
 * Applies preset cleaning rules like removing images, links, videos, etc.
 */
const PresetRules = {
   domain: window.location.hostname,
   activeRules: {},

   init: async () => {
      try {
         PresetRules.activeRules = await StorageManager.getPresetRules(
            PresetRules.domain
         );
         PresetRules.applyAllRules();

         // Watch for dynamic content
         PresetRules.startObserver();
      } catch (e) {
         Logger.error("PresetRules init error:", e);
      }
   },

   applyAllRules: () => {
      if (PresetRules.activeRules.removeImages) {
         PresetRules.removeImages();
      }
      if (PresetRules.activeRules.removeLinks) {
         PresetRules.removeLinks();
      }
      if (PresetRules.activeRules.removeIcons) {
         PresetRules.removeIcons();
      }
      if (PresetRules.activeRules.removeVideos) {
         PresetRules.removeVideos();
      }
      if (PresetRules.activeRules.adultMode) {
         PresetRules.applyAdultMode();
      }
      if (PresetRules.activeRules.educationMode) {
         PresetRules.applyEducationMode();
      }
   },

   removeImages: () => {
      let removedCount = 0;

      // 1. Remove all <img> elements
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
         if (!img.classList.contains("webcleaner-preset-hidden")) {
            img.classList.add("webcleaner-preset-hidden");
            img.setAttribute("data-preset-rule", "images");
            removedCount++;
         }
      });

      // 2. Remove <picture> elements
      document.querySelectorAll('picture').forEach((pic) => {
         if (!pic.classList.contains("webcleaner-preset-hidden")) {
            pic.classList.add("webcleaner-preset-hidden");
            pic.setAttribute("data-preset-rule", "images");
            removedCount++;
         }
      });

      // 3. Remove background images (inline styles)
      document.querySelectorAll('[style*="background-image"]').forEach((el) => {
         if (!el.classList.contains("webcleaner-preset-hidden")) {
            el.style.backgroundImage = "none";
            el.setAttribute("data-preset-rule", "images");
            el.setAttribute("data-bg-removed", "true");
            removedCount++;
         }
      });

      // 4. Remove common background image classes
      const bgClasses = [
         '[class*="bg-"]',
         '[class*="hero"]',
         '[class*="banner"]',
         '[class*="cover"]',
         '[class*="background"]'
      ];

      bgClasses.forEach(selector => {
         document.querySelectorAll(selector).forEach((el) => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
               el.style.backgroundImage = "none";
               el.setAttribute("data-preset-rule", "images");
               el.setAttribute("data-bg-removed", "true");
               removedCount++;
            }
         });
      });

      Logger.log(`Removed ${removedCount} images and backgrounds`);
   },

   removeLinks: () => {
      const links = document.querySelectorAll("a[href]");
      let disabledCount = 0;

      links.forEach((link) => {
         if (!link.classList.contains("webcleaner-preset-disabled")) {
            // Save original href for potential restoration
            link.setAttribute("data-original-href", link.href);

            // Remove href attribute
            link.removeAttribute("href");

            // Disable pointer events
            link.style.pointerEvents = "none";

            // Make it look like normal text
            link.style.color = "inherit";
            link.style.textDecoration = "none";
            link.style.cursor = "default";

            // Add class and attribute
            link.classList.add("webcleaner-preset-disabled");
            link.setAttribute("data-preset-rule", "links");

            // Prevent click events
            link.addEventListener(
               "click",
               (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
               },
               true
            );

            disabledCount++;
         }
      });

      Logger.log(`Disabled ${disabledCount} links`);
   },

   removeIcons: () => {
      let removedCount = 0;

      // 1. Remove all SVG elements
      document.querySelectorAll('svg').forEach((svg) => {
         if (!svg.classList.contains("webcleaner-preset-hidden")) {
            svg.classList.add("webcleaner-preset-hidden");
            svg.setAttribute("data-preset-rule", "icons");
            removedCount++;
         }
      });

      // 2. Remove all <i> elements (commonly used for icons)
      document.querySelectorAll('i').forEach((i) => {
         if (!i.classList.contains("webcleaner-preset-hidden")) {
            i.classList.add("webcleaner-preset-hidden");
            i.setAttribute("data-preset-rule", "icons");
            removedCount++;
         }
      });

      // 3. Remove FontAwesome icons
      const fontAwesomeSelectors = [
         '[class*="fa-"]',
         '.fa',
         '.fas',
         '.far',
         '.fal',
         '.fab',
         '.fad'
      ];

      fontAwesomeSelectors.forEach(selector => {
         document.querySelectorAll(selector).forEach((el) => {
            if (!el.classList.contains("webcleaner-preset-hidden")) {
               el.classList.add("webcleaner-preset-hidden");
               el.setAttribute("data-preset-rule", "icons");
               removedCount++;
            }
         });
      });

      // 4. Remove Material Icons
      document.querySelectorAll('.material-icons, .material-icons-outlined, .material-icons-round, .material-icons-sharp, .material-icons-two-tone').forEach((el) => {
         if (!el.classList.contains("webcleaner-preset-hidden")) {
            el.classList.add("webcleaner-preset-hidden");
            el.setAttribute("data-preset-rule", "icons");
            removedCount++;
         }
      });

      // 5. Remove generic icon classes
      const iconSelectors = [
         '.icon',
         '[class*="icon-"]',
         '[class*="Icon"]',
         '[class*="glyph"]'
      ];

      iconSelectors.forEach(selector => {
         document.querySelectorAll(selector).forEach((el) => {
            if (!el.classList.contains("webcleaner-preset-hidden")) {
               el.classList.add("webcleaner-preset-hidden");
               el.setAttribute("data-preset-rule", "icons");
               removedCount++;
            }
         });
      });

      // 6. Remove small images (likely icons)
      const smallImages = document.querySelectorAll(
         'img[width="16"], img[width="24"], img[width="32"], ' +
         'img[height="16"], img[height="24"], img[height="32"]'
      );

      smallImages.forEach((img) => {
         const rect = img.getBoundingClientRect();
         if (rect.width <= 64 && rect.height <= 64) {
            if (!img.classList.contains("webcleaner-preset-hidden")) {
               img.classList.add("webcleaner-preset-hidden");
               img.setAttribute("data-preset-rule", "icons");
               removedCount++;
            }
         }
      });

      Logger.log(`Removed ${removedCount} icons`);
   },

   removeVideos: () => {
      let removedCount = 0;

      // 1. Remove all <video> elements
      document.querySelectorAll('video').forEach((video) => {
         if (!video.classList.contains("webcleaner-preset-hidden")) {
            video.pause(); // Pause before hiding
            video.classList.add("webcleaner-preset-hidden");
            video.setAttribute("data-preset-rule", "videos");
            removedCount++;
         }
      });

      // 2. Remove video platform iframes
      const videoPlatforms = [
         'youtube',
         'youtu.be',
         'vimeo',
         'dailymotion',
         'tiktok',
         'twitch',
         'facebook.com/video',
         'instagram.com/p',
         'twitter.com/i/videos',
         'streamable',
         'wistia',
         'vidyard',
         'brightcove'
      ];

      videoPlatforms.forEach(platform => {
         document.querySelectorAll(`iframe[src*="${platform}"]`).forEach((iframe) => {
            if (!iframe.classList.contains("webcleaner-preset-hidden")) {
               iframe.classList.add("webcleaner-preset-hidden");
               iframe.setAttribute("data-preset-rule", "videos");
               removedCount++;
            }
         });
      });

      // 3. Remove <embed> and <object> (legacy video players)
      document.querySelectorAll('embed, object').forEach((el) => {
         if (!el.classList.contains("webcleaner-preset-hidden")) {
            el.classList.add("webcleaner-preset-hidden");
            el.setAttribute("data-preset-rule", "videos");
            removedCount++;
         }
      });

      // 4. Remove video containers (common class patterns)
      const videoContainers = [
         '[class*="video-"]',
         '[class*="player"]',
         '[class*="embed"]',
         '[id*="video"]',
         '[id*="player"]'
      ];

      videoContainers.forEach(selector => {
         document.querySelectorAll(selector).forEach((el) => {
            // Only remove if it contains a video or iframe
            if (el.querySelector('video, iframe')) {
               if (!el.classList.contains("webcleaner-preset-hidden")) {
                  el.classList.add("webcleaner-preset-hidden");
                  el.setAttribute("data-preset-rule", "videos");
                  removedCount++;
               }
            }
         });
      });

      Logger.log(`Removed ${removedCount} videos and video containers`);
   },

   applyAdultMode: () => {
      // Use the advanced detection algorithm
      const analysis = AdultModeDetector.analyzePage();

      Logger.log(`Adult Mode Analysis:`, {
         score: analysis.score,
         level: analysis.level,
         details: analysis.details
      });

      // Get suspicious elements based on content
      const suspiciousElements = AdultModeDetector.getSuspiciousElements(5);

      Logger.log(`Found ${suspiciousElements.length} suspicious elements to blur`);

      // Apply blur to suspicious elements
      suspiciousElements.forEach(({ element, score }) => {
         if (!element.classList.contains("webcleaner-preset-blurred")) {
            element.classList.add("webcleaner-preset-blurred");
            element.setAttribute("data-preset-rule", "adult");
            element.setAttribute("data-adult-score", score);
         }
      });

      // If page score is very high, show warning
      if (analysis.score >= AdultModeDetector.THRESHOLDS.HIGH_RISK) {
         PresetRules.showAdultContentWarning(analysis);
      } else if (analysis.score >= AdultModeDetector.THRESHOLDS.MODERATE_RISK) {
         Logger.warn(`Moderate risk adult content detected (score: ${analysis.score})`);
      }

      Logger.log(`Adult mode applied - ${suspiciousElements.length} elements blurred`);
   },

   /**
    * Show warning overlay for high-risk adult content
    */
   showAdultContentWarning: (analysis) => {
      // Check if warning already exists
      if (document.getElementById('webcleaner-adult-warning')) return;

      const warning = document.createElement('div');
      warning.id = 'webcleaner-adult-warning';
      warning.style.cssText = `
         position: fixed;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         background: rgba(0, 0, 0, 0.95);
         z-index: 999999999;
         display: flex;
         align-items: center;
         justify-content: center;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      warning.innerHTML = `
         <div style="
            background: white;
            padding: 40px;
            border-radius: 12px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
         ">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h2 style="margin: 0 0 15px 0; color: #DC2626; font-size: 24px;">
               Contenu Adulte Détecté
            </h2>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
               Cette page contient du contenu potentiellement sensible.
            </p>
            <p style="margin: 0 0 25px 0; color: #999; font-size: 12px;">
               Score de risque: ${analysis.score} (${analysis.level})
            </p>
            <button id="webcleaner-continue-btn" style="
               background: #DC2626;
               color: white;
               border: none;
               padding: 12px 30px;
               border-radius: 6px;
               font-size: 16px;
               cursor: pointer;
               margin-right: 10px;
            ">
               Continuer quand même
            </button>
            <button id="webcleaner-goback-btn" style="
               background: #6B7280;
               color: white;
               border: none;
               padding: 12px 30px;
               border-radius: 6px;
               font-size: 16px;
               cursor: pointer;
            ">
               Retour
            </button>
         </div>
      `;

      document.body.appendChild(warning);

      // Add event listeners
      document.getElementById('webcleaner-continue-btn').addEventListener('click', () => {
         warning.remove();
      });

      document.getElementById('webcleaner-goback-btn').addEventListener('click', () => {
         window.history.back();
      });

      Logger.warn(`High-risk adult content warning displayed (score: ${analysis.score})`);
   },


   applyEducationMode: () => {
      Logger.log("Applying Education Mode with intelligent content detection...");

      // 1. Detect page type for adaptive styling
      const pageType = EducationModeDetector.detectPageType();
      Logger.log(`Page type detected: ${pageType}`);

      // 2. Detect main content area
      EducationModeDetector.mainContent = EducationModeDetector.detectMainContent();

      if (EducationModeDetector.mainContent) {
         // Mark main content for protection
         EducationModeDetector.mainContent.setAttribute('data-education-main', 'true');
         Logger.log("Main content area identified and protected");
      }

      // 3. Identify and remove distractions
      const distractions = EducationModeDetector.identifyDistractions();

      let removedCount = 0;
      distractions.forEach(({ element, reason }) => {
         if (!element.classList.contains("webcleaner-preset-hidden")) {
            element.classList.add("webcleaner-preset-hidden");
            element.setAttribute("data-preset-rule", "education");
            element.setAttribute("data-distraction-reason", reason);
            removedCount++;

            // Pause videos
            if (element.tagName === "VIDEO") {
               element.pause();
            }
         }
      });

      Logger.log(`Removed ${removedCount} distraction elements`);

      // 4. Apply simplified reading styles
      EducationModeDetector.applyReadingStyles();

      // 5. Additional cleanup for specific elements
      // Remove navigation elements not caught by main detection
      document.querySelectorAll('nav, footer').forEach(el => {
         if (!EducationModeDetector.isInsideMainContent(el)) {
            if (!el.classList.contains("webcleaner-preset-hidden")) {
               el.classList.add("webcleaner-preset-hidden");
               el.setAttribute("data-preset-rule", "education");
            }
         }
      });

      // 6. Enhance text readability in main content
      if (EducationModeDetector.mainContent) {
         const textElements = EducationModeDetector.mainContent.querySelectorAll(
            "p, li, span, div:not(:has(p)):not(:has(div))"
         );

         textElements.forEach((el) => {
            const textLength = el.textContent.trim().length;
            // Only enhance elements with substantial text
            if (textLength > 50 && !el.hasAttribute("data-education-enhanced")) {
               el.setAttribute("data-education-enhanced", "true");
            }
         });
      }

      // 7. Log summary
      const summary = {
         pageType,
         mainContentDetected: !!EducationModeDetector.mainContent,
         distractionsRemoved: removedCount,
         distractionBreakdown: distractions.reduce((acc, { reason }) => {
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
         }, {})
      };

      Logger.log("Education mode applied successfully", summary);
   },


   restoreImages: () => {
      document.querySelectorAll('[data-preset-rule="images"]').forEach((el) => {
         el.classList.remove("webcleaner-preset-hidden");
         el.removeAttribute("data-preset-rule");
      });
   },

   restoreLinks: () => {
      document.querySelectorAll('[data-preset-rule="links"]').forEach((el) => {
         el.classList.remove("webcleaner-preset-disabled");
         el.removeAttribute("data-preset-rule");
      });
   },

   restoreIcons: () => {
      document.querySelectorAll('[data-preset-rule="icons"]').forEach((el) => {
         el.classList.remove("webcleaner-preset-hidden");
         el.removeAttribute("data-preset-rule");
      });
   },

   restoreVideos: () => {
      document.querySelectorAll('[data-preset-rule="videos"]').forEach((el) => {
         el.classList.remove("webcleaner-preset-hidden");
         el.removeAttribute("data-preset-rule");
      });
   },

   restoreAdultMode: () => {
      document.querySelectorAll('[data-preset-rule="adult"]').forEach((el) => {
         el.classList.remove("webcleaner-preset-blurred");
         el.removeAttribute("data-preset-rule");
      });
   },

   restoreEducationMode: () => {
      document
         .querySelectorAll('[data-preset-rule="education"]')
         .forEach((el) => {
            el.classList.remove("webcleaner-preset-hidden");
            el.removeAttribute("data-preset-rule");
         });

      document.querySelectorAll("[data-education-mode]").forEach((el) => {
         el.style.fontSize = "";
         el.style.lineHeight = "";
         el.style.letterSpacing = "";
         el.removeAttribute("data-education-mode");
      });

      // Remove education mode styles
      const educationStyles = document.getElementById("education-mode-styles");
      if (educationStyles) {
         educationStyles.remove();
      }

      // Reset body styles
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
      document.body.style.maxWidth = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
   },

   startObserver: () => {
      const observer = new MutationObserver(() => {
         PresetRules.applyAllRules();
      });

      observer.observe(document.body, {
         childList: true,
         subtree: true,
      });
   },

   refresh: async () => {
      // Restore all
      PresetRules.restoreImages();
      PresetRules.restoreLinks();
      PresetRules.restoreIcons();
      PresetRules.restoreVideos();
      PresetRules.restoreAdultMode();
      PresetRules.restoreEducationMode();

      // Reapply
      await PresetRules.init();
   },
};

// Listen for preset rule changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
   if (message.action === "APPLY_PRESET_RULE") {
      const { ruleName, enabled } = message.payload;
      PresetRules.activeRules[ruleName] = enabled;

      if (enabled) {
         switch (ruleName) {
            case "removeImages":
               PresetRules.removeImages();
               break;
            case "removeLinks":
               PresetRules.removeLinks();
               break;
            case "removeIcons":
               PresetRules.removeIcons();
               break;
            case "removeVideos":
               PresetRules.removeVideos();
               break;
            case "adultMode":
               PresetRules.applyAdultMode();
               break;
            case "educationMode":
               PresetRules.applyEducationMode();
               break;
         }
      } else {
         switch (ruleName) {
            case "removeImages":
               PresetRules.restoreImages();
               break;
            case "removeLinks":
               PresetRules.restoreLinks();
               break;
            case "removeIcons":
               PresetRules.restoreIcons();
               break;
            case "removeVideos":
               PresetRules.restoreVideos();
               break;
            case "adultMode":
               PresetRules.restoreAdultMode();
               break;
            case "educationMode":
               PresetRules.restoreEducationMode();
               break;
         }
      }

      sendResponse({ success: true });
      return true;
   }
});

// Initialize on load
if (document.readyState === "loading") {
   document.addEventListener("DOMContentLoaded", PresetRules.init);
} else {
   PresetRules.init();
}

if (typeof window !== "undefined") {
   window.PresetRules = PresetRules;
}
