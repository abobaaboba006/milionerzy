// gemini.js - Integracja z backendem (proxy do Gemini API)

const Gemini = {
    async generateQuestions(className, context, imageBase64, mimeType) {
        const requestBody = { className, context };

        if (imageBase64 && mimeType) {
            requestBody.imageBase64 = imageBase64;
            requestBody.mimeType = mimeType;
        }

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Blad serwera: HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.cached) {
            console.log('[Gemini] Pytania pobrane z cache serwera');
        }

        return data.questions;
    },

    getCachedQuestions() {
        return Storage.getGeneratedQuestions();
    }
};
