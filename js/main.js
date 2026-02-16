// main.js - Logika menu glownego

document.addEventListener('DOMContentLoaded', () => {
    // Aktualizacja wyswietlania pieniedzy
    updateMoneyDisplay();
    updateStatsDisplay();
    updatePracticeButton();
    applyTheme();
    setupFormulasModal();
    setupCodeInput();
    setupSoundToggles();
    setupDailyChallenge();
    setupLeaderboardPreview();
    setupCategoryFilter();

    // Nowe setup functions
    setupSetupPanel();
    setupClassConfig();
    setupImageUpload();
    setupGenerateButton();
    updateSubtitle();
    updateFormulasVisibility();

    // Class selector
    renderClassCards();
});

function updateMoneyDisplay() {
    const moneyElement = document.getElementById('money-amount');
    if (moneyElement) {
        const money = Storage.getMoney() || 0;
        moneyElement.textContent = Storage.formatMoney(money);
    }
}

function updateStatsDisplay() {
    const gamesPlayedElement = document.getElementById('games-played');
    const gamesWonElement = document.getElementById('games-won');
    const bestStreakElement = document.getElementById('best-streak');

    if (gamesPlayedElement) {
        gamesPlayedElement.textContent = Storage.getGamesPlayed() || 0;
    }
    if (gamesWonElement) {
        gamesWonElement.textContent = Storage.getGamesWon() || 0;
    }
    if (bestStreakElement) {
        bestStreakElement.textContent = Storage.getBestStreak() || 0;
    }
}

function applyTheme() {
    const theme = Storage.getActiveTheme();
    const background = Storage.getActiveBackground();

    document.body.className = '';

    if (theme && theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }

    if (background && background !== 'default') {
        document.body.classList.add(`bg-${background}`);
    }

    // Pokaz gwiazdki dla motywu kosmicznego
    const starsElement = document.querySelector('.stars');
    if (starsElement) {
        starsElement.style.display = theme === 'cosmic' ? 'block' : 'none';
    }
}

function updatePracticeButton() {
    const practiceBtn = document.getElementById('practice-btn');
    const practiceCount = document.getElementById('practice-count');

    if (practiceBtn && practiceCount) {
        const incorrectCount = Storage.getIncorrectCount();
        if (incorrectCount > 0) {
            practiceCount.textContent = `(${incorrectCount})`;
            practiceBtn.classList.remove('disabled');
        } else {
            practiceCount.textContent = '(0)';
            practiceBtn.classList.add('disabled');
        }
    }
}

function setupFormulasModal() {
    const formulasBtn = document.getElementById('formulas-btn');
    const formulasModal = document.getElementById('formulas-modal');
    const formulasClose = document.getElementById('formulas-close');

    if (formulasBtn && formulasModal) {
        formulasBtn.addEventListener('click', () => {
            formulasModal.classList.add('active');
        });

        if (formulasClose) {
            formulasClose.addEventListener('click', () => {
                formulasModal.classList.remove('active');
            });
        }

        // Zamknij po kliknieciu w tlo
        formulasModal.addEventListener('click', (e) => {
            if (e.target === formulasModal) {
                formulasModal.classList.remove('active');
            }
        });

        // Zamknij na ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && formulasModal.classList.contains('active')) {
                formulasModal.classList.remove('active');
            }
        });
    }
}

function setupCodeInput() {
    const codeInput = document.getElementById('code-input');
    const codeBtn = document.getElementById('code-btn');
    const codeMessage = document.getElementById('code-message');

    if (codeBtn && codeInput && codeMessage) {
        codeBtn.addEventListener('click', () => {
            const code = codeInput.value.trim();

            if (code === 'Markot') {
                // Dodaj 1000000 do konta
                const currentMoney = Storage.getMoney() || 0;
                Storage.setMoney(currentMoney + 1000000);
                updateMoneyDisplay();

                codeMessage.style.color = '#4CAF50';
                codeMessage.textContent = 'Kod poprawny! Otrzymujesz 1 000 000 PLN!';
                codeInput.value = '';
            } else {
                codeMessage.style.color = '#f44336';
                codeMessage.textContent = 'Niepoprawny kod!';
            }

            // Ukryj wiadomosc po 3 sekundach
            setTimeout(() => {
                codeMessage.textContent = '';
            }, 3000);
        });

        // Obsluga Enter
        codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                codeBtn.click();
            }
        });
    }
}

