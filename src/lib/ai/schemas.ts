import { z } from "zod";

export const ParsedTaskSchema = z.object({
  title: z.string().describe("Titre clair et actionnable, commencant par un verbe a l'infinitif"),
  notes: z.string().nullable().describe("Notes detaillees avec le contexte, les precisions et details mentionnes par l'utilisateur"),
  estimated_minutes: z.number().int().min(5).max(480).describe("Duree estimee en minutes"),
  priority: z.number().int().min(1).max(5).describe("Priorite de 1 (critique) a 5 (optionnel)"),
  due_date: z.string().nullable().describe("Date d'echeance au format ISO YYYY-MM-DD, ou null si non mentionnee"),
  category: z.enum(["pro", "perso"]).describe("Categorie: pro ou perso"),
  energy_level: z.enum(["high", "medium", "low"]).describe("Niveau d'energie requis"),
  tags: z.array(z.string()).describe("Tags pertinents pour la tache"),
  project_name: z.string().nullable().describe("Nom du projet detecte si l'utilisateur en mentionne un, sinon null"),
});

export const ParsedTasksResponseSchema = z.array(ParsedTaskSchema);

export type ParsedTask = z.infer<typeof ParsedTaskSchema>;
