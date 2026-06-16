import { createClient } from "@supabase/supabase-js";
import { OWNER_VOICE_SKIP_SLUGS } from "../lib/article-attribution.ts";

const size = Number(process.argv.find((arg) => arg.startsWith("--size="))?.split("=")[1] ?? 20);
const onlyOthers = process.argv.includes("--others-only");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

let query = supabase
  .from("articles")
  .select("slug,category,title")
  .eq("status", "published")
  .not("source_name", "ilike", "%Referral%")
  .order("published_at", { ascending: false });

if (onlyOthers) {
  query = query.eq("category", "others");
} else {
  query = query.neq("category", "others");
}

const { data, error } = await query;
if (error) {
  throw error;
}

const batch = (data ?? [])
  .filter((article) => !OWNER_VOICE_SKIP_SLUGS.includes(article.slug))
  .slice(0, size);

console.log(JSON.stringify(batch, null, 2));
console.error(`count=${batch.length}`);
