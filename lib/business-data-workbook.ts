export async function makeFormattedWorkbookBlob(csv: string) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(csv, { type: "string" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1:A1");
  const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    defval: ""
  });

  if (rows.length <= 1) {
    throw new Error(
      "The export did not contain any business rows. Please run the search again before exporting."
    );
  }

  const headers = rows[0] ?? [];
  const wideColumns = new Set([
    "address",
    "website",
    "google_maps_url",
    "email_candidates",
    "website_title",
    "meta_description",
    "homepage_headings",
    "social_links",
    "contact_url",
    "opportunity_signal",
    "website_analysis",
    "business_opportunity_summary",
    "recommended_pitch"
  ]);
  const extraWideColumns = new Set([
    "opportunity_signal",
    "website_analysis",
    "business_opportunity_summary",
    "recommended_pitch"
  ]);

  worksheet["!cols"] = headers.map((header) => {
    if (extraWideColumns.has(header)) {
      return { wch: 72 };
    }

    if (wideColumns.has(header)) {
      return { wch: 36 };
    }

    return { wch: 20 };
  });

  worksheet["!rows"] = rows.map((row, index) => {
    if (index === 0) {
      return { hpt: 28 };
    }

    const tallestCell = Math.max(
      2,
      ...row.map((cell) => {
        const text = String(cell ?? "");
        const explicitLines = text.split("\n").length;
        const wrappedLines = Math.ceil(text.length / 70);
        return Math.max(explicitLines, wrappedLines);
      })
    );

    return { hpt: Math.min(150, Math.max(34, tallestCell * 16)) };
  });

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[address] as
        | { s?: { alignment?: { wrapText?: boolean; vertical?: string } } }
        | undefined;

      if (cell) {
        cell.s = {
          ...(cell.s ?? {}),
          alignment: {
            ...(cell.s?.alignment ?? {}),
            wrapText: true,
            vertical: "top"
          }
        };
      }
    }
  }

  const data = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true
  }) as ArrayBuffer;

  return new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

export async function downloadFormattedWorkbook(csv: string, filename: string) {
  const blob = await makeFormattedWorkbookBlob(csv);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
