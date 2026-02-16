// leaderboard.js - System tablicy wynikow

const Leaderboard = {
    // Maksymalna liczba wpisow
    MAX_ENTRIES: 10,

    // Inicjalizacja
    init() {
        // Sprawdz czy istnieje tablica
        if (Storage.getLeaderboard() === null) {
            Storage.setLeaderboard([]);
        }
    },

    // Pobierz tablice wynikow
    getAll() {
        return Storage.getLeaderboard() || [];
    },

    // Pobierz top N wynikow
    getTop(count = 3) {
        const leaderboard = this.getAll();
        return leaderboard.slice(0, count);
    },

    // Dodaj wynik
    addScore(score, name = 'Gracz') {
        const leaderboard = this.getAll();
        const entry = {
            name: name,
            score: score,
            date: new Date().toISOString(),
            id: Date.now()
        };

        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);

        // Ogranicz do MAX_ENTRIES
        if (leaderboard.length > this.MAX_ENTRIES) {
            leaderboard.length = this.MAX_ENTRIES;
        }

        Storage.setLeaderboard(leaderboard);

        // Zwroc pozycje nowego wyniku
        return this.getPosition(entry.id);
    },

    // Pobierz pozycje wyniku
    getPosition(entryId) {
        const leaderboard = this.getAll();
        const index = leaderboard.findIndex(e => e.id === entryId);
        return index !== -1 ? index + 1 : null;
    },

    // Sprawdz czy wynik kwalifikuje sie do tablicy
    qualifies(score) {
        const leaderboard = this.getAll();
        if (leaderboard.length < this.MAX_ENTRIES) return true;
        const lowestScore = leaderboard[leaderboard.length - 1].score;
        return score > lowestScore;
    },

    // Pobierz najlepszy wynik
    getBestScore() {
        const leaderboard = this.getAll();
        return leaderboard.length > 0 ? leaderboard[0].score : 0;
    },

    // Wyczysc tablice
    clear() {
        Storage.setLeaderboard([]);
    },

    // Formatuj date
    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    // Renderuj tablice wynikow
    renderFull(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const leaderboard = this.getAll();

        if (leaderboard.length === 0) {
            container.innerHTML = '<p class="leaderboard-empty">Brak wynikow. Zagraj, aby pojawic sie na tablicy!</p>';
            return;
        }

        let html = '<div class="leaderboard-list">';
        leaderboard.forEach((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            html += `
                <div class="leaderboard-entry ${index < 3 ? 'top-3' : ''}">
                    <span class="leaderboard-rank">${medal || (index + 1)}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${Storage.formatMoney(entry.score)}</span>
                    <span class="leaderboard-date">${this.formatDate(entry.date)}</span>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    },

    // Renderuj podglad (top 3)
    renderPreview(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const top3 = this.getTop(3);

        if (top3.length === 0) {
            container.innerHTML = '<p class="leaderboard-empty">Brak wynikow</p>';
            return;
        }

        let html = '<div class="leaderboard-preview">';
        top3.forEach((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            html += `
                <div class="leaderboard-preview-entry">
                    <span class="leaderboard-medal">${medal}</span>
                    <span class="leaderboard-preview-score">${Storage.formatMoney(entry.score)}</span>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }
};

// Inicjalizacja po zaladowaniu
document.addEventListener('DOMContentLoaded', () => {
    Leaderboard.init();
});
