/**
 * Education Mode Detector
 * Intelligent main content detection and distraction removal for focused reading
 */
const EducationModeDetector = {
    mainContent: null,
    distractionElements: [],

    /**
     * Detect the main content area of the page
     * @returns {Element|null} The main content element
     */
    detectMainContent: () => {
        Logger.log("Detecting main content area...");

        // Strategy 1: Look for semantic HTML5 elements
        let mainElement = document.querySelector('main');
        if (mainElement && EducationModeDetector.isValidMainContent(mainElement)) {
            Logger.log("Found <main> element");
            return mainElement;
        }

        // Strategy 2: Look for <article> with substantial content
        const articles = Array.from(document.querySelectorAll('article'));
        if (articles.length > 0) {
            // Find the largest article by text content
            const largestArticle = articles.reduce((largest, article) => {
                const currentLength = article.textContent.trim().length;
                const largestLength = largest ? largest.textContent.trim().length : 0;
                return currentLength > largestLength ? article : largest;
            }, null);

            if (largestArticle && EducationModeDetector.isValidMainContent(largestArticle)) {
                Logger.log("Found <article> element with substantial content");
                return largestArticle;
            }
        }

        // Strategy 3: Look for role="main"
        mainElement = document.querySelector('[role="main"]');
        if (mainElement && EducationModeDetector.isValidMainContent(mainElement)) {
            Logger.log("Found element with role='main'");
            return mainElement;
        }

        // Strategy 4: Calculate text density ratio for all major containers
        const candidates = document.querySelectorAll('div, section, article');
        let bestCandidate = null;
        let bestScore = 0;

        candidates.forEach(element => {
            const score = EducationModeDetector.calculateContentScore(element);
            if (score > bestScore && score > 0.1) { // Minimum threshold
                bestScore = score;
                bestCandidate = element;
            }
        });

        if (bestCandidate) {
            Logger.log(`Found main content via density ratio (score: ${bestScore.toFixed(2)})`);
            return bestCandidate;
        }

        // Fallback: Use body
        Logger.warn("Could not detect main content, using body");
        return document.body;
    },

    /**
     * Calculate content score based on text density
     * @param {Element} element
     * @returns {number} Score (0-1)
     */
    calculateContentScore: (element) => {
        // Get text length (excluding script/style)
        const clone = element.cloneNode(true);
        clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
        const textLength = clone.textContent.trim().length;

        // Get element area
        const rect = element.getBoundingClientRect();
        const elementArea = rect.width * rect.height;

        if (elementArea === 0) return 0;

        // Calculate density: characters per pixel
        const density = textLength / elementArea;

        // Bonus for semantic elements
        let bonus = 1;
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'article') bonus = 1.5;
        if (tagName === 'main') bonus = 2;
        if (element.getAttribute('role') === 'main') bonus = 2;

        // Bonus for content-related classes/IDs
        const className = element.className || '';
        const id = element.id || '';
        if (/content|article|post|entry|main/i.test(className + id)) {
            bonus *= 1.3;
        }

        // Penalty for navigation/sidebar classes
        if (/nav|sidebar|aside|menu|widget/i.test(className + id)) {
            bonus *= 0.3;
        }

        return density * bonus;
    },

    /**
     * Validate if an element is suitable as main content
     * @param {Element} element
     * @returns {boolean}
     */
    isValidMainContent: (element) => {
        if (!element) return false;

        // Must have substantial text content (at least 200 characters)
        const textLength = element.textContent.trim().length;
        if (textLength < 200) return false;

        // Must be visible
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;

        // Should not be a navigation/sidebar element
        const className = element.className || '';
        const id = element.id || '';
        if (/nav|sidebar|aside|menu|widget|footer|header/i.test(className + id)) {
            return false;
        }

        return true;
    },

    /**
     * Identify all distraction elements
     * @returns {Array} Array of elements to remove/hide
     */
    identifyDistractions: () => {
        const distractions = [];

        // 1. Semantic distractions
        const semanticSelectors = [
            'aside',
            'nav',
            'footer',
            'header:not(:has(h1))', // Keep header if it has the main title
        ];

        semanticSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!EducationModeDetector.isInsideMainContent(el)) {
                    distractions.push({ element: el, reason: 'semantic' });
                }
            });
        });

        // 2. Sidebar elements
        const sidebarSelectors = [
            '.sidebar',
            '.side-bar',
            '[class*="sidebar"]',
            '[id*="sidebar"]',
            '[class*="widget"]',
            '[id*="widget"]',
        ];

        sidebarSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!EducationModeDetector.isInsideMainContent(el)) {
                    distractions.push({ element: el, reason: 'sidebar' });
                }
            });
        });

        // 3. Advertisement elements
        const adSelectors = [
            '[class*="ad-"]',
            '[class*="ads"]',
            '[id*="ad-"]',
            '[id*="ads"]',
            '[class*="banner"]',
            '[id*="banner"]',
            '[class*="promo"]',
            '[id*="promo"]',
            '[class*="sponsor"]',
            '[id*="sponsor"]',
            'iframe[src*="ads"]',
            'iframe[src*="doubleclick"]',
            'iframe[src*="googlesyndication"]',
        ];

        adSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                distractions.push({ element: el, reason: 'advertisement' });
            });
        });

        // 4. Popups and overlays
        const overlaySelectors = [
            '[class*="popup"]',
            '[id*="popup"]',
            '[class*="modal"]',
            '[id*="modal"]',
            '[class*="overlay"]',
            '[id*="overlay"]',
            '[class*="lightbox"]',
            '[id*="lightbox"]',
        ];

        overlaySelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                distractions.push({ element: el, reason: 'overlay' });
            });
        });

        // 5. Social media widgets
        const socialSelectors = [
            '[class*="social"]',
            '[id*="social"]',
            '[class*="share"]',
            '[id*="share"]',
            '[class*="follow"]',
            '[id*="follow"]',
            'iframe[src*="facebook"]',
            'iframe[src*="twitter"]',
            'iframe[src*="instagram"]',
        ];

        socialSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!EducationModeDetector.isInsideMainContent(el)) {
                    distractions.push({ element: el, reason: 'social' });
                }
            });
        });

        // 6. Videos and animations (distracting for reading)
        document.querySelectorAll('video, [autoplay]').forEach(el => {
            if (!EducationModeDetector.isInsideMainContent(el)) {
                distractions.push({ element: el, reason: 'video' });
            }
        });

        // 7. Animated GIFs
        document.querySelectorAll('img[src*=".gif"], img[src*="giphy"]').forEach(el => {
            if (!EducationModeDetector.isInsideMainContent(el)) {
                distractions.push({ element: el, reason: 'animation' });
            }
        });

        Logger.log(`Identified ${distractions.length} distraction elements`);
        return distractions;
    },

    /**
     * Check if an element is inside the main content area
     * @param {Element} element
     * @returns {boolean}
     */
    isInsideMainContent: (element) => {
        if (!EducationModeDetector.mainContent) return false;
        return EducationModeDetector.mainContent.contains(element);
    },

    /**
     * Apply simplified reading styles
     */
    applyReadingStyles: () => {
        // Remove existing education mode styles
        const existingStyles = document.getElementById('education-mode-styles');
        if (existingStyles) {
            existingStyles.remove();
        }

        const style = document.createElement('style');
        style.id = 'education-mode-styles';
        style.textContent = `
         /* Reset animations and transitions */
         *, *::before, *::after {
            animation: none !important;
            transition: none !important;
         }

         /* Body styling */
         body {
            background: #FAFAFA !important;
            color: #1A1A1A !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            line-height: 1.8 !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            padding: 40px 20px !important;
         }

         /* Main content area */
         [data-education-main="true"] {
            background: white !important;
            padding: 40px !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
         }

         /* Typography */
         p, li, span, div {
            font-size: 18px !important;
            line-height: 1.8 !important;
            letter-spacing: 0.3px !important;
            color: #1A1A1A !important;
         }

         /* Headings */
         h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em !important;
            margin-bottom: 0.5em !important;
            font-weight: 600 !important;
            color: #000000 !important;
            line-height: 1.3 !important;
         }

         h1 { font-size: 32px !important; }
         h2 { font-size: 28px !important; }
         h3 { font-size: 24px !important; }
         h4 { font-size: 20px !important; }

         /* Links */
         a {
            color: #0066CC !important;
            text-decoration: underline !important;
         }

         a:hover {
            color: #0052A3 !important;
         }

         /* Images */
         img:not(.webcleaner-preset-hidden) {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 20px auto !important;
            border-radius: 4px !important;
         }

         /* Lists */
         ul, ol {
            padding-left: 30px !important;
            margin: 15px 0 !important;
         }

         li {
            margin: 8px 0 !important;
         }

         /* Code blocks */
         code, pre {
            background: #F5F5F5 !important;
            padding: 2px 6px !important;
            border-radius: 3px !important;
            font-family: "Courier New", monospace !important;
         }

         pre {
            padding: 15px !important;
            overflow-x: auto !important;
         }

         /* Blockquotes */
         blockquote {
            border-left: 4px solid #0066CC !important;
            padding-left: 20px !important;
            margin: 20px 0 !important;
            font-style: italic !important;
            color: #555 !important;
         }

         /* Tables */
         table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin: 20px 0 !important;
         }

         th, td {
            border: 1px solid #DDD !important;
            padding: 12px !important;
            text-align: left !important;
         }

         th {
            background: #F5F5F5 !important;
            font-weight: 600 !important;
         }
      `;

        document.head.appendChild(style);
        Logger.log("Applied reading styles");
    },

    /**
     * Get page type for adaptive styling
     * @returns {string} Page type: 'article', 'documentation', 'news', 'generic'
     */
    detectPageType: () => {
        const url = window.location.href.toLowerCase();
        const title = document.title.toLowerCase();
        const metaDescription = document.querySelector('meta[name="description"]');
        const description = metaDescription ? metaDescription.getAttribute('content').toLowerCase() : '';

        // Check for article/blog
        if (document.querySelector('article') ||
            /blog|article|post/i.test(url + title + description)) {
            return 'article';
        }

        // Check for documentation
        if (/docs|documentation|guide|tutorial|api/i.test(url + title + description)) {
            return 'documentation';
        }

        // Check for news
        if (/news|press|media/i.test(url + title + description)) {
            return 'news';
        }

        return 'generic';
    }
};

// Export for use in other modules
if (typeof window !== "undefined") {
    window.EducationModeDetector = EducationModeDetector;
}
