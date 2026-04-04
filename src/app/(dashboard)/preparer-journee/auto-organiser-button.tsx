"use client";

import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AutoOrganiserButton() {
  return (
    <Button
      variant="default"
      onClick={() => {
        toast.info("Auto-organisation bientot disponible !");
      }}
    >
      <Sparkles className="size-4" />
      Auto-organiser
    </Button>
  );
}
