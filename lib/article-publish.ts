import { generateShareId } from "./share-id";
import { slugify } from "./slug";
import { supabase } from "./supabase";

export async function articleExistsBySourceUrl(sourceUrl: string) {
  const { data, error } = await supabase
    .from("articles")
    .select("id")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (error) {
    throw new Error(`Duplicate check failed: ${error.message}`);
  }

  return Boolean(data);
}

export async function createUniqueSlug(title: string) {
  const baseSlug = slugify(title);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Slug check failed: ${error.message}`);
    }

    if (!data) {
      return slug;
    }
  }

  return `${baseSlug}-${generateShareId(6)}`;
}

export async function createUniqueShareId() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const shareId = generateShareId();
    const { data, error } = await supabase
      .from("articles")
      .select("id")
      .eq("share_id", shareId)
      .maybeSingle();

    if (error) {
      throw new Error(`Share id check failed: ${error.message}`);
    }

    if (!data) {
      return shareId;
    }
  }

  throw new Error("Failed to generate a unique share_id");
}
