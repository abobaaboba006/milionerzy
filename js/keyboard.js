// keyboard.js - Obsluga skrotow klawiszowych

const Keyboard = {
    // Czy skroty sa aktywne
    enabled: true,

    // Callback dla odpowiedzi
    onAnswerSelect: null,

    // Callback dla nastepnego pytania
    onNextQuestion: null,

    // Callback dla ESC
    onEscape: null,

    // Inicjalizacja
    init() {
        this.bindEvents();
    },

    // Bindowanie eventow
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    },

    // Obsluga nacisniecia klawisza
    handleKeyPress(e) {
        if (!this.enabled) return;

        // Ignoruj jesli focus jest na input
        if (document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }

        const key = e.key.toUpperCase();
        const keyCode = e.code;

        // A, B, C, D lub 1, 2, 3, 4 - wybor odpowiedzi
        if (['A', 'B', 'C', 'D'].includes(key)) {
            e.preventDefault();
            const index = key.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
            this.selectAnswer(index);
        } else if (['1', '2', '3', '4'].includes(key)) {
            e.preventDefault();
            const index = parseInt(key) - 1;
            this.selectAnswer(index);
        }

        // Spacja lub Enter - nastepne pytanie
        if (keyCode === 'Space' || keyCode === 'Enter') {
            e.preventDefault();
            this.nextQuestion();
        }

        // Escape - powrot/zamknij
        if (keyCode === 'Escape') {
            e.preventDefault();
            this.escape();
        }
    },

    // Wybierz odpowiedz
    selectAnswer(index) {
        if (this.onAnswerSelect && typeof this.onAnswerSelect === 'function') {
            this.onAnswerSelect(index);
        }
    },

    // Nastepne pytanie
    nextQuestion() {
        if (this.onNextQuestion && typeof this.onNextQuestion === 'function') {
            this.onNextQuestion();
        }
    },

    // Escape
    escape() {
        if (this.onEscape && typeof this.onEscape === 'function') {
            this.onEscape();
        }
    },

    // Ustaw callback dla odpowiedzi
    setAnswerCallback(callback) {
        this.onAnswerSelect = callback;
    },

    // Ustaw callback dla nastepnego pytania
    setNextCallback(callback) {
        this.onNextQuestion = callback;
    },

    // Ustaw callback dla ESC
    setEscapeCallback(callback) {
        this.onEscape = callback;
    },

    // Wlacz/wylacz skroty
    setEnabled(enabled) {
        this.enabled = enabled;
    }
};

// Inicjalizacja po zaladowaniu
document.addEventListener('DOMContentLoaded', () => {
    Keyboard.init();
});
