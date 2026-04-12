import { Trophy } from "lucide-react";
import { getProgressionData } from "@/app/actions/gamification";
import { getActiveMilestones } from "@/app/actions/milestones";
import { ProgressionClient } from "@/components/progression/progression-client";

export default async function ProgressionPage() {
  const [data, activeMilestones] = await Promise.all([
    getProgressionData(),
    getActiveMilestones(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-amber-500" />
        <h1 className="text-xl font-bold">Progression</h1>
      </div>
      <ProgressionClient data={data} activeMilestones={activeMilestones} />
    </div>
  );
}
