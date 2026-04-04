"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_USER_ID } from "@/lib/default-user";

// ---------------------------------------------------------------------------
// Banner Upload
// ---------------------------------------------------------------------------

export async function uploadBanner(formData: FormData): Promise<string> {
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("Aucun fichier fourni");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Le fichier est trop volumineux. Taille maximale : 5 Mo.");
  }

  // Use admin client (service role) for storage operations
  const adminClient = createAdminClient();

  // Ensure the "banners" bucket exists (idempotent - OK if already exists)
  try {
    await adminClient.storage.createBucket("banners", { public: true });
  } catch {
    // Bucket may already exist, that's fine
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${DEFAULT_USER_ID}/banner-${Date.now()}.${ext}`;

  // Upload to Supabase Storage using admin client
  const { error: uploadError } = await adminClient.storage
    .from("banners")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erreur lors de l'upload : ${uploadError.message}`);
  }

  // Get public URL using admin client
  const { data: urlData } = adminClient.storage
    .from("banners")
    .getPublicUrl(fileName);

  const bannerUrl = urlData.publicUrl;

  // Update profile with new banner URL (use regular server client for RLS)
  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      banner_url: bannerUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", DEFAULT_USER_ID);

  if (updateError) {
    throw new Error(`Erreur lors de la mise à jour du profil : ${updateError.message}`);
  }

  revalidatePath("/", "layout");
  return bannerUrl;
}

// ---------------------------------------------------------------------------
// Profile Update
// ---------------------------------------------------------------------------

export async function updateProfile(data: {
  full_name?: string | null;
  theme?: "light" | "dark" | "system";
  timezone?: string;
}): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", DEFAULT_USER_ID);

  if (error) {
    throw new Error(`Erreur lors de la mise à jour du profil : ${error.message}`);
  }

  revalidatePath("/", "layout");
}
