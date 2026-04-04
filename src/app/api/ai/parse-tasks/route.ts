import { NextResponse } from "next/server";
import { parseTasks } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requete JSON invalide." },
      { status: 400 }
    );
  }

  const { rawInput } = body as { rawInput?: string };

  if (!rawInput || typeof rawInput !== "string" || !rawInput.trim()) {
    return NextResponse.json(
      { error: "Le champ rawInput est requis et ne peut pas etre vide." },
      { status: 400 }
    );
  }

  const currentDate = new Date().toISOString().slice(0, 10);

  try {
    const tasks = await parseTasks(rawInput.trim(), currentDate);
    return NextResponse.json(tasks);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur interne du serveur.";

    if (message.startsWith("RATE_LIMIT:")) {
      return NextResponse.json(
        { error: message.replace("RATE_LIMIT: ", "") },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
