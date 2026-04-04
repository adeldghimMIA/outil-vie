import { ParsedTasksResponseSchema, type ParsedTask } from "./schemas";
import { getTaskParsingSystemPrompt } from "./prompts";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export async function parseTasks(
  rawInput: string,
  currentDate: string
): Promise<ParsedTask[]> {
  const systemPrompt = getTaskParsingSystemPrompt(currentDate);

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Extrais et structure les taches a partir du texte suivant :\n\n${rawInput}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            notes: { type: "STRING", nullable: true },
            estimated_minutes: { type: "INTEGER" },
            priority: { type: "INTEGER" },
            due_date: { type: "STRING", nullable: true },
            category: { type: "STRING", enum: ["pro", "perso"] },
            energy_level: {
              type: "STRING",
              enum: ["high", "medium", "low"],
            },
            tags: { type: "ARRAY", items: { type: "STRING" } },
            project_name: { type: "STRING", nullable: true },
          },
          required: [
            "title",
            "notes",
            "estimated_minutes",
            "priority",
            "due_date",
            "category",
            "energy_level",
            "tags",
            "project_name",
          ],
        },
      },
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  };

  const url = `${BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    throw new Error(
      `Erreur reseau lors de l'appel a Gemini : ${error instanceof Error ? error.message : "Connexion impossible"}`
    );
  }

  if (response.status === 429) {
    throw new Error("RATE_LIMIT: Trop de requetes. Reessaie dans quelques secondes.");
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Erreur Gemini (${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(`Erreur Gemini API: ${data.error.message ?? "Erreur inconnue"}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Reponse vide de Gemini. Reessaie.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Impossible de parser la reponse JSON de Gemini.");
  }

  const result = ParsedTasksResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Reponse Gemini invalide : ${result.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  return result.data;
}
