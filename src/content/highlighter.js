/**
 * Highlighter Module
 * Handles visual highlighting of elements in Edit Mode.
 */
const Highlighter = {
    className: 'webcleaner-highlight',
    currentElement: null,

    /**
     * Add highlight to an element.
     * @param {HTMLElement} element 
     */
    highlight: (element) => {
        if (!element || element === Highlighter.currentElement) return;

        // Remove previous highlight
        Highlighter.remove();

        Highlighter.currentElement = element;
        element.classList.add(Highlighter.className);
    },

    /**
     * Remove highlight from the current element.
     */
    remove: () => {
        if (Highlighter.currentElement) {
            Highlighter.currentElement.classList.remove(Highlighter.className);
            Highlighter.currentElement = null;
        }
        // Reset cursor
        document.body.style.cursor = '';
    }
};

if (typeof window !== 'undefined') {
    window.Highlighter = Highlighter;
}
