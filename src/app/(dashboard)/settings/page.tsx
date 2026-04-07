"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, Moon, Sun, Monitor, Palette, CalendarSync, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  syncOutlookCalendar,
  disconnectOutlook,
  getOutlookConnectionStatus,
} from "@/app/actions/outlook-sync";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const searchParams = useSearchParams();

  // Outlook connection state
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, startSyncTransition] = useTransition();
  const [isDisconnecting, startDisconnectTransition] = useTransition();

  // Check for success/error query params from OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "outlook") {
      setSyncMessage("Compte Outlook connecte avec succes !");
    } else if (error) {
      setSyncMessage(`Erreur: ${error}`);
    }
  }, [searchParams]);

  // Fetch connection status on mount
  const fetchStatus = useCallback(async () => {
    const status = await getOutlookConnectionStatus();
    setOutlookConnected(status.connected);
    setStatusLoaded(true);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  function handleSync() {
    startSyncTransition(async () => {
      setSyncMessage(null);
      const result = await syncOutlookCalendar();
      setSyncMessage(result.message);
    });
  }

  function handleDisconnect() {
    startDisconnectTransition(async () => {
      setSyncMessage(null);
      const result = await disconnectOutlook();
      if (result.success) {
        setOutlookConnected(false);
      }
      setSyncMessage(result.message);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Parametres</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Apparence
          </CardTitle>
          <CardDescription>Personnalise l&apos;interface</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Mode sombre
            </Label>
            <Switch
              id="dark-mode"
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Ou choisir un mode precis
            </Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="gap-1.5"
              >
                <Sun className="h-4 w-4" />
                Clair
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="gap-1.5"
              >
                <Moon className="h-4 w-4" />
                Sombre
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="gap-1.5"
              >
                <Monitor className="h-4 w-4" />
                Systeme
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outlook Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarSync className="h-5 w-5" />
            Calendrier Outlook
          </CardTitle>
          <CardDescription>
            Synchronise tes evenements Microsoft Outlook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!statusLoaded ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : outlookConnected ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Statut</span>
                  <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                    Connecte
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="gap-1.5"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarSync className="h-4 w-4" />
                  )}
                  Synchroniser maintenant
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="gap-1.5"
                >
                  {isDisconnecting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Deconnecter
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connecte ton compte Microsoft pour importer automatiquement tes
                evenements Outlook dans ton calendrier.
              </p>
              <a href="/api/auth/microsoft">
                <Button size="sm" className="gap-1.5">
                  <CalendarSync className="h-4 w-4" />
                  Connecter Outlook
                </Button>
              </a>
            </div>
          )}

          {syncMessage && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">{syncMessage}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure tes rappels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="telegram">Rappels Telegram (vie perso)</Label>
            <Switch id="telegram" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="email">Rappels email (vie pro)</Label>
            <Switch id="email" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
