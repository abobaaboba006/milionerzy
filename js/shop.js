// shop.js - Logika sklepu

const Shop = {
    // Dostepne motywy
    themes: [
        {
            id: 'gold',
            name: 'Zloty motyw',
            description: 'Eleganckie zlote akcenty zamiast niebieskich. Poczuj sie jak prawdziwy milioner!',
            price: 500000
        },
        {
            id: 'cosmic',
            name: 'Kosmiczny motyw',
            description: 'Ciemne tlo z migoczacymi gwiazdami. Graj wsrod gwiazd!',
            price: 750000
        },
        {
            id: 'neon',
            name: 'Neonowy motyw',
            description: 'Jaskrawe neonowe kolory. Dla fanow cyberpunkowego stylu!',
            price: 1000000
        }
    ],

    // Dostepne tla
    backgrounds: [
        {
            id: 'sunset',
            name: 'Zachod slonca',
            description: 'Ciepłe gradienty pomaranczowo-rozowe. Graj w blasku zachodzacego slonca!',
            price: 300000
        },
        {
            id: 'ocean',
            name: 'Glebiny oceanu',
            description: 'Ciemne odcienie niebieskiego i turkusu. Zanurz sie w grze!',
            price: 400000
        },
        {
            id: 'forest',
            name: 'Zaczarowany las',
            description: 'Tajemnicze zielone tlo z mgielka. Dla milosnikow natury!',
            price: 450000
        },
        {
            id: 'aurora',
            name: 'Zorza polarna',
            description: 'Magiczne kolory zorzy na nocnym niebie. Niesamowity efekt!',
            price: 600000
        },
        {
            id: 'volcano',
            name: 'Wulkan',
            description: 'Ogniste czerwienie i pomarancze. Graj z goraca glowa!',
            price: 550000
        },
        {
            id: 'galaxy',
            name: 'Galaktyka',
            description: 'Kosmiczne mgławice i gwiazdy. Podróżuj miedzy gwiazdami!',
            price: 800000
        }
    ],

    // Dostepne kola ratunkowe
    lifelines: [
        {
            id: 'fifty',
            name: '50:50',
            description: 'Usuwa 2 bledne odpowiedzi, zostawiajac poprawna i jedna bledna.',
            price: 100000
        },
        {
            id: 'skip',
            name: 'Pomin pytanie',
            description: 'Przeskakujesz do nastepnego pytania bez utraty pieniedzy.',
            price: 150000
        },
        {
            id: 'time',
            name: 'Dodatkowy czas',
            description: 'Dodaje +30 sekund na odpowiedz na biezace pytanie.',
            price: 50000
        }
    ],

    // Elementy DOM
    elements: {},

    // Inicjalizacja
    init() {
        this.cacheElements();
        this.applyTheme();
        this.render();
        this.updateMoneyDisplay();
    },

    // Cache elementow DOM
    cacheElements() {
        this.elements = {
            moneyAmount: document.getElementById('money-amount'),
            themesContainer: document.getElementById('themes-container'),
            backgroundsContainer: document.getElementById('backgrounds-container'),
            lifelinesContainer: document.getElementById('lifelines-container')
        };
    },

    // Zastosowanie motywu
    applyTheme() {
        const theme = Storage.getActiveTheme();
        const background = Storage.getActiveBackground();

        // Usun wszystkie klasy motywow i tel
        document.body.className = '';

        // Dodaj klase motywu
        if (theme && theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }

        // Dodaj klase tla
        if (background && background !== 'default') {
            document.body.classList.add(`bg-${background}`);
        }

        const starsElement = document.querySelector('.stars');
        if (starsElement) {
            starsElement.style.display = theme === 'cosmic' ? 'block' : 'none';
        }
    },

    // Aktualizacja wyswietlania pieniedzy
    updateMoneyDisplay() {
        const money = Storage.getMoney() || 0;
        this.elements.moneyAmount.textContent = Storage.formatMoney(money);
    },

    // Renderowanie sklepu
    render() {
        this.renderThemes();
        this.renderBackgrounds();
        this.renderLifelines();
    },

    // Renderowanie motywow
    renderThemes() {
        const container = this.elements.themesContainer;
        container.innerHTML = '';

        this.themes.forEach(theme => {
            const owned = Storage.hasTheme(theme.id);
            const activeTheme = Storage.getActiveTheme();
            const isActive = activeTheme === theme.id;
            const money = Storage.getMoney() || 0;
            const canAfford = money >= theme.price;

            const itemEl = document.createElement('div');
            itemEl.className = `shop-item ${owned ? 'owned' : ''}`;
            itemEl.innerHTML = `
                <h3 class="shop-item-name">${theme.name}</h3>
                <p class="shop-item-desc">${theme.description}</p>
                <p class="shop-item-price">${owned ? 'Posiadane' : Storage.formatMoney(theme.price)}</p>
                <button class="shop-item-btn ${owned ? (isActive ? 'active' : 'activate') : 'buy'}"
                        data-theme-id="${theme.id}"
                        ${!owned && !canAfford ? 'disabled' : ''}>
                    ${owned ? (isActive ? 'Aktywny' : 'Aktywuj') : 'Kup'}
                </button>
            `;

            const btn = itemEl.querySelector('button');
            btn.addEventListener('click', () => this.handleThemeAction(theme, owned, isActive));

            container.appendChild(itemEl);
        });

        // Dodaj domyslny motyw
        const activeTheme = Storage.getActiveTheme();
        const defaultItem = document.createElement('div');
        defaultItem.className = 'shop-item owned';
        defaultItem.innerHTML = `
            <h3 class="shop-item-name">Domyslny motyw</h3>
            <p class="shop-item-desc">Klasyczny niebieski motyw Milionerzy.</p>
            <p class="shop-item-price">Darmowy</p>
            <button class="shop-item-btn ${activeTheme === 'default' || !activeTheme ? 'active' : 'activate'}"
                    data-theme-id="default">
                ${activeTheme === 'default' || !activeTheme ? 'Aktywny' : 'Aktywuj'}
            </button>
        `;

        const defaultBtn = defaultItem.querySelector('button');
        defaultBtn.addEventListener('click', () => {
            Storage.setActiveTheme('default');
            this.applyTheme();
            this.render();
        });

        container.insertBefore(defaultItem, container.firstChild);
    },

    // Obsluga akcji motywu
    handleThemeAction(theme, owned, isActive) {
        if (isActive) return;

        if (owned) {
            // Aktywuj motyw
            Storage.setActiveTheme(theme.id);
            this.applyTheme();
            this.render();
        } else {
            // Kup motyw
            const money = Storage.getMoney() || 0;
            if (money >= theme.price) {
                Storage.setMoney(money - theme.price);
                Storage.addTheme(theme.id);
                Storage.setActiveTheme(theme.id);
                this.applyTheme();
                this.updateMoneyDisplay();
                this.render();
                this.showMessage(`Kupiono i aktywowano: ${theme.name}`);
            }
        }
    },

    // Renderowanie tel
    renderBackgrounds() {
        const container = this.elements.backgroundsContainer;
        if (!container) return;
        container.innerHTML = '';

        // Dodaj domyslne tlo
        const activeBackground = Storage.getActiveBackground();
        const defaultItem = document.createElement('div');
        defaultItem.className = 'shop-item owned';
        defaultItem.innerHTML = `
            <h3 class="shop-item-name">Domyslne tlo</h3>
            <p class="shop-item-desc">Klasyczne ciemne tlo gry Milionerzy.</p>
            <p class="shop-item-price">Darmowe</p>
            <button class="shop-item-btn ${activeBackground === 'default' || !activeBackground ? 'active' : 'activate'}"
                    data-background-id="default">
                ${activeBackground === 'default' || !activeBackground ? 'Aktywne' : 'Aktywuj'}
            </button>
        `;

        const defaultBtn = defaultItem.querySelector('button');
        defaultBtn.addEventListener('click', () => {
            Storage.setActiveBackground('default');
            this.applyTheme();
            this.render();
        });

        container.appendChild(defaultItem);

        this.backgrounds.forEach(bg => {
            const owned = Storage.hasBackground(bg.id);
            const isActive = activeBackground === bg.id;
            const money = Storage.getMoney() || 0;
            const canAfford = money >= bg.price;

            const itemEl = document.createElement('div');
            itemEl.className = `shop-item ${owned ? 'owned' : ''}`;
            itemEl.innerHTML = `
                <h3 class="shop-item-name">${bg.name}</h3>
                <p class="shop-item-desc">${bg.description}</p>
                <p class="shop-item-price">${owned ? 'Posiadane' : Storage.formatMoney(bg.price)}</p>
                <button class="shop-item-btn ${owned ? (isActive ? 'active' : 'activate') : 'buy'}"
                        data-background-id="${bg.id}"
                        ${!owned && !canAfford ? 'disabled' : ''}>
                    ${owned ? (isActive ? 'Aktywne' : 'Aktywuj') : 'Kup'}
                </button>
            `;

            const btn = itemEl.querySelector('button');
            btn.addEventListener('click', () => this.handleBackgroundAction(bg, owned, isActive));

            container.appendChild(itemEl);
        });
    },

    // Obsluga akcji tla
    handleBackgroundAction(bg, owned, isActive) {
        if (isActive) return;

        if (owned) {
            // Aktywuj tlo
            Storage.setActiveBackground(bg.id);
            this.applyTheme();
            this.render();
        } else {
            // Kup tlo
            const money = Storage.getMoney() || 0;
            if (money >= bg.price) {
                Storage.setMoney(money - bg.price);
                Storage.addBackground(bg.id);
                Storage.setActiveBackground(bg.id);
                this.applyTheme();
                this.updateMoneyDisplay();
                this.render();
                this.showMessage(`Kupiono i aktywowano: ${bg.name}`);
            }
        }
    },

    // Renderowanie kol ratunkowych
    renderLifelines() {
        const container = this.elements.lifelinesContainer;
        container.innerHTML = '';

        this.lifelines.forEach(lifeline => {
            const count = Storage.getLifelineCount(lifeline.id);
            const money = Storage.getMoney() || 0;
            const canAfford = money >= lifeline.price;

            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.innerHTML = `
                <h3 class="shop-item-name">${lifeline.name}</h3>
                <p class="shop-item-desc">${lifeline.description}</p>
                <p class="shop-item-price">${Storage.formatMoney(lifeline.price)}</p>
                <p style="color: var(--secondary-color); margin-bottom: 10px;">Posiadasz: ${count}</p>
                <button class="shop-item-btn buy"
                        data-lifeline-id="${lifeline.id}"
                        ${!canAfford ? 'disabled' : ''}>
                    Kup
                </button>
            `;

            const btn = itemEl.querySelector('button');
            btn.addEventListener('click', () => this.buyLifeline(lifeline));

            container.appendChild(itemEl);
        });
    },

    // Kup kolo ratunkowe
    buyLifeline(lifeline) {
        const money = Storage.getMoney() || 0;
        if (money >= lifeline.price) {
            Storage.setMoney(money - lifeline.price);
            Storage.addLifeline(lifeline.id, 1);
            this.updateMoneyDisplay();
            this.render();
            this.showMessage(`Kupiono: ${lifeline.name}`);
        }
    },

    // Pokaz wiadomosc
    showMessage(text) {
        // Prosta notyfikacja
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: black;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        msg.textContent = text;
        document.body.appendChild(msg);

        setTimeout(() => {
            msg.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    }
};

// Dodaj animacje fadeOut do CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);

// Inicjalizacja po zaladowaniu
document.addEventListener('DOMContentLoaded', () => {
    Shop.init();
});
