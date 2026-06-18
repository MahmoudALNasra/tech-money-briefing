import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (entry.name === "page.tsx") {
      files.push(full);
    }
  }
  return files;
}

let fixed = 0;

for (const file of walk("app")) {
  let src = fs.readFileSync(file, "utf8");

  if (!src.includes("buildPageMetadata")) {
    continue;
  }

  if (src.includes('import { buildPageMetadata }')) {
    continue;
  }

  if (src.includes('import type { Metadata } from "next";')) {
    src = src.replace(
      /import type \{ Metadata \} from "next";\r?\n+/,
      'import type { Metadata } from "next";\n\nimport { buildPageMetadata } from "@/lib/page-metadata";\n'
    );
  } else {
    src = `import { buildPageMetadata } from "@/lib/page-metadata";\n${src}`;
  }

  fs.writeFileSync(file, src);
  fixed += 1;
  console.log("import added", file);
}

console.log("total", fixed);
