"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projets</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <CardTitle className="mb-2">Aucun projet pour le moment</CardTitle>
          <CardDescription>
            Cree ton premier projet pour organiser tes taches en sequences
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
