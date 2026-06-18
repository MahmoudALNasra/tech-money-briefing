import fs from "fs";
import path from "path";

const skipDirs = new Set([
  "[category]",
  "api",
  "admin",
  "analytics",
  "auth",
  "login",
  "signup",
  "profile",
  "search",
  "leads",
  "compare",
  "tools",
  "media",
  "t",
  "business-data-generator"
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name) && !entry.name.startsWith("[")) {
        walk(full, files);
      }
      continue;
    }

    if (entry.name === "page.tsx" && dir.startsWith("app")) {
      files.push(full);
    }
  }

  return files;
}

const files = walk("app");
let updated = 0;

for (const file of files) {
  let src = fs.readFileSync(file, "utf8");

  if (src.includes("buildPageMetadata")) {
    continue;
  }

  if (!src.includes("export const metadata")) {
    continue;
  }

  if (src.includes("openGraph:") && src.includes("twitter:")) {
    continue;
  }

  const route = `/${path.dirname(file).replace(/^app[\\/]/, "").replace(/\\/g, "/")}`;
  const titleMatch = src.match(/title:\s*["']([^"']+)["']/);
  const descTemplate = src.match(/description:\s*`([^`]+)`/);
  const descString = src.match(/description:\s*"([^"]+)"/);
  const description = descTemplate?.[1] ?? descString?.[1];

  if (!titleMatch || !description) {
    console.log("skip parse", file);
    continue;
  }

  const keywordsMatch = src.match(/keywords:\s*\[([\s\S]*?)\]/);
  const robotsMatch = src.match(/robots:\s*(\{[\s\S]*?\})/);

  if (!src.includes('from "next"')) {
    src = `import type { Metadata } from "next";\n${src}`;
  }

  if (!src.includes("buildPageMetadata")) {
    if (src.includes('import type { Metadata } from "next";')) {
      src = src.replace(
        'import type { Metadata } from "next";\n',
        'import type { Metadata } from "next";\n\nimport { buildPageMetadata } from "@/lib/page-metadata";\n'
      );
    } else {
      src = `import { buildPageMetadata } from "@/lib/page-metadata";\n${src}`;
    }
  }

  const metaBlock = src.match(/export const metadata(?:: Metadata)? = \{[\s\S]*?\n\};/);

  if (!metaBlock) {
    console.log("skip block", file);
    continue;
  }

  let replacement = "export const metadata = buildPageMetadata({\n";
  replacement += `  title: ${JSON.stringify(titleMatch[1])},\n`;
  replacement += `  description: ${JSON.stringify(description)},\n`;
  replacement += `  path: ${JSON.stringify(route)}`;

  if (keywordsMatch) {
    replacement += `,\n  keywords: [${keywordsMatch[1].trim()}]`;
  }

  if (robotsMatch) {
    replacement += `,\n  robots: ${robotsMatch[1]}`;
  }

  replacement += "\n});";

  src = src.replace(metaBlock[0], replacement);
  fs.writeFileSync(file, src);
  updated += 1;
  console.log("updated", file, route);
}

console.log("total", updated);