function setupSoundToggles() {
    const sfxToggle = document.getElementById('sfx-toggle');
    const musicToggle = document.getElementById('music-toggle');

    if (sfxToggle) {
        // Ustaw stan poczatkowy
        const sfxEnabled = typeof Sound !== 'undefined' ? Sound.isSfxEnabled() : true;
        sfxToggle.textContent = sfxEnabled ? 'SFX: ON' : 'SFX: OFF';
        sfxToggle.classList.toggle('active', sfxEnabled);

        sfxToggle.addEventListener('click', () => {
            if (typeof Sound !== 'undefined') {
                const enabled = Sound.toggleSfx();
                sfxToggle.textContent = enabled ? 'SFX: ON' : 'SFX: OFF';
                sfxToggle.classList.toggle('active', enabled);
            }
        });
    }

    if (musicToggle) {
        // Ustaw stan poczatkowy
        const musicEnabled = typeof Sound !== 'undefined' ? Sound.isMusicEnabled() : false;
        musicToggle.textContent = musicEnabled ? 'Muzyka: ON' : 'Muzyka: OFF';
        musicToggle.classList.toggle('active', musicEnabled);

        musicToggle.addEventListener('click', () => {
            if (typeof Sound !== 'undefined') {
                const enabled = Sound.toggleMusic();
                musicToggle.textContent = enabled ? 'Muzyka: ON' : 'Muzyka: OFF';
                musicToggle.classList.toggle('active', enabled);
            }
        });
    }
}

function setupDailyChallenge() {
    const dailySection = document.getElementById('daily-section');
    const dailyBtn = document.getElementById('daily-btn');
    const dailyCountdown = document.getElementById('daily-countdown');
    const dailyStatus = document.getElementById('daily-status');

    if (!dailySection || typeof Daily === 'undefined') return;

    const status = Daily.getStatus();

    if (status.completed) {
        // Wyzwanie ukonczone - pokaz odliczanie do nastepnego
        if (dailyBtn) {
            dailyBtn.classList.add('disabled');
            dailyBtn.textContent = 'Ukonczone!';
        }
        if (dailyStatus) {
            dailyStatus.textContent = 'Wyzwanie ukonczone! Nastepne za:';
        }
        if (dailyCountdown) {
            Daily.startCountdown('daily-countdown');
        }
    } else {
        // Wyzwanie dostepne
        if (dailyBtn) {
            dailyBtn.classList.remove('disabled');
            dailyBtn.textContent = `Zagraj (${status.questionsCount} pytan)`;
            dailyBtn.href = 'game.html?daily=true';
        }
        if (dailyStatus) {
            dailyStatus.innerHTML = `Bonus: <span class="bonus">x${status.multiplier} PLN</span>`;
        }
        if (dailyCountdown) {
            dailyCountdown.textContent = '';
        }
    }
}

function setupLeaderboardPreview() {
    const leaderboardPreview = document.getElementById('leaderboard-preview');

    if (leaderboardPreview && typeof Leaderboard !== 'undefined') {
        Leaderboard.renderPreview('leaderboard-preview');
    }
}

function setupCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    const categoryChips = document.querySelectorAll('.category-chip');

    if (!categoryChips.length) return;

    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Usun aktywna klase ze wszystkich
            categoryChips.forEach(c => c.classList.remove('active'));
            // Dodaj do kliknietego
            chip.classList.add('active');

            const category = chip.dataset.category;

            // Zapisz wybrana kategorie
            if (category === 'all') {
                localStorage.removeItem('milionerzy_selected_category');
            } else {
                localStorage.setItem('milionerzy_selected_category', category);
            }
        });
    });

    // Przywroc zapisana kategorie
    const savedCategory = localStorage.getItem('milionerzy_selected_category');
    if (savedCategory) {
        categoryChips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.category === savedCategory);
        });
    }
}

// === Class Selector ===

