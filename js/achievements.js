// achievements.js - System osiagniec

const Achievements = {
    // Lista wszystkich osiagniec
    list: [
        {
            id: 'first_win',
            name: 'Pierwsza wygrana',
            description: 'Wygraj swoja pierwsza gre',
            icon: '🏆',
            condition: (stats) => stats.gamesWon >= 1
        },
        {
            id: 'streak_3',
            name: 'Dobra passa',
            description: 'Osiagnij serie 3 poprawnych odpowiedzi',
            icon: '🔥',
            condition: (stats) => stats.bestStreak >= 3
        },
        {
            id: 'streak_5',
            name: 'Niesamowita seria',
            description: 'Osiagnij serie 5 poprawnych odpowiedzi',
            icon: '🔥🔥',
            condition: (stats) => stats.bestStreak >= 5
        },
        {
            id: 'streak_10',
            name: 'Legenda',
            description: 'Osiagnij serie 10 poprawnych odpowiedzi',
            icon: '🔥🔥🔥',
            condition: (stats) => stats.bestStreak >= 10
        },
        {
            id: 'millionaire',
            name: 'Milioner',
            description: 'Zgromadz 1 000 000 PLN',
            icon: '💰',
            condition: (stats) => stats.totalEarned >= 1000000
        },
        {
            id: 'speed_demon',
            name: 'Blyskawica',
            description: 'Odpowiedz poprawnie w mniej niz 5 sekund',
            icon: '⚡',
            condition: (stats) => stats.fastestAnswer <= 5
        },
        {
            id: 'perfect_game',
            name: 'Perfekcyjna gra',
            description: 'Wygraj gre bez zadnej blednej odpowiedzi',
            icon: '⭐',
            condition: (stats) => stats.perfectGames >= 1
        },
        {
            id: 'master_density',
            name: 'Mistrz gestosci',
            description: 'Odpowiedz poprawnie na 10 pytan o gestosci',
            icon: '🧪',
            condition: (stats) => (stats.categoryCorrect?.['Gestosc'] || 0) >= 10
        },
        {
            id: 'master_pressure',
            name: 'Mistrz cisnienia',
            description: 'Odpowiedz poprawnie na 10 pytan o cisnieniu',
            icon: '🌊',
            condition: (stats) => (stats.categoryCorrect?.['Cisnienie'] || 0) >= 10
        },
        {
            id: 'master_archimedes',
            name: 'Uczen Archimedesa',
            description: 'Odpowiedz poprawnie na 10 pytan o Archimedesie',
            icon: '🏛️',
            condition: (stats) => (stats.categoryCorrect?.['Archimedes'] || 0) >= 10
        },
        {
            id: 'daily_champion',
            name: 'Codzienny mistrz',
            description: 'Ukonczył wyzwanie dnia',
            icon: '📅',
            condition: (stats) => stats.dailyChallengesCompleted >= 1
        },
        {
            id: 'collector',
            name: 'Kolekcjoner',
            description: 'Odblokuj 5 osiagniec',
            icon: '🎖️',
            condition: (stats) => stats.achievementsUnlocked >= 5
        },
        {
            id: 'no_lifelines',
            name: 'Na wlasna reke',
            description: 'Wygraj gre bez uzycia kol ratunkowych',
            icon: '💪',
            condition: (stats) => stats.gamesWonNoLifelines >= 1
        }
    ],

    // Inicjalizacja
    init() {
        // Sprawdz osiagniecia przy starcie
        this.checkAll();
    },

    // Pobierz wszystkie odblokowane osiagniecia
    getUnlocked() {
        return Storage.getAchievements() || [];
    },

    // Sprawdz czy osiagniecie jest odblokowane
    isUnlocked(achievementId) {
        const unlocked = this.getUnlocked();
        return unlocked.includes(achievementId);
    },

    // Odblokuj osiagniecie
    unlock(achievementId) {
        if (this.isUnlocked(achievementId)) return false;

        const achievements = this.getUnlocked();
        achievements.push(achievementId);
        Storage.setAchievements(achievements);

        // Pokaz notyfikacje
        const achievement = this.list.find(a => a.id === achievementId);
        if (achievement) {
            this.showNotification(achievement);
            // Odtwórz dzwiek
            if (typeof Sound !== 'undefined') {
                Sound.playAchievement();
            }
        }

        return true;
    },

    // Pobierz aktualne statystyki
    getCurrentStats() {
        return {
            gamesWon: Storage.getGamesWon() || 0,
            gamesPlayed: Storage.getGamesPlayed() || 0,
            bestStreak: Storage.getBestStreak() || 0,
            totalEarned: Storage.getTotalEarned() || 0,
            fastestAnswer: Storage.getFastestAnswer() || Infinity,
            perfectGames: Storage.getPerfectGames() || 0,
            categoryCorrect: Storage.getCategoryStats() || {},
            dailyChallengesCompleted: Storage.getDailyChallengesCompleted() || 0,
            achievementsUnlocked: (Storage.getAchievements() || []).length,
            gamesWonNoLifelines: Storage.getGamesWonNoLifelines() || 0
        };
    },

    // Sprawdz wszystkie osiagniecia
    checkAll() {
        const stats = this.getCurrentStats();
        let newUnlocks = [];

        this.list.forEach(achievement => {
            if (!this.isUnlocked(achievement.id) && achievement.condition(stats)) {
                this.unlock(achievement.id);
                newUnlocks.push(achievement);
            }
        });

        return newUnlocks;
    },

    // Sprawdz pojedyncze osiagniecie
    check(achievementId) {
        const achievement = this.list.find(a => a.id === achievementId);
        if (!achievement || this.isUnlocked(achievementId)) return false;

        const stats = this.getCurrentStats();
        if (achievement.condition(stats)) {
            this.unlock(achievementId);
            return true;
        }
        return false;
    },

    // Pokaz notyfikacje o odblokowaniu
    showNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">Osiagniecie odblokowane!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        document.body.appendChild(notification);

        // Animacja wejscia
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Usuniecie po 4 sekundach
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    },

    // Pobierz postep osiagniecia
    getProgress(achievementId) {
        const achievement = this.list.find(a => a.id === achievementId);
        if (!achievement) return null;

        const stats = this.getCurrentStats();

        // Okresl postep na podstawie ID
        switch (achievementId) {
            case 'streak_3':
                return { current: stats.bestStreak, target: 3 };
            case 'streak_5':
                return { current: stats.bestStreak, target: 5 };
            case 'streak_10':
                return { current: stats.bestStreak, target: 10 };
            case 'millionaire':
                return { current: stats.totalEarned, target: 1000000 };
            case 'master_density':
                return { current: stats.categoryCorrect?.['Gestosc'] || 0, target: 10 };
            case 'master_pressure':
                return { current: stats.categoryCorrect?.['Cisnienie'] || 0, target: 10 };
            case 'master_archimedes':
                return { current: stats.categoryCorrect?.['Archimedes'] || 0, target: 10 };
            case 'collector':
                return { current: stats.achievementsUnlocked, target: 5 };
            default:
                return null;
        }
    },

    // Pobierz wszystkie osiagniecia z ich statusem
    getAllWithStatus() {
        return this.list.map(achievement => ({
            ...achievement,
            unlocked: this.isUnlocked(achievement.id),
            progress: this.getProgress(achievement.id)
        }));
    }
};

// Inicjalizacja po zaladowaniu
document.addEventListener('DOMContentLoaded', () => {
    Achievements.init();
});
