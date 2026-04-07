import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/microsoft/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_USER_ID } from "@/lib/default-user";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://outilvie.vercel.app";

  // Handle error from Microsoft
  if (errorParam) {
    const description = searchParams.get("error_description") || errorParam;
    console.error("Microsoft OAuth error:", description);
    return NextResponse.redirect(
      `${appUrl}/settings?error=${encodeURIComponent(description)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/settings?error=${encodeURIComponent("Code d'autorisation manquant")}`
    );
  }

  try {
    // Exchange the authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);

    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    const supabase = createAdminClient();

    // Upsert the connected account (one Microsoft account per user)
    const { error: upsertError } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: DEFAULT_USER_ID,
          provider: "microsoft",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          scopes:
            "openid profile email offline_access Calendars.ReadWrite User.Read",
        },
        { onConflict: "user_id,provider" }
      );

    if (upsertError) {
      console.error("Failed to store tokens:", upsertError);
      return NextResponse.redirect(
        `${appUrl}/settings?error=${encodeURIComponent("Impossible de sauvegarder la connexion")}`
      );
    }

    return NextResponse.redirect(`${appUrl}/settings?success=outlook`);
  } catch (err) {
    console.error("Microsoft callback error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.redirect(
      `${appUrl}/settings?error=${encodeURIComponent(message)}`
    );
  }
}