function renderClassCards() {
    const container = document.getElementById('class-selector');
    if (!container) return;

    const registry = Storage.getClassesRegistry() || [];
    const activeId = Storage.getActiveClass();

    container.innerHTML = '';

    registry.forEach(cls => {
        const card = document.createElement('div');
        card.className = 'class-card' + (cls.id === activeId ? ' active' : '');
        card.dataset.classId = cls.id;

        let inner = `<div class="class-card-name">${escapeHtml(cls.name)}</div>`;
        inner += `<div class="class-card-info">${cls.questionCount || 0} pytan</div>`;

        if (cls.isDefault) {
            inner += `<div class="class-card-badge">Domyslna</div>`;
        } else {
            inner += `<button class="class-card-delete" title="Usun klase">&times;</button>`;
        }

        card.innerHTML = inner;

        // Click to select class
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('class-card-delete')) return;
            selectClass(cls.id);
        });

        // Delete button
        if (!cls.isDefault) {
            const deleteBtn = card.querySelector('.class-card-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Czy na pewno chcesz usunac klase "' + cls.name + '"?')) {
                        deleteClass(cls.id);
                    }
                });
            }
        }

        container.appendChild(card);
    });

    // Add "+" card
    const addCard = document.createElement('div');
    addCard.className = 'class-card class-card-add';
    addCard.innerHTML = `
        <div class="class-card-add-icon">+</div>
        <div class="class-card-add-text">Dodaj klase</div>
    `;
    addCard.addEventListener('click', () => {
        const panel = document.getElementById('setup-panel');
        if (panel) panel.classList.add('active');
    });
    container.appendChild(addCard);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function selectClass(classId) {
    Storage.setActiveClass(classId);
    loadQuestionsForClass(classId);
    renderClassCards();
    updateSubtitle();
    updateFormulasVisibility();
    updatePracticeButton();
}

function deleteClass(classId) {
    const activeId = Storage.getActiveClass();
    Storage.removeClass(classId);

    // If deleted class was active, switch to default
    if (activeId === classId) {
        Storage.setActiveClass('default_fizyka7');
        loadQuestionsForClass('default_fizyka7');
    }

    renderClassCards();
    updateSubtitle();
    updateFormulasVisibility();
    updatePracticeButton();
}

// === Konfiguracja AI ===

// Stan przeslanego obrazu
let uploadedImageBase64 = null;
let uploadedImageMimeType = null;

function setupSetupPanel() {
    const toggleBtn = document.getElementById('setup-toggle');
    const panel = document.getElementById('setup-panel');
    const closeBtn = document.getElementById('setup-panel-close');

    if (!toggleBtn || !panel) return;

    // Oznacz przycisk jesli sa wygenerowane klasy (poza domyslna)
    const registry = Storage.getClassesRegistry() || [];
    if (registry.some(c => !c.isDefault)) {
        toggleBtn.classList.add('has-questions');
    }

    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('active');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('active');
        });
    }

    // Zamknij panel po kliknieciu poza nim
    document.addEventListener('click', (e) => {
        if (panel.classList.contains('active') &&
            !panel.contains(e.target) &&
            e.target !== toggleBtn) {
            panel.classList.remove('active');
        }
    });

    // Zamknij na ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('active')) {
            panel.classList.remove('active');
        }
    });
}

function setupClassConfig() {
    // API key is now managed server-side, no client setup needed
}

function setupImageUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('image-upload');

    if (!uploadArea || !fileInput) return;

    // Obraz trzymamy tylko w pamieci - nie w localStorage (za duzy)

    // Klikniecie w obszar uploadu
    uploadArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('upload-remove')) return;
        fileInput.click();
    });

    // Obsluga wybranego pliku
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleImageFile(fileInput.files[0], uploadArea);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleImageFile(e.dataTransfer.files[0], uploadArea);
        }
    });
}

function handleImageFile(file, uploadArea) {
    // Sprawdz typ
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('Dozwolone formaty: JPG, PNG');
        return;
    }

    // Sprawdz rozmiar (4MB)
    if (file.size > 4 * 1024 * 1024) {
        alert('Maksymalny rozmiar pliku: 4MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(',')[1];
        uploadedImageBase64 = base64;
        uploadedImageMimeType = file.type;

        showImagePreview(uploadArea, dataUrl);
    };
    reader.readAsDataURL(file);
}

function showImagePreview(uploadArea, dataUrl) {
    uploadArea.classList.add('has-image');
    uploadArea.innerHTML = `
        <button class="upload-remove" title="Usun zdjecie">&times;</button>
        <img src="${dataUrl}" class="upload-preview" alt="Podglad">
    `;

    // Obsluga usuwania
    const removeBtn = uploadArea.querySelector('.upload-remove');
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        uploadedImageBase64 = null;
        uploadedImageMimeType = null;
        uploadArea.classList.remove('has-image');
        uploadArea.innerHTML = `
            <div class="upload-icon">&#128247;</div>
            <div class="upload-text">Kliknij lub przeciagnij zdjecie</div>
            <div class="upload-hint">Max 4MB - JPG, PNG</div>
        `;
    });
}

