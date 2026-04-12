import { NextResponse } from "next/server";

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

interface RequestBody {
  axisId?: string;
  axisName?: string;
  axisDescription?: string | null;
  existingMilestones?: Array<{ title: string; status: string }>;
  currentLevel?: number;
}

interface SuggestedMilestone {
  title: string;
  description: string;
  duration_weeks: number;
  xp_reward: number;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete JSON invalide." },
      { status: 400 }
    );
  }

  const { axisName, axisDescription, existingMilestones, currentLevel } = body;

  if (!axisName) {
    return NextResponse.json(
      { error: "Le champ axisName est requis." },
      { status: 400 }
    );
  }

  const completedMilestones = (existingMilestones ?? [])
    .filter((m) => m.status === "completed")
    .map((m) => m.title);

  const activeMilestones = (existingMilestones ?? [])
    .filter((m) => m.status === "active")
    .map((m) => m.title);

  const lockedMilestones = (existingMilestones ?? [])
    .filter((m) => m.status === "locked")
    .map((m) => m.title);

  const systemPrompt = `Tu es un coach de developpement personnel. Tu generes des objectifs progressifs et motivants pour aider un utilisateur a progresser dans un domaine de sa vie.

Tu dois repondre UNIQUEMENT en JSON, un array d'objets avec les champs: title, description, duration_weeks, xp_reward.

Regles:
- Genere exactement 3 ou 4 objectifs progressifs (du plus simple au plus ambitieux)
- Chaque objectif doit etre concret, mesurable et atteignable en 2 a 4 semaines
- La description doit etre courte (1-2 phrases)
- Le xp_reward doit etre entre 50 et 300, proportionnel a la difficulte
- Les titres doivent etre courts et motivants (max 60 caracteres)
- Adapte la difficulte au niveau actuel de l'utilisateur
- Les objectifs doivent etre sequentiels et construire les uns sur les autres
- Reponds en francais`;

  const userPrompt = `Pilier : ${axisName}${axisDescription ? `\nDescription : ${axisDescription}` : ""}
Niveau actuel : ${currentLevel ?? 1}

${completedMilestones.length > 0 ? `Jalons deja completes :\n${completedMilestones.map((t) => `- ${t}`).join("\n")}` : "Aucun jalon complete."}

${activeMilestones.length > 0 ? `Jalons en cours :\n${activeMilestones.map((t) => `- ${t}`).join("\n")}` : ""}

${lockedMilestones.length > 0 ? `Jalons prevus :\n${lockedMilestones.map((t) => `- ${t}`).join("\n")}` : ""}

Genere 3-4 nouveaux objectifs progressifs pour la suite du parcours.`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
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
            description: { type: "STRING" },
            duration_weeks: { type: "INTEGER" },
            xp_reward: { type: "INTEGER" },
          },
          required: ["title", "description", "duration_weeks", "xp_reward"],
        },
      },
      temperature: 0.7,
      maxOutputTokens: 2048,
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
    return NextResponse.json(
      {
        error: `Erreur reseau lors de l'appel a Gemini : ${error instanceof Error ? error.message : "Connexion impossible"}`,
      },
      { status: 502 }
    );
  }

  if (response.status === 429) {
    return NextResponse.json(
      { error: "Trop de requetes. Reessaie dans quelques secondes." },
      { status: 429 }
    );
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    return NextResponse.json(
      { error: `Erreur Gemini (${response.status}): ${errorBody || response.statusText}` },
      { status: 500 }
    );
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    return NextResponse.json(
      { error: `Erreur Gemini API: ${data.error.message ?? "Erreur inconnue"}` },
      { status: 500 }
    );
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json(
      { error: "Reponse vide de Gemini. Reessaie." },
      { status: 500 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Impossible de parser la reponse JSON de Gemini." },
      { status: 500 }
    );
  }

  // Validate the shape
  if (!Array.isArray(parsed)) {
    return NextResponse.json(
      { error: "Reponse Gemini invalide: attendu un array." },
      { status: 500 }
    );
  }

  const suggestions: SuggestedMilestone[] = (parsed as SuggestedMilestone[]).map((item) => ({
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    duration_weeks: Math.max(1, Math.min(12, Number(item.duration_weeks) || 3)),
    xp_reward: Math.max(50, Math.min(500, Number(item.xp_reward) || 100)),
  }));

  return NextResponse.json(suggestions);
}
