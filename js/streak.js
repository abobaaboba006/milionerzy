// streak.js - System serii poprawnych odpowiedzi

const Streak = {
    // Aktualna seria
    currentStreak: 0,

    // Mnozniki dla serii
    multipliers: {
        0: 1.0,   // 0-2 poprawnych
        3: 2.0,   // 3-4 poprawnych
        5: 3.0,   // 5-6 poprawnych
        7: 4.0,   // 7-9 poprawnych
        10: 5.0   // 10+ poprawnych
    },

    // Inicjalizacja
    init() {
        this.currentStreak = 0;
    },

    // Reset serii
    reset() {
        this.currentStreak = 0;
    },

    // Zwieksz serie
    increment() {
        this.currentStreak++;
        this.checkBestStreak();
        return this.currentStreak;
    },

    // Pobierz aktualna serie
    getCurrent() {
        return this.currentStreak;
    },

    // Pobierz aktualny mnoznik
    getMultiplier() {
        if (this.currentStreak >= 10) return this.multipliers[10];
        if (this.currentStreak >= 7) return this.multipliers[7];
        if (this.currentStreak >= 5) return this.multipliers[5];
        if (this.currentStreak >= 3) return this.multipliers[3];
        return this.multipliers[0];
    },

    // Pobierz tekst ikony ognia
    getFireEmoji() {
        if (this.currentStreak >= 10) return '🔥🔥🔥🔥🔥';
        if (this.currentStreak >= 7) return '🔥🔥🔥';
        if (this.currentStreak >= 5) return '🔥🔥';
        if (this.currentStreak >= 3) return '🔥';
        return '';
    },

    // Sprawdz czy to nowy mnoznik
    isNewMultiplierLevel() {
        return [3, 5, 7, 10].includes(this.currentStreak);
    },

    // Sprawdz i zapisz najlepsza serie
    checkBestStreak() {
        const bestStreak = Storage.getBestStreak() || 0;
        if (this.currentStreak > bestStreak) {
            Storage.setBestStreak(this.currentStreak);
            return true;
        }
        return false;
    },

    // Pobierz najlepsza serie
    getBest() {
        return Storage.getBestStreak() || 0;
    },

    // Pobierz info o serii do wyswietlenia
    getDisplayInfo() {
        return {
            streak: this.currentStreak,
            multiplier: this.getMultiplier(),
            fire: this.getFireEmoji(),
            isActive: this.currentStreak >= 3
        };
    }
};
