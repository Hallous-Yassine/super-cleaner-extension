/**
 * Adult Mode Detector
 * Advanced detection system for adult content using scoring algorithm
 */
const AdultModeDetector = {
    // Scoring thresholds
    THRESHOLDS: {
        SAFE: 10,
        SUSPICIOUS: 20,
        MODERATE_RISK: 50,
        HIGH_RISK: 100
    },

    // Scoring weights
    WEIGHTS: {
        SEXUAL_KEYWORD: 5,
        PORN_BRAND: 10,
        EXPLICIT_ACTION: 7,
        SUSPICIOUS_PATTERN: 3,
        URL_PATTERN: 15,
        META_KEYWORD: 8,
        SUSPICIOUS_IMAGE: 5
    },

    /**
     * Analyze the entire page and return a risk score
     * @returns {Object} { score, level, details }
     */
    analyzePage: () => {
        let score = 0;
        const details = {
            textMatches: 0,
            urlMatches: 0,
            attributeMatches: 0,
            imageMatches: 0,
            metaMatches: 0
        };

        // 1. Analyze page text content
        const textScore = AdultModeDetector.analyzeText();
        score += textScore.score;
        details.textMatches = textScore.matches;

        // 2. Analyze URLs (images, links, iframes)
        const urlScore = AdultModeDetector.analyzeURLs();
        score += urlScore.score;
        details.urlMatches = urlScore.matches;

        // 3. Analyze HTML attributes
        const attrScore = AdultModeDetector.analyzeAttributes();
        score += attrScore.score;
        details.attributeMatches = attrScore.matches;

        // 4. Analyze images
        const imageScore = AdultModeDetector.analyzeImages();
        score += imageScore.score;
        details.imageMatches = imageScore.matches;

        // 5. Analyze page metadata
        const metaScore = AdultModeDetector.analyzeMetadata();
        score += metaScore.score;
        details.metaMatches = metaScore.matches;

        // Determine risk level
        let level = "SAFE";
        if (score >= AdultModeDetector.THRESHOLDS.HIGH_RISK) {
            level = "HIGH_RISK";
        } else if (score >= AdultModeDetector.THRESHOLDS.MODERATE_RISK) {
            level = "MODERATE_RISK";
        } else if (score >= AdultModeDetector.THRESHOLDS.SUSPICIOUS) {
            level = "SUSPICIOUS";
        }

        Logger.log(`Adult content analysis: Score=${score}, Level=${level}`, details);

        return { score, level, details };
    },

    /**
     * Analyze text content for keywords
     * @returns {Object} { score, matches }
     */
    analyzeText: () => {
        let score = 0;
        let matches = 0;

        // Get all text content (lowercase for case-insensitive matching)
        const pageText = document.body.innerText.toLowerCase();

        // Check sexual keywords
        AdultKeywords.sexual.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const count = (pageText.match(regex) || []).length;
            if (count > 0) {
                score += AdultModeDetector.WEIGHTS.SEXUAL_KEYWORD * Math.min(count, 5); // Cap at 5 occurrences
                matches += count;
            }
        });

        // Check porn brands (higher weight)
        AdultKeywords.pornBrands.forEach(brand => {
            if (pageText.includes(brand.toLowerCase())) {
                score += AdultModeDetector.WEIGHTS.PORN_BRAND;
                matches++;
            }
        });

        // Check explicit actions
        AdultKeywords.explicitActions.forEach(action => {
            const regex = new RegExp(`\\b${action}\\b`, 'gi');
            if (regex.test(pageText)) {
                score += AdultModeDetector.WEIGHTS.EXPLICIT_ACTION;
                matches++;
            }
        });

        // Check suspicious patterns
        AdultKeywords.suspiciousPatterns.forEach(pattern => {
            if (pageText.includes(pattern.toLowerCase())) {
                score += AdultModeDetector.WEIGHTS.SUSPICIOUS_PATTERN;
                matches++;
            }
        });

        return { score, matches };
    },

    /**
     * Analyze URLs for suspicious patterns
     * @returns {Object} { score, matches }
     */
    analyzeURLs: () => {
        let score = 0;
        let matches = 0;

        // Analyze current page URL
        const currentURL = window.location.href;
        AdultKeywords.urlPatterns.forEach(pattern => {
            if (pattern.test(currentURL)) {
                score += AdultModeDetector.WEIGHTS.URL_PATTERN;
                matches++;
            }
        });

        // Analyze image URLs
        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            const src = img.src.toLowerCase();
            AdultKeywords.urlPatterns.forEach(pattern => {
                if (pattern.test(src)) {
                    score += AdultModeDetector.WEIGHTS.URL_PATTERN;
                    matches++;
                }
            });
        });

        // Analyze link URLs
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.href.toLowerCase();
            AdultKeywords.urlPatterns.forEach(pattern => {
                if (pattern.test(href)) {
                    score += AdultModeDetector.WEIGHTS.URL_PATTERN;
                    matches++;
                }
            });
        });

        // Analyze iframe URLs
        const iframes = document.querySelectorAll('iframe[src]');
        iframes.forEach(iframe => {
            const src = iframe.src.toLowerCase();
            AdultKeywords.urlPatterns.forEach(pattern => {
                if (pattern.test(src)) {
                    score += AdultModeDetector.WEIGHTS.URL_PATTERN * 2; // Double weight for iframes
                    matches++;
                }
            });
        });

        return { score, matches };
    },

    /**
     * Analyze HTML attributes (alt, title, aria-label, data-*)
     * @returns {Object} { score, matches }
     */
    analyzeAttributes: () => {
        let score = 0;
        let matches = 0;

        const elements = document.querySelectorAll('[alt], [title], [aria-label], [data-title], [data-description]');

        elements.forEach(el => {
            const attributes = [
                el.getAttribute('alt'),
                el.getAttribute('title'),
                el.getAttribute('aria-label'),
                el.getAttribute('data-title'),
                el.getAttribute('data-description')
            ].filter(Boolean).join(' ').toLowerCase();

            // Check against all keyword categories
            AdultKeywords.sexual.forEach(keyword => {
                if (attributes.includes(keyword)) {
                    score += AdultModeDetector.WEIGHTS.SEXUAL_KEYWORD;
                    matches++;
                }
            });

            AdultKeywords.pornBrands.forEach(brand => {
                if (attributes.includes(brand.toLowerCase())) {
                    score += AdultModeDetector.WEIGHTS.PORN_BRAND;
                    matches++;
                }
            });

            AdultKeywords.explicitActions.forEach(action => {
                if (attributes.includes(action)) {
                    score += AdultModeDetector.WEIGHTS.EXPLICIT_ACTION;
                    matches++;
                }
            });
        });

        return { score, matches };
    },

    /**
     * Analyze images for suspicious dimensions
     * @returns {Object} { score, matches }
     */
    analyzeImages: () => {
        let score = 0;
        let matches = 0;

        const images = document.querySelectorAll('img');

        images.forEach(img => {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;

            // Check if image dimensions match common porn thumbnail sizes
            AdultKeywords.suspiciousImageSizes.forEach(size => {
                if (Math.abs(width - size.width) < 10 && Math.abs(height - size.height) < 10) {
                    score += AdultModeDetector.WEIGHTS.SUSPICIOUS_IMAGE;
                    matches++;
                }
            });

            // Check aspect ratio (16:9 is very common for adult content)
            const aspectRatio = width / height;
            if (Math.abs(aspectRatio - 16 / 9) < 0.1 && width >= 300) {
                score += AdultModeDetector.WEIGHTS.SUSPICIOUS_IMAGE * 0.5;
            }
        });

        return { score, matches };
    },

    /**
     * Analyze page metadata (meta tags, title)
     * @returns {Object} { score, matches }
     */
    analyzeMetadata: () => {
        let score = 0;
        let matches = 0;

        // Check page title
        const title = document.title.toLowerCase();
        AdultKeywords.metaKeywords.forEach(keyword => {
            if (title.includes(keyword.toLowerCase())) {
                score += AdultModeDetector.WEIGHTS.META_KEYWORD;
                matches++;
            }
        });

        // Check meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            const content = metaDesc.getAttribute('content')?.toLowerCase() || '';
            AdultKeywords.metaKeywords.forEach(keyword => {
                if (content.includes(keyword.toLowerCase())) {
                    score += AdultModeDetector.WEIGHTS.META_KEYWORD;
                    matches++;
                }
            });
        }

        // Check meta keywords
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
            const content = metaKeywords.getAttribute('content')?.toLowerCase() || '';
            AdultKeywords.metaKeywords.forEach(keyword => {
                if (content.includes(keyword.toLowerCase())) {
                    score += AdultModeDetector.WEIGHTS.META_KEYWORD;
                    matches++;
                }
            });
        }

        // Check Open Graph tags
        const ogTags = document.querySelectorAll('meta[property^="og:"]');
        ogTags.forEach(tag => {
            const content = tag.getAttribute('content')?.toLowerCase() || '';
            AdultKeywords.sexual.forEach(keyword => {
                if (content.includes(keyword)) {
                    score += AdultModeDetector.WEIGHTS.SEXUAL_KEYWORD;
                    matches++;
                }
            });
        });

        return { score, matches };
    },

    /**
     * Get elements that should be blurred based on content
     * @param {number} minScore - Minimum score threshold for an element to be flagged
     * @returns {Array} Array of elements to blur
     */
    getSuspiciousElements: (minScore = 5) => {
        const suspiciousElements = [];
        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {
            let elementScore = 0;
            const text = (el.textContent || '').toLowerCase();
            const attributes = [
                el.getAttribute('alt'),
                el.getAttribute('title'),
                el.getAttribute('aria-label')
            ].filter(Boolean).join(' ').toLowerCase();

            // Check text content
            AdultKeywords.sexual.forEach(keyword => {
                if (text.includes(keyword)) elementScore += 2;
            });

            AdultKeywords.pornBrands.forEach(brand => {
                if (text.includes(brand.toLowerCase())) elementScore += 5;
            });

            AdultKeywords.explicitActions.forEach(action => {
                if (text.includes(action)) elementScore += 3;
            });

            // Check attributes
            AdultKeywords.sexual.forEach(keyword => {
                if (attributes.includes(keyword)) elementScore += 3;
            });

            // If element score exceeds threshold, add to list
            if (elementScore >= minScore) {
                suspiciousElements.push({ element: el, score: elementScore });
            }
        });

        // Sort by score (highest first)
        return suspiciousElements.sort((a, b) => b.score - a.score);
    }
};

// Export for use in other modules
if (typeof window !== "undefined") {
    window.AdultModeDetector = AdultModeDetector;
}
