// sound.js - System dzwiekow dla gry Milionerzy

const Sound = {
    // Sciezki do plikow dzwiekowych
    sounds: {
        correct: 'assets/sounds/correct.mp3',
        incorrect: 'assets/sounds/incorrect.mp3',
        timerWarning: 'assets/sounds/timer-warning.mp3',
        achievement: 'assets/sounds/achievement.mp3',
        streak: 'assets/sounds/streak.mp3',
        click: 'assets/sounds/click.mp3',
        // Muzyka w tle - osobny utwor dla menu i dla gry
        menuMusic: 'assets/sounds/menu-music.m4a',
        gameMusic: 'assets/sounds/game-music.m4a'
    },

    // Klucze utworow muzycznych (nie sa traktowane jak SFX)
    musicKeys: ['menuMusic', 'gameMusic'],

    // Obiekty Audio
    audioCache: {},
    backgroundMusic: null,
    currentMusicKey: null,
    _autoplayArmed: false,
    // Gdy true (np. w trakcie gry), muzyka gra automatycznie,
    // chyba ze uzytkownik JAWNIE ja wyciszyl.
    _forcePlay: false,

    // Inicjalizacja
    init() {
        this.preloadSounds();
        // Wybierz utwor na podstawie strony (data-music="menu" | "game")
        const page = document.body.dataset.music || 'menu';
        const key = page === 'game' ? 'gameMusic' : 'menuMusic';
        this.initBackgroundMusic(key);
        // Auto-start jesli uzytkownik wczesniej wlaczyl muzyke
        if (this.isMusicEnabled()) {
            this.playBackgroundMusic();
        }
    },

    // Czy dany klucz to muzyka w tle
    isMusicKey(key) {
        return this.musicKeys.includes(key);
    },

    // Preload dzwiekow (tylko SFX, nie muzyka)
    preloadSounds() {
        Object.entries(this.sounds).forEach(([key, path]) => {
            if (!this.isMusicKey(key)) {
                const audio = new Audio(path);
                audio.preload = 'auto';
                this.audioCache[key] = audio;
            }
        });
    },

    // Inicjalizacja muzyki w tle dla wybranego utworu
    initBackgroundMusic(key) {
        this.currentMusicKey = key;
        this.backgroundMusic = new Audio(this.sounds[key]);
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3;
    },

    // Sprawdz czy SFX sa wlaczone
    isSfxEnabled() {
        const value = Storage.getSoundSfx();
        return value === null ? true : value;
    },

    // Sprawdz czy muzyka jest wlaczona
    isMusicEnabled() {
        const value = Storage.getSoundMusic();
        return value === null ? false : value;
    },

    // Czy uzytkownik JAWNIE wyciszyl muzyke (a nie tylko domyslnie wylaczona)
    isMusicMuted() {
        return Storage.getSoundMusic() === false;
    },

    // Czy muzyka powinna teraz grac
    shouldPlayMusic() {
        // W grze: graj, chyba ze jawnie wyciszona. Poza gra: wg ustawienia.
        return this._forcePlay ? !this.isMusicMuted() : this.isMusicEnabled();
    },

    // Wlacz muzyke pytan w grze (auto-play, chyba ze jawnie wyciszona)
    startGameMusic() {
        this._forcePlay = true;
        if (this.currentMusicKey !== 'gameMusic') {
            this.stopBackgroundMusic();
            this.initBackgroundMusic('gameMusic');
        }
        this.playBackgroundMusic();
    },

    // Ustaw SFX
    setSfxEnabled(enabled) {
        Storage.setSoundSfx(enabled);
    },

    // Ustaw muzyke
    setMusicEnabled(enabled) {
        Storage.setSoundMusic(enabled);
        if (enabled) {
            this.playBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    },

    // Odtwarzaj dzwiek
    play(soundName) {
        if (!this.isSfxEnabled()) return;

        const audio = this.audioCache[soundName];
        if (audio) {
            // Klonuj audio dla wielokrotnego odtwarzania
            const clone = audio.cloneNode();
            clone.volume = 0.5;
            clone.play().catch(e => {
                // Ignoruj bledy odtwarzania (np. brak pliku)
                console.log(`Nie mozna odtworzyc: ${soundName}`);
            });
        }
    },

    // Odtwarzaj dzwiek poprawnej odpowiedzi
    playCorrect() {
        this.play('correct');
    },

    // Odtwarzaj dzwiek blednej odpowiedzi
    playIncorrect() {
        this.play('incorrect');
    },

    // Odtwarzaj dzwiek ostrzezenia czasowego
    playTimerWarning() {
        this.play('timerWarning');
    },

    // Odtwarzaj dzwiek osiagniecia
    playAchievement() {
        this.play('achievement');
    },

    // Odtwarzaj dzwiek streak
    playStreak() {
        this.play('streak');
    },

    // Odtwarzaj dzwiek klikniecia
    playClick() {
        this.play('click');
    },

    // Uruchom muzyke w tle
    playBackgroundMusic() {
        if (this.backgroundMusic && this.shouldPlayMusic()) {
            this.backgroundMusic.play().catch(e => {
                // Przegladarka blokuje autoodtwarzanie do pierwszej interakcji
                this.armAutoplayFallback();
            });
        }
    },

    // Uruchom muzyke po pierwszym klikniecie/nacisnieciu klawisza
    armAutoplayFallback() {
        if (this._autoplayArmed) return;
        this._autoplayArmed = true;
        const start = () => {
            this._autoplayArmed = false;
            document.removeEventListener('click', start);
            document.removeEventListener('keydown', start);
            this.playBackgroundMusic();
        };
        document.addEventListener('click', start, { once: true });
        document.addEventListener('keydown', start, { once: true });
    },

    // Zatrzymaj muzyke w tle
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    },

    // Przelacz SFX
    toggleSfx() {
        const enabled = !this.isSfxEnabled();
        this.setSfxEnabled(enabled);
        return enabled;
    },

    // Przelacz muzyke
    toggleMusic() {
        const enabled = !this.isMusicEnabled();
        this.setMusicEnabled(enabled);
        return enabled;
    }
};

// Inicjalizacja po zaladowaniu
document.addEventListener('DOMContentLoaded', () => {
    Sound.init();
});
