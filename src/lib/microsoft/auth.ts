import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_USER_ID } from "@/lib/default-user";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TENANT_ID = process.env.MICROSOFT_TENANT_ID!;
const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;

const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "Calendars.ReadWrite",
  "User.Read",
];

function getRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || "https://outilvie.vercel.app";
  return `${base}/api/auth/callback/microsoft`;
}

// ---------------------------------------------------------------------------
// Build the Microsoft OAuth authorization URL
// ---------------------------------------------------------------------------

export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    response_mode: "query",
    scope: SCOPES.join(" "),
    prompt: "consent",
  });

  return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Exchange an authorization code for tokens
// ---------------------------------------------------------------------------

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
    scope: SCOPES.join(" "),
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

// ---------------------------------------------------------------------------
// Refresh an expired access token
// ---------------------------------------------------------------------------

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: SCOPES.join(" "),
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${text}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

// ---------------------------------------------------------------------------
// Get a valid access token for the connected Microsoft account.
// Refreshes automatically when expired and persists the new tokens.
// ---------------------------------------------------------------------------

export async function getValidAccessToken(accountId: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: account, error } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error || !account) {
    throw new Error("Connected Microsoft account not found");
  }

  // Check whether the token is still valid (with a 2-minute buffer)
  const expiresAt = new Date(account.token_expires_at).getTime();
  const now = Date.now();

  if (expiresAt - now > 2 * 60 * 1000) {
    // Token still valid
    return account.access_token as string;
  }

  // Token expired or about to expire -- refresh it
  const tokens = await refreshAccessToken(account.refresh_token as string);

  const newExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  const { error: updateError } = await supabase
    .from("connected_accounts")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpiresAt,
    })
    .eq("id", accountId);

  if (updateError) {
    throw new Error(`Failed to update tokens: ${updateError.message}`);
  }

  return tokens.access_token;
}

// ---------------------------------------------------------------------------
// Helper: get the connected Microsoft account for the default user
// ---------------------------------------------------------------------------

export async function getMicrosoftAccount() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", DEFAULT_USER_ID)
    .eq("provider", "microsoft")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch Microsoft account: ${error.message}`
    );
  }

  return data;
}
