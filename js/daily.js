// daily.js - System codziennego wyzwania

const Daily = {
    // Liczba pytan w wyzwaniu
    QUESTIONS_COUNT: 5,

    // Bonus za dzienne wyzwanie
    MONEY_MULTIPLIER: 1.5,

    // Inicjalizacja
    init() {
        // Nic specjalnego
    },

    // Pobierz seed dla dzisiejszej daty
    getDailySeed() {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

        // Prosty hash
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            const char = dateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    },

    // Generator liczb pseudolosowych z seedem
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    },

    // Pobierz pytania na dzisiejszy dzien
    getDailyQuestions() {
        const seed = this.getDailySeed();
        const questionsCopy = [...Questions];

        // Tasuj z seedem
        for (let i = questionsCopy.length - 1; i > 0; i--) {
            const j = Math.floor(this.seededRandom(seed + i) * (i + 1));
            [questionsCopy[i], questionsCopy[j]] = [questionsCopy[j], questionsCopy[i]];
        }

        return questionsCopy.slice(0, this.QUESTIONS_COUNT);
    },

    // Sprawdz czy dzisiejsze wyzwanie zostalo ukonczone
    isCompletedToday() {
        const lastCompleted = Storage.getDailyCompleted();
        if (!lastCompleted) return false;

        const today = this.getTodayString();
        return lastCompleted === today;
    },

    // Pobierz dzisiejszy dzien jako string
    getTodayString() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    },

    // Oznacz wyzwanie jako ukonczone
    markCompleted() {
        Storage.setDailyCompleted(this.getTodayString());
        Storage.incrementDailyChallengesCompleted();
    },

    // Pobierz czas do polnocy
    getTimeUntilReset() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setDate(midnight.getDate() + 1);
        midnight.setHours(0, 0, 0, 0);

        const diff = midnight - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { hours, minutes, seconds, total: diff };
    },

    // Formatuj czas do resetu
    formatTimeUntilReset() {
        const time = this.getTimeUntilReset();
        return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`;
    },

    // Pobierz status dziennego wyzwania
    getStatus() {
        const completed = this.isCompletedToday();
        return {
            completed: completed,
            available: !completed,
            questionsCount: this.QUESTIONS_COUNT,
            multiplier: this.MONEY_MULTIPLIER,
            timeUntilReset: this.getTimeUntilReset(),
            timeFormatted: this.formatTimeUntilReset()
        };
    },

    // Rozpocznij odliczanie
    startCountdown(elementId, callback) {
        const element = document.getElementById(elementId);
        if (!element) return null;

        const updateCountdown = () => {
            const status = this.getStatus();
            element.textContent = status.timeFormatted;

            if (callback) callback(status);
        };

        updateCountdown();
        return setInterval(updateCountdown, 1000);
    }
};

// Inicjalizacja po zaladowaniu
document.addEventListener('DOMContentLoaded', () => {
    Daily.init();
});
