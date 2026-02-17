require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'milionerzy-default-secret-change-me';

// --- JSON file cache setup ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const cachePath = path.join(dataDir, 'cache.json');
const usersPath = path.join(dataDir, 'users.json');

function loadJSON(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`[JSON] Error loading ${filePath}:`, e.message);
    }
    return {};
}

function saveJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error(`[JSON] Error saving ${filePath}:`, e.message);
    }
}

const cache = loadJSON(cachePath);
const users = loadJSON(usersPath);

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));

// Serve HTML files with GOOGLE_CLIENT_ID injected
app.get(['/', '/index.html', '/game.html', '/shop.html', '/achievements.html'], (req, res) => {
    let fileName = req.path === '/' ? 'index.html' : req.path.slice(1);
    const filePath = path.join(__dirname, fileName);
    try {
        let html = fs.readFileSync(filePath, 'utf8');
        html = html.replace('GOOGLE_CLIENT_ID_PLACEHOLDER', process.env.GOOGLE_CLIENT_ID || '');
        res.type('html').send(html);
    } catch (e) {
        res.status(404).send('Not found');
    }
});

app.use(express.static(__dirname));

// Auth middleware - extracts user from JWT if present
function authOptional(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            // Invalid token - continue without user
        }
    }
    next();
}

function authRequired(req, res, next) {
    authOptional(req, res, () => {
        if (!req.user) {
            return res.status(401).json({ error: 'Musisz byc zalogowany.' });
        }
        next();
    });
}

// --- Auth Routes ---

