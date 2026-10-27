export interface ChatMessagePayload {
  role: string;
  content: string;
}

/**
 * Cliente HTTP aislado para la API de Gemini (Google Generative AI).
 * Desacopla la infraestructura de red de la lógica de dominio (DIP & SRP).
 */
export async function callGeminiApi(
  systemPrompt: string,
  history: ChatMessagePayload[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'tu_api_key_aqui') {
    return '';
  }

  try {
    const contents = [
      ...history.map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`[GEMINI API] Error HTTP ${response.status}. Usando fallback local.`);
      return '';
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err: unknown) {
    console.warn('[GEMINI API] Fallo de conexión. Usando fallback local:', err);
    return '';
  }
}

