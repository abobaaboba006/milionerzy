// difficulty.js - System progresywnej trudnosci

const Difficulty = {
    // Poziomy trudnosci
    levels: {
        easy: {
            name: 'Latwy',
            questionRange: [1, 4],
            timer: 60,
            moneyMultiplier: 1.0,
            fiftyRemoves: 2
        },
        medium: {
            name: 'Sredni',
            questionRange: [5, 7],
            timer: 45,
            moneyMultiplier: 1.5,
            fiftyRemoves: 2 // 1-2 losowo
        },
        hard: {
            name: 'Trudny',
            questionRange: [8, 10],
            timer: 30,
            moneyMultiplier: 2.0,
            fiftyRemoves: 1
        }
    },

    // Pobierz poziom trudnosci dla numeru pytania
    getLevelForQuestion(questionNumber) {
        if (questionNumber <= 4) return 'easy';
        if (questionNumber <= 7) return 'medium';
        return 'hard';
    },

    // Pobierz konfiguracje dla numeru pytania
    getConfigForQuestion(questionNumber) {
        const level = this.getLevelForQuestion(questionNumber);
        return this.levels[level];
    },

    // Pobierz czas dla pytania
    getTimerForQuestion(questionNumber) {
        return this.getConfigForQuestion(questionNumber).timer;
    },

    // Pobierz mnoznik pieniedzy dla pytania
    getMoneyMultiplier(questionNumber) {
        return this.getConfigForQuestion(questionNumber).moneyMultiplier;
    },

    // Pobierz ile odpowiedzi usuwa 50:50
    getFiftyRemoves(questionNumber) {
        const config = this.getConfigForQuestion(questionNumber);
        // Dla medium losowo 1 lub 2
        if (this.getLevelForQuestion(questionNumber) === 'medium') {
            return Math.random() < 0.5 ? 1 : 2;
        }
        return config.fiftyRemoves;
    },

    // Pobierz nazwe poziomu trudnosci
    getLevelName(questionNumber) {
        return this.getConfigForQuestion(questionNumber).name;
    },

    // Pobierz kolor poziomu trudnosci
    getLevelColor(questionNumber) {
        const level = this.getLevelForQuestion(questionNumber);
        switch (level) {
            case 'easy': return '#00ff88';
            case 'medium': return '#ffd700';
            case 'hard': return '#ff4444';
            default: return '#ffffff';
        }
    },

    // Oblicz nagrode z uwzglednieniem trudnosci i streaka
    calculateReward(baseReward, questionNumber, streakMultiplier = 1) {
        const difficultyMultiplier = this.getMoneyMultiplier(questionNumber);
        return Math.round(baseReward * difficultyMultiplier * streakMultiplier);
    },

    // Pobierz opis poziomu trudnosci
    getLevelDescription(questionNumber) {
        const level = this.getLevelForQuestion(questionNumber);
        const config = this.levels[level];
        return `${config.name} - ${config.timer}s, x${config.moneyMultiplier} PLN`;
    }
};