// POST /api/auth/google - Verify Google ID token and return JWT
app.post('/api/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Brak tokenu Google.' });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return res.status(500).json({ error: 'Brak GOOGLE_CLIENT_ID na serwerze.' });
        }

        // Verify Google ID token via Google's tokeninfo endpoint
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
        const verifyRes = await fetch(verifyUrl);

        if (!verifyRes.ok) {
            return res.status(401).json({ error: 'Nieprawidlowy token Google.' });
        }

        const payload = await verifyRes.json();

        // Verify the token is for our app
        if (payload.aud !== clientId) {
            return res.status(401).json({ error: 'Token nie jest dla tej aplikacji.' });
        }

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || email.split('@')[0];
        const picture = payload.picture || '';

        // Create/update user
        if (!users[googleId]) {
            users[googleId] = {
                googleId,
                email,
                name,
                picture,
                createdAt: new Date().toISOString(),
                progress: null
            };
            console.log(`[Auth] New user: ${name} (${email})`);
        } else {
            users[googleId].name = name;
            users[googleId].picture = picture;
            users[googleId].email = email;
        }
        users[googleId].lastLogin = new Date().toISOString();
        saveJSON(usersPath, users);

        // Create JWT
        const token = jwt.sign(
            { googleId, email, name, picture },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: { googleId, email, name, picture }
        });

    } catch (err) {
        console.error('[/api/auth/google ERROR]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', authRequired, (req, res) => {
    const userData = users[req.user.googleId];
    res.json({
        user: {
            googleId: req.user.googleId,
            email: req.user.email,
            name: req.user.name,
            picture: req.user.picture
        },
        hasProgress: !!(userData && userData.progress)
    });
});

// --- Progress Routes ---

// POST /api/user/progress - Save user progress
app.post('/api/user/progress', authRequired, (req, res) => {
    try {
        const { progress } = req.body;
        if (!progress) {
            return res.status(400).json({ error: 'Brak danych progresu.' });
        }

        const googleId = req.user.googleId;
        if (users[googleId]) {
            users[googleId].progress = progress;
            users[googleId].lastSaved = new Date().toISOString();
            saveJSON(usersPath, users);
            res.json({ saved: true });
        } else {
            res.status(404).json({ error: 'Uzytkownik nie znaleziony.' });
        }
    } catch (err) {
        console.error('[/api/user/progress SAVE ERROR]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user/progress - Load user progress
app.get('/api/user/progress', authRequired, (req, res) => {
    try {
        const googleId = req.user.googleId;
        const userData = users[googleId];
        if (userData && userData.progress) {
            res.json({ progress: userData.progress });
        } else {
            res.json({ progress: null });
        }
    } catch (err) {
        console.error('[/api/user/progress LOAD ERROR]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Gemini prompt builder ---
function buildPrompt(className, context, hasImage) {
    let imageInstruction = '';
    if (hasImage) {
        imageInstruction = `

KRYTYCZNE: Do wiadomosci dolaczono ZDJECIE z kryteriami sukcesu / zakresem materialu.
Musisz DOKLADNIE przeanalizowac to zdjecie i wygenerowac pytania TYLKO na podstawie tresci widocznych na zdjeciu.
Kazde pytanie musi bezposrednio dotyczyc tematu ze zdjecia. Nie wymyslaj pytan spoza zakresu pokazanego na zdjeciu.
Jesli na zdjeciu widac konkretne tematy, definicje, wzory lub zagadnienia - pytania musza je pokrywac.`;
    }

    let contextInstruction = '';
    if (context) {
        contextInstruction = `

ZAKRES MATERIALU OD UCZNIA:
"""
${context}
"""
Pytania MUSZA dotyczyc WYLACZNIE powyzszego zakresu. Nie generuj pytan spoza tego zakresu.`;
    }

    return `Jestes nauczycielem przedmiotu "${className}". Przygotowujesz quiz sprawdzajacy wiedze ucznia.
${imageInstruction}
${contextInstruction}

${!context && !hasImage ? `Wygeneruj pytania z zakresu materialu dla: ${className}. Pokryj rozne tematy z tego przedmiotu i poziomu.` : ''}

ZADANIE: Wygeneruj dokladnie 65 pytan po polsku:
- 55 pytan wielokrotnego wyboru (4 odpowiedzi, dokladnie 1 poprawna)
- 10 pytan prawda/falsz (id 56-65)

WAZNE ZASADY:
1. Wszystkie pytania MUSZA byc scisle powiazane z podanym przedmiotem i zakresem materialu
2. Jesli podano zdjecie kryteriow sukcesu - pytania musza pokrywac KAZDY punkt z tych kryteriow
3. Jesli podano zakres tekstowy - pytania musza dotyczyc TYLKO tego zakresu
4. Pytania po polsku, na poziomie odpowiednim dla podanej klasy
5. Difficulty: 1=latwe (definicje, pojecia), 2=srednie (zastosowania, porownania), 3=trudne (obliczenia, analiza)
6. Rozloz rowno: ~18 latwych, ~19 srednich, ~18 trudnych
7. Wyjasnienia musza byc edukacyjne - tlumacz DLACZEGO dana odpowiedz jest poprawna
8. Uzywaj formatowania w wyjasnienich: *wazne terminy*, [wzory/formuly], {przyklady z zycia}

FORMAT odpowiedzi - tablica JSON:

Pytanie wielokrotnego wyboru (id 1-55):
{"id": N, "category": "temat", "question": "tresc?", "difficulty": 1|2|3, "answers": [{"text": "odp", "correct": true}, {"text": "odp", "correct": false}, {"text": "odp", "correct": false}, {"text": "odp", "correct": false}], "explanation": "wyjasnienie"}

Pytanie prawda/falsz (id 56-65):
{"id": N, "type": "truefalse", "category": "temat", "question": "stwierdzenie", "difficulty": 1|2|3, "correctAnswer": true|false, "explanation": "wyjasnienie"}`;
}

// --- Response parser ---
function parseResponse(text) {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (e) {
        throw new Error('Nie udalo sie sparsowac odpowiedzi Gemini jako JSON.');
    }

    if (!Array.isArray(parsed)) {
        throw new Error('Odpowiedz Gemini nie jest tablica.');
    }

    const validated = [];
    for (let i = 0; i < parsed.length; i++) {
        const q = parsed[i];
        if (!q || !q.question) continue;

        if (!q.id) q.id = i + 1;
        if (!q.category) q.category = 'Ogolne';
        if (!q.explanation) q.explanation = 'Brak wyjasnienia.';

        if (q.type === 'truefalse') {
            if (typeof q.correctAnswer !== 'boolean') {
                q.correctAnswer = true;
            }
            validated.push(q);
        } else {
            if (!Array.isArray(q.answers) || q.answers.length < 2) continue;

            const correctCount = q.answers.filter(a => a.correct).length;
            if (correctCount === 0) {
                q.answers[0].correct = true;
            } else if (correctCount > 1) {
                let foundFirst = false;
                q.answers.forEach(a => {
                    if (a.correct && foundFirst) {
                        a.correct = false;
                    }
                    if (a.correct) foundFirst = true;
                });
            }

            while (q.answers.length < 4) {
                q.answers.push({ text: '-', correct: false });
            }

            validated.push(q);
        }
    }

    if (validated.length < 10) {
        throw new Error(`Za malo prawidlowych pytan (${validated.length}). Potrzeba minimum 10.`);
    }

    return validated;
}

// --- API Routes ---

// POST /api/generate - Generate or return cached questions (AUTH REQUIRED)
app.post('/api/generate', authRequired, async (req, res) => {
    try {
        const { className, context, imageBase64, mimeType } = req.body;

        if (!className) {
            return res.status(400).json({ error: 'Brak nazwy przedmiotu / klasy.' });
        }

        const normalizedContext = (context || '').trim();
        const hasImage = !!(imageBase64 && mimeType);
        const cacheKey = `${className.trim()}|||${normalizedContext}`;

        // Check cache (only if no image)
        if (!hasImage && cache[cacheKey]) {
            console.log(`[Cache HIT] ${className} | context: ${normalizedContext.slice(0, 50)}...`);
            return res.json({ questions: cache[cacheKey].questions, cached: true });
        }

        // Call Gemini API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Brak klucza API Gemini na serwerze.' });
        }

        const prompt = buildPrompt(className, normalizedContext, hasImage);
        const parts = [{ text: prompt }];

        if (hasImage) {
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                }
            });
        }

        const requestBody = {
            contents: [{ parts }],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.5,
                maxOutputTokens: 65536
            }
        };

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

        console.log(`[Gemini] Generating for: ${className} (user: ${req.user.email})`);

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
            return res.status(502).json({ error: `Blad API Gemini: ${errorMessage}` });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(502).json({ error: 'Gemini nie zwrocilo odpowiedzi.' });
        }

        const questions = parseResponse(text);

        // Save to cache
        try {
            cache[cacheKey] = {
                questions,
                questionCount: questions.length,
                createdAt: new Date().toISOString()
            };
            saveJSON(cachePath, cache);
            console.log(`[Cache SAVE] ${className} | ${questions.length} questions`);
        } catch (cacheErr) {
            console.error('[Cache ERROR]', cacheErr.message);
        }

        res.json({ questions, cached: false });

    } catch (err) {
        console.error('[/api/generate ERROR]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/criteria - List all cached criteria
app.get('/api/criteria', (req, res) => {
    try {
        const rows = Object.entries(cache).map(([key, value]) => {
            const [class_name, context] = key.split('|||');
            return {
                class_name,
                context,
                question_count: value.questionCount,
                created_at: value.createdAt
            };
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Start server ---
app.listen(PORT, () => {
    console.log(`Milionerzy server running at http://localhost:${PORT}`);
});
