"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/global`,
        },
      });

      if (error) {
        toast.error("Erreur lors de l'envoi du lien de connexion");
      } else {
        toast.success("Lien de connexion envoye ! Verifie tes emails.");
      }
    } catch {
      toast.error("Supabase n'est pas encore configure. Ajoute les variables d'environnement.");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Outil de Vie</CardTitle>
          <CardDescription>
            Connecte-toi pour organiser ta vie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi en cours..." : "Recevoir le lien de connexion"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
