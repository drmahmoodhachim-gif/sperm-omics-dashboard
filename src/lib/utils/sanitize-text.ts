/** Strip WordprocessingML (docx) markup and return human-readable text. */
export function stripWordXml(text: string | null | undefined): string {
  if (!text) return "";
  if (!text.includes("<w:") && !text.includes("<w ")) return text.trim();

  const parts: string[] = [];
  for (const m of text.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)) {
    parts.push(decodeXmlEntities(m[1]));
  }
  if (parts.length > 0) {
    return parts.join("").replace(/\s+/g, " ").trim();
  }

  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const ACCESSION_RE =
  /\b(GSE\d+|PXD\d+|E-MTAB-\d+|SPERMD-\d+|SRP\d+|PRJNA\d+|SAMN\d+)\b/i;

/** Extract a repository accession ID from free text. */
export function extractAccession(text: string): string | null {
  const clean = stripWordXml(text);
  const m = clean.match(ACCESSION_RE);
  return m ? m[1].toUpperCase() : null;
}

export function isWordXmlGarbage(text: string | null | undefined): boolean {
  if (!text) return false;
  return text.includes("<w:tcPr") || text.includes("<w:trPr") || text.includes("<w:p ");
}

export function sanitizeAccession(
  accession: string | null | undefined,
  fallbackText?: string
): string {
  const fromField = extractAccession(accession ?? "");
  if (fromField) return fromField;

  if (fallbackText) {
    const fromFallback = extractAccession(fallbackText);
    if (fromFallback) return fromFallback;
  }

  const cleaned = stripWordXml(accession);
  // Short repository-style IDs only (not sentence titles)
  if (cleaned && cleaned.length <= 32 && !/\s/.test(cleaned)) {
    return cleaned;
  }

  return "—";
}

export function sanitizeDatasetText(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  const clean = stripWordXml(text);
  return clean || undefined;
}

/** Extract plain text from a docx table cell XML fragment. */
export function extractCellText(cellXml: string): string {
  return stripWordXml(cellXml);
}