function setupGenerateButton() {
    const generateBtn = document.getElementById('generate-btn');
    const statusEl = document.getElementById('generate-status');
    const loadingOverlay = document.getElementById('loading-overlay');

    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        const className = document.getElementById('class-name-input').value.trim();
        const context = document.getElementById('class-context-input').value.trim();

        // Walidacja
        if (!className) {
            showStatus(statusEl, 'Wprowadz nazwe przedmiotu / klasy', 'error');
            return;
        }

        // Pokaz loading
        generateBtn.disabled = true;
        if (loadingOverlay) loadingOverlay.classList.add('active');
        showStatus(statusEl, '', '');

        try {
            const questions = await Gemini.generateQuestions(
                className,
                context,
                uploadedImageBase64,
                uploadedImageMimeType
            );

            // Create new class
            const newId = 'class_' + Date.now();

            // Store questions under per-class key
            try {
                Storage.setClassQuestions(newId, questions);

                // Verify
                const verify = Storage.getClassQuestions(newId);
                if (!verify || !Array.isArray(verify) || verify.length === 0) {
                    console.warn('Zapis pytan do localStorage nie powiodl sie');
                    showStatus(statusEl, `Wygenerowano ${questions.length} pytan! (UWAGA: nie udalo sie zapisac w cache)`, 'success');
                } else {
                    showStatus(statusEl, `Wygenerowano ${questions.length} pytan!`, 'success');
                }
            } catch (storageError) {
                console.warn('Blad zapisu do localStorage:', storageError);
                showStatus(statusEl, `Wygenerowano ${questions.length} pytan! (UWAGA: brak miejsca w pamieci)`, 'success');
            }

            // Add to registry
            Storage.addClass({
                id: newId,
                name: className,
                context: context,
                isDefault: false,
                questionCount: questions.length,
                generatedAt: new Date().toISOString()
            });

            // Set as active class
            Storage.setActiveClass(newId);

            // Update in-memory questions
            setQuestions(questions);

            // Clear incorrect for new class (fresh start)
            Storage.setClassIncorrect(newId, []);

            // Re-render class cards
            renderClassCards();

            // Close setup panel
            const panel = document.getElementById('setup-panel');
            if (panel) panel.classList.remove('active');

            // Clear form fields
            document.getElementById('class-name-input').value = '';
            document.getElementById('class-context-input').value = '';

            // Clear uploaded image
            uploadedImageBase64 = null;
            uploadedImageMimeType = null;
            const uploadArea = document.getElementById('upload-area');
            if (uploadArea) {
                uploadArea.classList.remove('has-image');
                uploadArea.innerHTML = `
                    <div class="upload-icon">&#128247;</div>
                    <div class="upload-text">Kliknij lub przeciagnij zdjecie</div>
                    <div class="upload-hint">Max 4MB - JPG, PNG</div>
                `;
            }

            updateSubtitle();
            updateFormulasVisibility();
            updatePracticeButton();

            // Oznacz toggle jako gotowy
            const toggleBtn = document.getElementById('setup-toggle');
            if (toggleBtn) toggleBtn.classList.add('has-questions');
        } catch (error) {
            showStatus(statusEl, error.message, 'error');
        } finally {
            generateBtn.disabled = false;
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        }
    });
}

function showStatus(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.className = 'generate-status';
    if (type) el.classList.add(type);
}

function updateSubtitle() {
    const subtitleEl = document.getElementById('subtitle-text');
    if (!subtitleEl) return;

    const activeId = Storage.getActiveClass();
    const cls = Storage.getClassById(activeId);

    if (cls && cls.name) {
        subtitleEl.textContent = cls.name;
    } else {
        subtitleEl.textContent = 'Edukacja z Fizyka - Klasa 7';
    }
}

function updateFormulasVisibility() {
    const formulasBtn = document.getElementById('formulas-btn');
    if (!formulasBtn) return;

    const activeId = Storage.getActiveClass();

    // Show formulas button only for default physics class
    if (activeId === 'default_fizyka7') {
        formulasBtn.style.display = '';
    } else {
        formulasBtn.style.display = 'none';
    }
}
