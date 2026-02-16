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
        background: 'assets/sounds/background.mp3'
    },

    // Obiekty Audio
    audioCache: {},
    backgroundMusic: null,

    // Inicjalizacja
    init() {
        this.preloadSounds();
        this.initBackgroundMusic();
    },

    // Preload dzwiekow
    preloadSounds() {
        Object.entries(this.sounds).forEach(([key, path]) => {
            if (key !== 'background') {
                const audio = new Audio(path);
                audio.preload = 'auto';
                this.audioCache[key] = audio;
            }
        });
    },

    // Inicjalizacja muzyki w tle
    initBackgroundMusic() {
        this.backgroundMusic = new Audio(this.sounds.background);
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
        if (this.backgroundMusic && this.isMusicEnabled()) {
            this.backgroundMusic.play().catch(e => {
                console.log('Nie mozna uruchomic muzyki w tle');
            });
        }
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
