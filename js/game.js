// game.js - Logika gry Milionerzy

const Game = {
    // Stale gry
    QUESTIONS_PER_GAME: 10,
    MONEY_PER_CORRECT: 100000,
    MONEY_PER_WRONG: -100000,
    WIN_AMOUNT: 1000000,
    BASE_TIME: 45,
    MIN_TIME: 30,
    MAX_TIME: 60,

    // Stan gry
    questions: [],
    currentQuestionIndex: 0,
    currentMoney: 0,
    gameStartMoney: 0,
    timeLeft: 0,
    timerInterval: null,
    isAnswered: false,
    fiftyUsedThisQuestion: false,
    isPracticeMode: false,
    isDailyChallenge: false,
    questionStartTime: null,
    lifelinesUsedThisGame: 0,
    incorrectAnswersThisGame: 0,
    timerWarningPlayed: false,

    // Elementy DOM
    elements: {},

    // Inicjalizacja gry
    init() {
        this.cacheElements();
        this.bindEvents();
        this.applyTheme();
        this.updateLifelineCounts();
        this.setupKeyboard();
        this.startGame();

        // Inicjalizuj streak
        if (typeof Streak !== 'undefined') {
            Streak.init();
        }
    },

    // Cache elementow DOM
    cacheElements() {
        this.elements = {
            timerFill: document.getElementById('timer-fill'),
            timerText: document.getElementById('timer-text'),
            currentMoney: document.getElementById('current-money'),
            questionNumber: document.getElementById('question-number'),
            questionText: document.getElementById('question-text'),
            answersContainer: document.getElementById('answers-container'),
            answerBtns: document.querySelectorAll('.answer-btn'),
            explanationOverlay: document.getElementById('explanation-overlay'),
            explanationResult: document.getElementById('explanation-result'),
            explanationMoney: document.getElementById('explanation-money'),
            explanationText: document.getElementById('explanation-text'),
            explanationBody: document.querySelector('.explanation-body'),
            correctAnswerText: document.getElementById('correct-answer-text'),
            nextBtn: document.getElementById('next-btn'),
            endScreen: document.getElementById('end-screen'),
            endTitle: document.getElementById('end-title'),
            endMoney: document.getElementById('end-money'),
            lifelineFifty: document.getElementById('lifeline-fifty'),
            lifelineSkip: document.getElementById('lifeline-skip'),
            lifelineTime: document.getElementById('lifeline-time'),
            fiftyCount: document.getElementById('fifty-count'),
            skipCount: document.getElementById('skip-count'),
            timeCount: document.getElementById('time-count'),
            streakCounter: document.getElementById('streak-counter'),
            difficultyIndicator: document.getElementById('difficulty-indicator'),
            keyboardHints: document.getElementById('keyboard-hints')
        };
    },

    // Bindowanie eventow
    bindEvents() {
        // Odpowiedzi
        this.elements.answerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e));
        });

        // Przycisk nastepne pytanie
        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());

        // Kola ratunkowe
        this.elements.lifelineFifty.addEventListener('click', () => this.useFiftyFifty());
        this.elements.lifelineSkip.addEventListener('click', () => this.useSkip());
        this.elements.lifelineTime.addEventListener('click', () => this.useExtraTime());
    },

    // Setup klawiatury
    setupKeyboard() {
        if (typeof Keyboard !== 'undefined') {
            Keyboard.setAnswerCallback((index) => {
                if (this.isAnswered) return;
                const question = this.questions[this.currentQuestionIndex];
                const maxAnswers = question.type === 'truefalse' ? 2 : 4;
                if (index < maxAnswers) {
                    const btn = this.elements.answerBtns[index];
                    if (btn && !btn.disabled && !btn.classList.contains('hidden')) {
                        btn.click();
                    }
                }
            });

            Keyboard.setNextCallback(() => {
                if (this.elements.explanationOverlay.classList.contains('active')) {
                    this.nextQuestion();
                }
            });

            Keyboard.setEscapeCallback(() => {
                // Powrot do menu
                if (confirm('Czy na pewno chcesz wyjsc? Postep zostanie utracony.')) {
                    window.location.href = 'index.html';
                }
            });
        }
    },

    // Zastosowanie motywu i tla
    applyTheme() {
        const theme = Storage.getActiveTheme();
        const background = Storage.getActiveBackground();

        document.body.className = '';

        if (theme && theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }

        if (background && background !== 'default') {
            document.body.classList.add(`bg-${background}`);
        }

        const starsElement = document.querySelector('.stars');
        if (starsElement) {
            starsElement.style.display = theme === 'cosmic' ? 'block' : 'none';
        }
    },

    // Aktualizacja licznikow kol ratunkowych
    updateLifelineCounts() {
        const lifelines = Storage.getLifelines();
        this.elements.fiftyCount.textContent = `x${lifelines.fifty}`;
        this.elements.skipCount.textContent = `x${lifelines.skip}`;
        this.elements.timeCount.textContent = `x${lifelines.time}`;

        this.elements.lifelineFifty.disabled = lifelines.fifty <= 0;
        this.elements.lifelineSkip.disabled = lifelines.skip <= 0;
        this.elements.lifelineTime.disabled = lifelines.time <= 0;
    },

    // Start gry
    startGame() {
        // Zaladuj pytania z cache (jesli sa wygenerowane przez AI)
        if (typeof loadCachedQuestions === 'function') {
            loadCachedQuestions();
        }

        // Sprawdz tryb gry
        const urlParams = new URLSearchParams(window.location.search);
        this.isPracticeMode = urlParams.get('practice') === 'true';
        this.isDailyChallenge = urlParams.get('daily') === 'true';

        // Reset statystyk gry
        this.lifelinesUsedThisGame = 0;
        this.incorrectAnswersThisGame = 0;

        if (this.isDailyChallenge) {
            // Tryb dziennego wyzwania
            if (typeof Daily !== 'undefined' && Daily.isCompletedToday()) {
                alert('Dzisiejsze wyzwanie zostalo juz ukonczone! Wroc jutro.');
                window.location.href = 'index.html';
                return;
            }
            this.questions = Daily.getDailyQuestions().map(q => shuffleAnswers(q));
        } else if (this.isPracticeMode) {
            // Tryb cwiczen - pobierz tylko bledne pytania
            const incorrectIds = Storage.getIncorrectQuestions() || [];
            const incorrectQuestions = Questions.filter(q => incorrectIds.includes(q.id));
            this.questions = incorrectQuestions.map(q => shuffleAnswers(q));

            // Jesli brak blednych pytan, wroc do menu
            if (this.questions.length === 0) {
                alert('Nie masz zadnych blednych pytan do cwiczenia!');
                window.location.href = 'index.html';
                return;
            }
        } else {
            // Normalny tryb
            this.questions = getRandomQuestions(this.QUESTIONS_PER_GAME).map(q => shuffleAnswers(q));
            Storage.incrementGamesPlayed();
        }

        this.currentQuestionIndex = 0;
        this.gameStartMoney = Storage.getMoney();
        this.currentMoney = 0;

        // Reset streak
        if (typeof Streak !== 'undefined') {
            Streak.reset();
        }

        this.loadQuestion();
    },

    // Ladowanie pytania
    loadQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endGame(false);
            return;
        }

        this.isAnswered = false;
        this.fiftyUsedThisQuestion = false;
        this.timerWarningPlayed = false;
        const question = this.questions[this.currentQuestionIndex];

        // Zapisz czas rozpoczecia pytania
        this.questionStartTime = Date.now();

        // Aktualizuj UI
        const questionNum = this.currentQuestionIndex + 1;
        if (this.isDailyChallenge) {
            this.elements.questionNumber.textContent = `Wyzwanie dnia ${questionNum}/${this.questions.length}`;
        } else if (this.isPracticeMode) {
            this.elements.questionNumber.textContent = `Cwiczenie ${questionNum}/${this.questions.length}`;
        } else {
            this.elements.questionNumber.textContent = `Pytanie ${questionNum}/${this.questions.length}`;
        }
        this.elements.questionText.textContent = question.question;
        this.elements.currentMoney.textContent = Storage.formatMoney(Math.max(0, this.currentMoney));

        // Aktualizuj wskaznik trudnosci
        this.updateDifficultyIndicator(questionNum);

        // Aktualizuj licznik streakow
        this.updateStreakDisplay();

        // Ustaw odpowiedzi
        if (question.type === 'truefalse') {
            // Pytanie prawda/falsz - pokaz tylko 2 przyciski
            const tfLabels = ['Prawda', 'Falsz'];
            this.elements.answerBtns.forEach((btn, index) => {
                btn.classList.remove('selected', 'correct', 'incorrect', 'hidden');
                if (index < 2) {
                    btn.disabled = false;
                    btn.style.display = '';
                    btn.querySelector('.answer-letter').textContent = '';
                    btn.querySelector('.answer-text').textContent = tfLabels[index];
                } else {
                    btn.style.display = 'none';
                    btn.disabled = true;
                }
            });
        } else {
            // Normalne pytanie - 4 odpowiedzi
            const letters = ['A', 'B', 'C', 'D'];
            this.elements.answerBtns.forEach((btn, index) => {
                btn.classList.remove('selected', 'correct', 'incorrect', 'hidden');
                btn.style.display = '';
                btn.disabled = false;
                btn.querySelector('.answer-letter').textContent = `${letters[index]}:`;
                btn.querySelector('.answer-text').textContent = question.answers[index].text;
            });
        }

        // Aktualizuj kola ratunkowe
        this.updateLifelineCounts();

        // Wylacz 50:50 dla pytan prawda/falsz
        if (question.type === 'truefalse') {
            this.elements.lifelineFifty.disabled = true;
        }

        // Start timer
        this.startTimer();
    },

    // Aktualizuj wskaznik trudnosci
    updateDifficultyIndicator(questionNum) {
        if (this.elements.difficultyIndicator && typeof Difficulty !== 'undefined') {
            const levelName = Difficulty.getLevelName(questionNum);
            const levelColor = Difficulty.getLevelColor(questionNum);
            const multiplier = Difficulty.getMoneyMultiplier(questionNum);
            this.elements.difficultyIndicator.innerHTML = `
                <span style="color: ${levelColor}">${levelName}</span>
                <span class="multiplier">x${multiplier} PLN</span>
            `;
        }
    },

    // Aktualizuj wyswietlanie streaka
    updateStreakDisplay() {
        if (this.elements.streakCounter && typeof Streak !== 'undefined') {
            const info = Streak.getDisplayInfo();
            if (info.isActive) {
                this.elements.streakCounter.innerHTML = `
                    <span class="streak-fire">${info.fire}</span>
                    <span class="streak-count">${info.streak}</span>
                    <span class="streak-multiplier">x${info.multiplier}</span>
                `;
                this.elements.streakCounter.classList.add('active');
            } else {
                this.elements.streakCounter.classList.remove('active');
                this.elements.streakCounter.innerHTML = '';
            }
        }
    },

    // Timer
    startTimer() {
        this.stopTimer();

        // Pobierz czas z systemu trudnosci
        const questionNum = this.currentQuestionIndex + 1;
        if (typeof Difficulty !== 'undefined') {
            this.timeLeft = Difficulty.getTimerForQuestion(questionNum);
        } else {
            // Fallback
            const progress = this.currentQuestionIndex / this.questions.length;
            this.timeLeft = Math.round(this.MAX_TIME - (this.MAX_TIME - this.MIN_TIME) * progress);
        }

        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            // Dzwiek ostrzezenia
            if (this.timeLeft === 10 && !this.timerWarningPlayed) {
                this.timerWarningPlayed = true;
                if (typeof Sound !== 'undefined') {
                    Sound.playTimerWarning();
                }
            }

            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.handleTimeOut();
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    updateTimerDisplay() {
        const maxTime = this.MAX_TIME;
        const percentage = (this.timeLeft / maxTime) * 100;

        this.elements.timerFill.style.width = `${percentage}%`;
        this.elements.timerText.textContent = `${this.timeLeft}s`;

        // Zmien kolor w zaleznosci od czasu
        this.elements.timerFill.classList.remove('warning', 'danger');
        if (this.timeLeft <= 10) {
            this.elements.timerFill.classList.add('danger');
        } else if (this.timeLeft <= 20) {
            this.elements.timerFill.classList.add('warning');
        }
    },

    // Obsluga timeout
    handleTimeOut() {
        if (this.isAnswered) return;
        this.isAnswered = true;

        // Reset streak
        if (typeof Streak !== 'undefined') {
            Streak.reset();
        }
        this.incorrectAnswersThisGame++;

        // Znajdz poprawna odpowiedz i pokaz ja
        const question = this.questions[this.currentQuestionIndex];
        let correctIndex;
        if (question.type === 'truefalse') {
            correctIndex = question.correctAnswer ? 0 : 1;
        } else {
            correctIndex = question.answers.findIndex(a => a.correct);
        }
        this.elements.answerBtns[correctIndex].classList.add('correct');

        // Odejmij pieniadze
        this.currentMoney = Math.max(-this.gameStartMoney, this.currentMoney + this.MONEY_PER_WRONG);
        Storage.setMoney(this.gameStartMoney + this.currentMoney);

        // Zapisz jako bledne pytanie
        Storage.addIncorrectQuestion(question.id);

        // Dzwiek blednej odpowiedzi
        if (typeof Sound !== 'undefined') {
            Sound.playIncorrect();
        }

        // Pokaz wyjasnienie
        this.showExplanation(false, question.explanation, 'Czas minal!');
    },

    // Obsluga odpowiedzi
    handleAnswer(e) {
        if (this.isAnswered) return;
        this.isAnswered = true;
        this.stopTimer();

        const selectedBtn = e.currentTarget;
        const selectedIndex = parseInt(selectedBtn.dataset.index);
        const question = this.questions[this.currentQuestionIndex];
        const questionNum = this.currentQuestionIndex + 1;

        // Oblicz czas odpowiedzi
        const answerTime = (Date.now() - this.questionStartTime) / 1000;

        // Sprawdz poprawnosc w zaleznosci od typu pytania
        let isCorrect;
        let correctIndex;
        if (question.type === 'truefalse') {
            // Prawda = index 0, Falsz = index 1
            const userAnsweredTrue = selectedIndex === 0;
            isCorrect = userAnsweredTrue === question.correctAnswer;
            correctIndex = question.correctAnswer ? 0 : 1;
        } else {
            isCorrect = question.answers[selectedIndex].correct;
            correctIndex = question.answers.findIndex(a => a.correct);
        }

        // Zablokuj przyciski
        this.elements.answerBtns.forEach(btn => btn.disabled = true);

        // Animacja wyboru
        selectedBtn.classList.add('selected');

        // Dzwiek klikniecia
        if (typeof Sound !== 'undefined') {
            Sound.playClick();
        }

        // Po chwili pokaz wynik
        setTimeout(() => {
            if (isCorrect) {
                selectedBtn.classList.remove('selected');
                selectedBtn.classList.add('correct');

                // Aktualizuj streak
                if (typeof Streak !== 'undefined') {
                    Streak.increment();
                    if (Streak.isNewMultiplierLevel()) {
                        Sound.playStreak();
                    }
                }

                // Oblicz nagrode z mnoznikami
                let reward = this.MONEY_PER_CORRECT;
                const streakMultiplier = typeof Streak !== 'undefined' ? Streak.getMultiplier() : 1;
                if (typeof Difficulty !== 'undefined') {
                    reward = Difficulty.calculateReward(this.MONEY_PER_CORRECT, questionNum, streakMultiplier);
                } else {
                    reward = Math.round(this.MONEY_PER_CORRECT * streakMultiplier);
                }

                // Bonus za dzienne wyzwanie
                if (this.isDailyChallenge && typeof Daily !== 'undefined') {
                    reward = Math.round(reward * Daily.MONEY_MULTIPLIER);
                }

                this.currentMoney += reward;
                Storage.setMoney(this.gameStartMoney + this.currentMoney);

                // Zapisz najszybsza odpowiedz
                Storage.setFastestAnswer(answerTime);

                // Aktualizuj statystyki kategorii
                if (question.category) {
                    const mainCategory = this.getMainCategory(question.category);
                    Storage.incrementCategoryCorrect(mainCategory);
                }

                // Usun z blednych pytan jesli odpowiedziano poprawnie
                Storage.removeIncorrectQuestion(question.id);

                // Dzwiek poprawnej odpowiedzi
                if (typeof Sound !== 'undefined') {
                    Sound.playCorrect();
                }

                // Animacja pieniedzy
                this.showFloatingMoney(reward, true);

                this.showExplanation(true, question.explanation, null, reward);
            } else {
                selectedBtn.classList.remove('selected');
                selectedBtn.classList.add('incorrect');

                // Reset streak
                if (typeof Streak !== 'undefined') {
                    Streak.reset();
                }
                this.incorrectAnswersThisGame++;

                // Pokaz poprawna odpowiedz
                this.elements.answerBtns[correctIndex].classList.add('correct');

                // Odejmij pieniadze (minimum 0)
                this.currentMoney = Math.max(-this.gameStartMoney, this.currentMoney + this.MONEY_PER_WRONG);
                Storage.setMoney(this.gameStartMoney + this.currentMoney);

                // Zapisz jako bledne pytanie
                Storage.addIncorrectQuestion(question.id);

                // Dzwiek blednej odpowiedzi
                if (typeof Sound !== 'undefined') {
                    Sound.playIncorrect();
                }

                // Animacja pieniedzy
                this.showFloatingMoney(this.MONEY_PER_WRONG, false);

                this.showExplanation(false, question.explanation);
            }

            // Sprawdz osiagniecia
            if (typeof Achievements !== 'undefined') {
                Achievements.checkAll();
            }
        }, 1500);
    },

    // Pobierz glowna kategorie - deleguje do globalnej funkcji z questions.js
    getMainCategory(category) {
        if (typeof getMainCategory === 'function') {
            return getMainCategory(category);
        }
        return category;
    },

    // Pokaz animacje pieniedzy
    showFloatingMoney(amount, isPositive) {
        const floater = document.createElement('div');
        floater.className = `floating-money ${isPositive ? 'positive' : 'negative'}`;
        floater.textContent = isPositive ? `+${Storage.formatMoney(amount)}` : Storage.formatMoney(amount);
        document.body.appendChild(floater);

        setTimeout(() => floater.remove(), 2000);
    },

    // Pokaz wyjasnienie
    showExplanation(isCorrect, explanation, customTitle = null, reward = null) {
        const question = this.questions[this.currentQuestionIndex];
        let correctAnswerText;
        if (question.type === 'truefalse') {
            correctAnswerText = question.correctAnswer ? 'Prawda' : 'Falsz';
        } else {
            correctAnswerText = question.answers.find(a => a.correct).text;
        }
        const moneyChange = isCorrect ? (reward || this.MONEY_PER_CORRECT) : this.MONEY_PER_WRONG;

        // Tytul wyniku
        this.elements.explanationResult.textContent = customTitle || (isCorrect ? 'Poprawna odpowiedz!' : 'Bledna odpowiedz!');
        this.elements.explanationResult.className = `explanation-result ${isCorrect ? 'correct' : 'incorrect'}`;

        // Zmiana pieniedzy
        const moneyText = moneyChange >= 0 ? `+${Storage.formatMoney(moneyChange)}` : Storage.formatMoney(moneyChange);
        this.elements.explanationMoney.textContent = moneyText;

        // Pokaz informacje o streaku i mnoznikach
        if (isCorrect && typeof Streak !== 'undefined') {
            const info = Streak.getDisplayInfo();
            if (info.isActive) {
                this.elements.explanationMoney.innerHTML = `${moneyText} <span class="streak-bonus">${info.fire} x${info.multiplier}</span>`;
            }
        }

        // Pokaz poprawna odpowiedz
        this.elements.correctAnswerText.textContent = correctAnswerText;

        // Wyjasnienie z formatowaniem
        if (this.elements.explanationBody) {
            this.elements.explanationBody.innerHTML = this.formatExplanation(explanation);
        }

        // Zmien tekst przycisku
        if (this.currentQuestionIndex >= this.questions.length - 1) {
            this.elements.nextBtn.textContent = 'Zobacz wynik';
        } else {
            this.elements.nextBtn.textContent = 'Nastepne pytanie';
        }

        this.elements.explanationOverlay.classList.add('active');
    },

    // Formatowanie wyjasnienia z formulami
    formatExplanation(text) {
        // Zamien wzory w nawiasach kwadratowych na sformatowane
        let formatted = text;

        // Wzory matematyczne: [wzor] -> <span class="formula">wzor</span>
        formatted = formatted.replace(/\[([^\]]+)\]/g, '<span class="formula">$1</span>');

        // Przyklady: {przyklad} -> <span class="example">przyklad</span>
        formatted = formatted.replace(/\{([^}]+)\}/g, '<span class="example">$1</span>');

        // Wazne terminy: *termin* -> <span class="highlight">termin</span>
        formatted = formatted.replace(/\*([^*]+)\*/g, '<span class="highlight">$1</span>');

        return formatted;
    },

    // Nastepne pytanie
    nextQuestion() {
        this.elements.explanationOverlay.classList.remove('active');
        this.currentQuestionIndex++;
        this.loadQuestion();
    },

    // Koniec gry
    endGame(isWin) {
        this.stopTimer();
        this.elements.explanationOverlay.classList.remove('active');

        const earned = this.currentMoney;
        const isPerfect = this.incorrectAnswersThisGame === 0 && !this.isPracticeMode;
        const noLifelines = this.lifelinesUsedThisGame === 0;

        if (this.isDailyChallenge && typeof Daily !== 'undefined') {
            // Oznacz dzienne wyzwanie jako ukonczone
            Daily.markCompleted();
            this.elements.endTitle.textContent = 'Wyzwanie dnia ukonczone!';
            this.elements.endTitle.className = 'end-title win';

            // Sprawdz osiagniecie daily_champion
            if (typeof Achievements !== 'undefined') {
                Achievements.check('daily_champion');
            }
        } else if (this.isPracticeMode) {
            // Tryb cwiczen - pokazanie podsumowania
            const remainingIncorrect = Storage.getIncorrectCount();
            this.elements.endTitle.textContent = 'Cwiczenie zakonczone!';
            this.elements.endTitle.className = 'end-title win';
            if (remainingIncorrect === 0) {
                this.elements.endMoney.textContent = 'Swietnie! Opanowales wszystkie pytania!';
            } else {
                this.elements.endMoney.textContent = `Pozostalo ${remainingIncorrect} pytan do powtorki.`;
            }
        } else {
            // Normalny tryb
            if (isWin || earned > 0) {
                this.elements.endTitle.textContent = 'Gratulacje!';
                this.elements.endTitle.className = 'end-title win';
                Storage.incrementGamesWon();

                // Sprawdz osiagniecie first_win
                if (typeof Achievements !== 'undefined') {
                    Achievements.check('first_win');
                }

                // Perfekcyjna gra
                if (isPerfect) {
                    Storage.incrementPerfectGames();
                    if (typeof Achievements !== 'undefined') {
                        Achievements.check('perfect_game');
                    }
                }

                // Gra bez kol ratunkowych
                if (noLifelines && isPerfect) {
                    Storage.incrementGamesWonNoLifelines();
                    if (typeof Achievements !== 'undefined') {
                        Achievements.check('no_lifelines');
                    }
                }
            } else {
                this.elements.endTitle.textContent = 'Koniec gry!';
                this.elements.endTitle.className = 'end-title lose';
            }

            const earnedText = earned >= 0 ? `+${Storage.formatMoney(earned)}` : Storage.formatMoney(earned);
            this.elements.endMoney.textContent = `Zarobiles w tej grze: ${earnedText}`;

            // Dodaj do tablicy wynikow
            if (earned > 0 && typeof Leaderboard !== 'undefined') {
                const position = Leaderboard.addScore(earned, 'Gracz');
                if (position && position <= 10) {
                    this.elements.endMoney.innerHTML += `<br><span class="leaderboard-position">Miejsce #${position} na tablicy wynikow!</span>`;
                }
            }
        }

        // Sprawdz wszystkie osiagniecia na koniec gry
        if (typeof Achievements !== 'undefined') {
            Achievements.checkAll();
        }

        this.elements.endScreen.classList.add('active');

        // Save progress to server if logged in
        if (typeof Auth !== 'undefined') {
            Auth.scheduleSave();
        }
    },

    // === KOLA RATUNKOWE ===

    // 50:50 - usuwa bledne odpowiedzi
    useFiftyFifty() {
        if (this.isAnswered || this.fiftyUsedThisQuestion) return;
        if (!Storage.useLifeline('fifty')) return;

        this.fiftyUsedThisQuestion = true;
        this.lifelinesUsedThisGame++;
        this.updateLifelineCounts();

        const question = this.questions[this.currentQuestionIndex];
        const questionNum = this.currentQuestionIndex + 1;
        const correctIndex = question.answers.findIndex(a => a.correct);

        // Znajdz bledne odpowiedzi
        const wrongIndices = [];
        question.answers.forEach((answer, index) => {
            if (!answer.correct) wrongIndices.push(index);
        });

        // Ile usunac (zalezy od trudnosci)
        let toRemoveCount = 2;
        if (typeof Difficulty !== 'undefined') {
            toRemoveCount = Difficulty.getFiftyRemoves(questionNum);
        }

        // Losowo wybierz do ukrycia
        const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
        const toHide = shuffled.slice(0, toRemoveCount);

        toHide.forEach(index => {
            this.elements.answerBtns[index].classList.add('hidden');
            this.elements.answerBtns[index].disabled = true;
        });

        // Dzwiek
        if (typeof Sound !== 'undefined') {
            Sound.playClick();
        }
    },

    // Pomin pytanie
    useSkip() {
        if (this.isAnswered) return;
        if (!Storage.useLifeline('skip')) return;

        this.stopTimer();
        this.lifelinesUsedThisGame++;
        this.updateLifelineCounts();

        // Dzwiek
        if (typeof Sound !== 'undefined') {
            Sound.playClick();
        }

        this.currentQuestionIndex++;
        this.loadQuestion();
    },

    // Dodatkowy czas (+30 sekund)
    useExtraTime() {
        if (this.isAnswered) return;
        if (!Storage.useLifeline('time')) return;

        this.timeLeft += 30;
        this.lifelinesUsedThisGame++;
        this.updateLifelineCounts();
        this.updateTimerDisplay();

        // Dzwiek
        if (typeof Sound !== 'undefined') {
            Sound.playClick();
        }
    }
};

// Start gry po zaladowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
