/**
 * DOM Path utility for SuperCleaner
 * Generates unique CSS selectors with multiple strategies
 */
const DomPath = {
    /**
     * Generate a unique CSS selector for an element.
     * Strategy 1: Unique ID
     * Strategy 2: Unique class combination
     * Strategy 3: Full path with nth-child (more stable than nth-of-type)
     * @param {HTMLElement} element 
     * @returns {string} The unique selector.
     */
    getSelector: (element) => {
        if (!(element instanceof Element)) return null;

        // Strategy 1: Try to use ID if it's unique and valid
        if (element.id && element.id.trim() !== '') {
            try {
                const escapedId = CSS.escape(element.id);
                const testElements = document.querySelectorAll(`#${escapedId}`);
                if (testElements.length === 1 && testElements[0] === element) {
                    return `#${escapedId}`;
                }
            } catch (e) {
                // Invalid ID, continue to next strategy
            }
        }

        // Strategy 2: Try unique class combination
        if (element.classList.length > 0) {
            const classes = Array.from(element.classList)
                .filter(cls => !cls.startsWith('webcleaner-'))
                .filter(cls => !cls.startsWith('highlight'))
                .map(cls => {
                    try {
                        return CSS.escape(cls);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(cls => cls !== null);

            if (classes.length > 0) {
                const classSelector = element.nodeName.toLowerCase() + '.' + classes.join('.');
                try {
                    const testElements = document.querySelectorAll(classSelector);
                    if (testElements.length === 1 && testElements[0] === element) {
                        return classSelector;
                    }
                } catch (e) {
                    // Continue to next strategy
                }
            }
        }

        // Strategy 3: Build full path with nth-child
        const path = [];
        let currentElement = element;
        let depth = 0;
        const maxDepth = 6;

        while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE && depth < maxDepth) {
            let selector = currentElement.nodeName.toLowerCase();

            // Stop at html
            if (selector === 'html') break;

            // Stop at body but include it
            if (selector === 'body') {
                path.unshift('body');
                break;
            }

            // Add ID if available
            if (currentElement.id && currentElement.id.trim() !== '') {
                try {
                    selector += '#' + CSS.escape(currentElement.id);
                    path.unshift(selector);
                    break; // ID is unique enough
                } catch (e) {
                    // Continue without ID
                }
            }

            // Add classes (up to 3)
            if (currentElement.classList.length > 0) {
                const classes = Array.from(currentElement.classList)
                    .filter(cls => !cls.startsWith('webcleaner-'))
                    .filter(cls => !cls.startsWith('highlight'))
                    .slice(0, 3)
                    .map(cls => {
                        try {
                            return '.' + CSS.escape(cls);
                        } catch (e) {
                            return '';
                        }
                    })
                    .filter(cls => cls !== '')
                    .join('');

                if (classes) {
                    selector += classes;
                }
            }

            // Add nth-child for specificity (more stable than nth-of-type)
            if (currentElement.parentNode) {
                const siblings = Array.from(currentElement.parentNode.children);
                const index = siblings.indexOf(currentElement);
                if (index >= 0) {
                    selector += `:nth-child(${index + 1})`;
                }
            }

            path.unshift(selector);
            currentElement = currentElement.parentNode;
            depth++;
        }

        const finalSelector = path.join(' > ');

        // Validate the selector
        if (!finalSelector || finalSelector.trim() === '') {
            return null;
        }

        try {
            // Test if selector is valid
            document.querySelectorAll(finalSelector);
            return finalSelector;
        } catch (e) {
            Logger.error('Generated invalid selector:', finalSelector, e);
            return null;
        }
    }
};

if (typeof window !== 'undefined') {
    window.DomPath = DomPath;
}
