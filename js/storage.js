// storage.js - Zarzadzanie LocalStorage dla gry Milionerzy

const Storage = {
    KEYS: {
        MONEY: 'milionerzy_money',
        TOTAL_EARNED: 'milionerzy_total_earned',
        THEMES: 'milionerzy_themes',
        BACKGROUNDS: 'milionerzy_backgrounds',
        LIFELINES: 'milionerzy_lifelines',
        ACTIVE_THEME: 'milionerzy_active_theme',
        ACTIVE_BACKGROUND: 'milionerzy_active_background',
        GAMES_PLAYED: 'milionerzy_games_played',
        GAMES_WON: 'milionerzy_games_won',
        INCORRECT_QUESTIONS: 'milionerzy_incorrect_questions',
        // Nowe klucze
        ACHIEVEMENTS: 'milionerzy_achievements',
        LEADERBOARD: 'milionerzy_leaderboard',
        DAILY_COMPLETED: 'milionerzy_daily_completed',
        BEST_STREAK: 'milionerzy_best_streak',
        SOUND_SFX: 'milionerzy_sound_sfx',
        SOUND_MUSIC: 'milionerzy_sound_music',
        CATEGORY_STATS: 'milionerzy_category_stats',
        FASTEST_ANSWER: 'milionerzy_fastest_answer',
        PERFECT_GAMES: 'milionerzy_perfect_games',
        DAILY_CHALLENGES_COMPLETED: 'milionerzy_daily_challenges_completed',
        GAMES_WON_NO_LIFELINES: 'milionerzy_games_won_no_lifelines',
        // (API key moved to server-side .env)
        // Legacy keys (for migration)
        CLASS_NAME: 'milionerzy_class_name',
        CLASS_CONTEXT: 'milionerzy_class_context',
        CRITERIA_IMAGE: 'milionerzy_criteria_image',
        GENERATED_QUESTIONS: 'milionerzy_generated_questions',
        QUESTIONS_GENERATED_AT: 'milionerzy_questions_generated_at',
        // Multi-class system
        CLASSES_REGISTRY: 'milionerzy_classes_registry',
        ACTIVE_CLASS: 'milionerzy_active_class'
    },

    // Inicjalizacja domyslnych wartosci
    init() {
        if (this.getMoney() === null) {
            this.setMoney(0);
        }
        if (this.getTotalEarned() === null) {
            this.setTotalEarned(0);
        }
        if (this.getThemes() === null) {
            this.setThemes([]);
        }
        if (this.getBackgrounds() === null) {
            this.setBackgrounds([]);
        }
        if (this.getLifelines() === null) {
            this.setLifelines({ fifty: 0, skip: 0, time: 0 });
        }
        if (this.getActiveTheme() === null) {
            this.setActiveTheme('default');
        }
        if (this.getActiveBackground() === null) {
            this.setActiveBackground('default');
        }
        if (this.getGamesPlayed() === null) {
            this.setGamesPlayed(0);
        }
        if (this.getGamesWon() === null) {
            this.setGamesWon(0);
        }
        // Nowe inicjalizacje
        if (this.getAchievements() === null) {
            this.setAchievements([]);
        }
        if (this.getLeaderboard() === null) {
            this.setLeaderboard([]);
        }
        if (this.getBestStreak() === null) {
            this.setBestStreak(0);
        }
        if (this.getCategoryStats() === null) {
            this.setCategoryStats({});
        }
        if (this.getPerfectGames() === null) {
            this.setPerfectGames(0);
        }
        if (this.getDailyChallengesCompleted() === null) {
            this.setDailyChallengesCompleted(0);
        }
        if (this.getGamesWonNoLifelines() === null) {
            this.setGamesWonNoLifelines(0);
        }

        // Multi-class migration
        this._migrateToMultiClass();
    },

    // Migracja ze starego schematu do multi-class
    _migrateToMultiClass() {
        if (this.getClassesRegistry() !== null) {
            return; // Already migrated
        }

        const defaultClass = {
            id: 'default_fizyka7',
            name: 'Fizyka - Klasa 7',
            isDefault: true,
            questionCount: 65
        };

        const registry = [defaultClass];
        let activeClassId = 'default_fizyka7';

        // Migrate old generated questions if they exist
        const oldQuestions = this.getGeneratedQuestions();
        if (oldQuestions && Array.isArray(oldQuestions) && oldQuestions.length > 0) {
            const oldName = localStorage.getItem(this.KEYS.CLASS_NAME) || 'Wygenerowane pytania';
            const oldContext = localStorage.getItem(this.KEYS.CLASS_CONTEXT) || '';
            const oldTimestamp = localStorage.getItem(this.KEYS.QUESTIONS_GENERATED_AT) || new Date().toISOString();

            const migratedId = 'class_migrated';
            const migratedClass = {
                id: migratedId,
                name: oldName,
                context: oldContext,
                isDefault: false,
                questionCount: oldQuestions.length,
                generatedAt: oldTimestamp
            };

            // Store questions under new per-class key
            this.setClassQuestions(migratedId, oldQuestions);

            // Migrate incorrect questions
            const oldIncorrect = localStorage.getItem(this.KEYS.INCORRECT_QUESTIONS);
            if (oldIncorrect) {
                try {
                    const parsed = JSON.parse(oldIncorrect);
                    if (Array.isArray(parsed)) {
                        this.setClassIncorrect(migratedId, parsed);
                    }
                } catch (e) { /* ignore */ }
            }

            registry.push(migratedClass);
            activeClassId = migratedId;
        }

        // Initialize incorrect for default class from old data if no migration
        if (activeClassId === 'default_fizyka7') {
            const oldIncorrect = localStorage.getItem(this.KEYS.INCORRECT_QUESTIONS);
            if (oldIncorrect) {
                try {
                    const parsed = JSON.parse(oldIncorrect);
                    if (Array.isArray(parsed)) {
                        this.setClassIncorrect('default_fizyka7', parsed);
                    }
                } catch (e) { /* ignore */ }
            }
        }

        this.setClassesRegistry(registry);
        this.setActiveClass(activeClassId);

        // Clean up old keys
        localStorage.removeItem(this.KEYS.GENERATED_QUESTIONS);
        localStorage.removeItem(this.KEYS.QUESTIONS_GENERATED_AT);
        localStorage.removeItem(this.KEYS.CLASS_NAME);
        localStorage.removeItem(this.KEYS.CLASS_CONTEXT);
        localStorage.removeItem(this.KEYS.CRITERIA_IMAGE);
        localStorage.removeItem(this.KEYS.INCORRECT_QUESTIONS);

        console.log('[Milionerzy] Migracja do multi-class zakonczona. Aktywna klasa:', activeClassId);
    },

    // Pieniadze gracza (aktualne)
    getMoney() {
        const value = localStorage.getItem(this.KEYS.MONEY);
        return value !== null ? parseInt(value, 10) : null;
    },

    setMoney(amount) {
        localStorage.setItem(this.KEYS.MONEY, Math.max(0, amount).toString());
    },

    addMoney(amount) {
        const current = this.getMoney() || 0;
        this.setMoney(current + amount);
        if (amount > 0) {
            this.addTotalEarned(amount);
        }
    },

    // Lacznie zarobione pieniadze (do sklepu)
    getTotalEarned() {
        const value = localStorage.getItem(this.KEYS.TOTAL_EARNED);
        return value !== null ? parseInt(value, 10) : null;
    },

    setTotalEarned(amount) {
        localStorage.setItem(this.KEYS.TOTAL_EARNED, amount.toString());
    },

    addTotalEarned(amount) {
        const current = this.getTotalEarned() || 0;
        this.setTotalEarned(current + amount);
    },

    // Zakupione motywy
    getThemes() {
        const value = localStorage.getItem(this.KEYS.THEMES);
        return value !== null ? JSON.parse(value) : null;
    },

    setThemes(themes) {
        localStorage.setItem(this.KEYS.THEMES, JSON.stringify(themes));
    },

    addTheme(themeId) {
        const themes = this.getThemes() || [];
        if (!themes.includes(themeId)) {
            themes.push(themeId);
            this.setThemes(themes);
        }
    },

    hasTheme(themeId) {
        const themes = this.getThemes() || [];
        return themes.includes(themeId);
    },

    // Zakupione tla
    getBackgrounds() {
        const value = localStorage.getItem(this.KEYS.BACKGROUNDS);
        return value !== null ? JSON.parse(value) : null;
    },

    setBackgrounds(backgrounds) {
        localStorage.setItem(this.KEYS.BACKGROUNDS, JSON.stringify(backgrounds));
    },

    addBackground(backgroundId) {
        const backgrounds = this.getBackgrounds() || [];
        if (!backgrounds.includes(backgroundId)) {
            backgrounds.push(backgroundId);
            this.setBackgrounds(backgrounds);
        }
    },

    hasBackground(backgroundId) {
        const backgrounds = this.getBackgrounds() || [];
        return backgrounds.includes(backgroundId);
    },

    // Aktywne tlo
    getActiveBackground() {
        return localStorage.getItem(this.KEYS.ACTIVE_BACKGROUND);
    },

    setActiveBackground(backgroundId) {
        localStorage.setItem(this.KEYS.ACTIVE_BACKGROUND, backgroundId);
    },

    // Aktywny motyw
    getActiveTheme() {
        return localStorage.getItem(this.KEYS.ACTIVE_THEME);
    },

    setActiveTheme(themeId) {
        localStorage.setItem(this.KEYS.ACTIVE_THEME, themeId);
    },

    // Kola ratunkowe (ilosci)
    getLifelines() {
        const value = localStorage.getItem(this.KEYS.LIFELINES);
        return value !== null ? JSON.parse(value) : null;
    },

    setLifelines(lifelines) {
        localStorage.setItem(this.KEYS.LIFELINES, JSON.stringify(lifelines));
    },

    addLifeline(type, amount = 1) {
        const lifelines = this.getLifelines() || { fifty: 0, skip: 0, time: 0 };
        lifelines[type] = (lifelines[type] || 0) + amount;
        this.setLifelines(lifelines);
    },

    useLifeline(type) {
        const lifelines = this.getLifelines() || { fifty: 0, skip: 0, time: 0 };
        if (lifelines[type] > 0) {
            lifelines[type]--;
            this.setLifelines(lifelines);
            return true;
        }
        return false;
    },

    getLifelineCount(type) {
        const lifelines = this.getLifelines() || { fifty: 0, skip: 0, time: 0 };
        return lifelines[type] || 0;
    },

    // Statystyki gier
    getGamesPlayed() {
        const value = localStorage.getItem(this.KEYS.GAMES_PLAYED);
        return value !== null ? parseInt(value, 10) : null;
    },

    setGamesPlayed(count) {
        localStorage.setItem(this.KEYS.GAMES_PLAYED, count.toString());
    },

    incrementGamesPlayed() {
        this.setGamesPlayed((this.getGamesPlayed() || 0) + 1);
    },

    getGamesWon() {
        const value = localStorage.getItem(this.KEYS.GAMES_WON);
        return value !== null ? parseInt(value, 10) : null;
    },

    setGamesWon(count) {
        localStorage.setItem(this.KEYS.GAMES_WON, count.toString());
    },

    incrementGamesWon() {
        this.setGamesWon((this.getGamesWon() || 0) + 1);
    },

    // === MULTI-CLASS SYSTEM ===

    // Registry CRUD
    getClassesRegistry() {
        const value = localStorage.getItem(this.KEYS.CLASSES_REGISTRY);
        if (value === null) return null;
        try { return JSON.parse(value); } catch (e) { return null; }
    },

    setClassesRegistry(classes) {
        localStorage.setItem(this.KEYS.CLASSES_REGISTRY, JSON.stringify(classes));
    },

    // Active class
    getActiveClass() {
        return localStorage.getItem(this.KEYS.ACTIVE_CLASS) || 'default_fizyka7';
    },

    setActiveClass(classId) {
        localStorage.setItem(this.KEYS.ACTIVE_CLASS, classId);
    },

    // Per-class questions
    getClassQuestions(classId) {
        const value = localStorage.getItem('milionerzy_questions_' + classId);
        if (value === null) return null;
        try { return JSON.parse(value); } catch (e) { return null; }
    },

    setClassQuestions(classId, questions) {
        const key = 'milionerzy_questions_' + classId;
        localStorage.removeItem(key);
        localStorage.setItem(key, JSON.stringify(questions));
    },

    removeClassQuestions(classId) {
        localStorage.removeItem('milionerzy_questions_' + classId);
    },

    // Per-class incorrect tracking
    getClassIncorrect(classId) {
        const value = localStorage.getItem('milionerzy_incorrect_' + classId);
        if (value === null) return [];
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    },

    setClassIncorrect(classId, arr) {
        localStorage.setItem('milionerzy_incorrect_' + classId, JSON.stringify(arr));
    },

    addClassIncorrect(classId, qId) {
        const incorrect = this.getClassIncorrect(classId);
        if (!incorrect.includes(qId)) {
            incorrect.push(qId);
            this.setClassIncorrect(classId, incorrect);
        }
    },

    removeClassIncorrect(classId, qId) {
        const incorrect = this.getClassIncorrect(classId);
        const index = incorrect.indexOf(qId);
        if (index > -1) {
            incorrect.splice(index, 1);
            this.setClassIncorrect(classId, incorrect);
        }
    },

    getClassIncorrectCount(classId) {
        return this.getClassIncorrect(classId).length;
    },

    // Class management helpers
    addClass(classObj) {
        const registry = this.getClassesRegistry() || [];
        registry.push(classObj);
        this.setClassesRegistry(registry);
    },

    removeClass(classId) {
        let registry = this.getClassesRegistry() || [];
        registry = registry.filter(c => c.id !== classId);
        this.setClassesRegistry(registry);
        this.removeClassQuestions(classId);
        localStorage.removeItem('milionerzy_incorrect_' + classId);
    },

    getClassById(classId) {
        const registry = this.getClassesRegistry() || [];
        return registry.find(c => c.id === classId) || null;
    },

    updateClassMeta(classId, updates) {
        const registry = this.getClassesRegistry() || [];
        const idx = registry.findIndex(c => c.id === classId);
        if (idx !== -1) {
            Object.assign(registry[idx], updates);
            this.setClassesRegistry(registry);
        }
    },

    // Backward-compatible wrappers (delegate to active class)
    getIncorrectQuestions() {
        const activeId = this.getActiveClass();
        return this.getClassIncorrect(activeId);
    },

    setIncorrectQuestions(questions) {
        const activeId = this.getActiveClass();
        this.setClassIncorrect(activeId, questions);
    },

    addIncorrectQuestion(questionId) {
        const activeId = this.getActiveClass();
        this.addClassIncorrect(activeId, questionId);
    },

    removeIncorrectQuestion(questionId) {
        const activeId = this.getActiveClass();
        this.removeClassIncorrect(activeId, questionId);
    },

    hasIncorrectQuestions() {
        return this.getIncorrectCount() > 0;
    },

    getIncorrectCount() {
        const activeId = this.getActiveClass();
        return this.getClassIncorrectCount(activeId);
    },

    // === NOWE METODY ===

    // Osiagniecia
    getAchievements() {
        const value = localStorage.getItem(this.KEYS.ACHIEVEMENTS);
        return value !== null ? JSON.parse(value) : null;
    },

    setAchievements(achievements) {
        localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    },

    // Tablica wynikow
    getLeaderboard() {
        const value = localStorage.getItem(this.KEYS.LEADERBOARD);
        return value !== null ? JSON.parse(value) : null;
    },

    setLeaderboard(leaderboard) {
        localStorage.setItem(this.KEYS.LEADERBOARD, JSON.stringify(leaderboard));
    },

    // Dzienne wyzwanie
    getDailyCompleted() {
        return localStorage.getItem(this.KEYS.DAILY_COMPLETED);
    },

    setDailyCompleted(dateString) {
        localStorage.setItem(this.KEYS.DAILY_COMPLETED, dateString);
    },

    // Najlepsza seria
    getBestStreak() {
        const value = localStorage.getItem(this.KEYS.BEST_STREAK);
        return value !== null ? parseInt(value, 10) : null;
    },

    setBestStreak(streak) {
        localStorage.setItem(this.KEYS.BEST_STREAK, streak.toString());
    },

    // Ustawienia dzwieku - SFX
    getSoundSfx() {
        const value = localStorage.getItem(this.KEYS.SOUND_SFX);
        if (value === null) return null;
        return value === 'true';
    },

    setSoundSfx(enabled) {
        localStorage.setItem(this.KEYS.SOUND_SFX, enabled.toString());
    },

    // Ustawienia dzwieku - Muzyka
    getSoundMusic() {
        const value = localStorage.getItem(this.KEYS.SOUND_MUSIC);
        if (value === null) return null;
        return value === 'true';
    },

    setSoundMusic(enabled) {
        localStorage.setItem(this.KEYS.SOUND_MUSIC, enabled.toString());
    },

    // Statystyki kategorii
    getCategoryStats() {
        const value = localStorage.getItem(this.KEYS.CATEGORY_STATS);
        return value !== null ? JSON.parse(value) : null;
    },

    setCategoryStats(stats) {
        localStorage.setItem(this.KEYS.CATEGORY_STATS, JSON.stringify(stats));
    },

    incrementCategoryCorrect(category) {
        const stats = this.getCategoryStats() || {};
        stats[category] = (stats[category] || 0) + 1;
        this.setCategoryStats(stats);
    },

    // Najszybsza odpowiedz
    getFastestAnswer() {
        const value = localStorage.getItem(this.KEYS.FASTEST_ANSWER);
        return value !== null ? parseFloat(value) : null;
    },

    setFastestAnswer(time) {
        const current = this.getFastestAnswer();
        if (current === null || time < current) {
            localStorage.setItem(this.KEYS.FASTEST_ANSWER, time.toString());
        }
    },

    // Perfekcyjne gry
    getPerfectGames() {
        const value = localStorage.getItem(this.KEYS.PERFECT_GAMES);
        return value !== null ? parseInt(value, 10) : null;
    },

    setPerfectGames(count) {
        localStorage.setItem(this.KEYS.PERFECT_GAMES, count.toString());
    },

    incrementPerfectGames() {
        this.setPerfectGames((this.getPerfectGames() || 0) + 1);
    },

    // Ukonzcone wyzwania dnia
    getDailyChallengesCompleted() {
        const value = localStorage.getItem(this.KEYS.DAILY_CHALLENGES_COMPLETED);
        return value !== null ? parseInt(value, 10) : null;
    },

    setDailyChallengesCompleted(count) {
        localStorage.setItem(this.KEYS.DAILY_CHALLENGES_COMPLETED, count.toString());
    },

    incrementDailyChallengesCompleted() {
        this.setDailyChallengesCompleted((this.getDailyChallengesCompleted() || 0) + 1);
    },

    // Gry wygrane bez kol ratunkowych
    getGamesWonNoLifelines() {
        const value = localStorage.getItem(this.KEYS.GAMES_WON_NO_LIFELINES);
        return value !== null ? parseInt(value, 10) : null;
    },

    setGamesWonNoLifelines(count) {
        localStorage.setItem(this.KEYS.GAMES_WON_NO_LIFELINES, count.toString());
    },

    incrementGamesWonNoLifelines() {
        this.setGamesWonNoLifelines((this.getGamesWonNoLifelines() || 0) + 1);
    },

    // Legacy methods kept for compatibility during migration
    getGeneratedQuestions() {
        const value = localStorage.getItem(this.KEYS.GENERATED_QUESTIONS);
        if (value === null) return null;
        try { return JSON.parse(value); } catch (e) { return null; }
    },

    // Formatowanie pieniedzy
    formatMoney(amount) {
        return amount.toLocaleString('pl-PL') + ' PLN';
    },

    // Reset wszystkich danych
    resetAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        // Remove all per-class keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('milionerzy_questions_') || key.startsWith('milionerzy_incorrect_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        this.init();
    }
};

// Inicjalizacja przy ladowaniu
Storage.init();
