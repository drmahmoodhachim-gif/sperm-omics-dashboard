const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

/** With API key: 10 req/s. Without: 3 req/s (NCBI policy). */
function rateLimitMs() {
  return process.env.NCBI_API_KEY ? 110 : 350;
}

let lastCall = 0;

export function hasNcbiApiKey(): boolean {
  return Boolean(process.env.NCBI_API_KEY?.trim());
}

export async function ncbiFetch(
  endpoint: string,
  params: Record<string, string>
): Promise<Response> {
  const now = Date.now();
  const wait = rateLimitMs() - (now - lastCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();

  const apiKey = process.env.NCBI_API_KEY?.trim();
  const qs = new URLSearchParams(params);
  if (apiKey) qs.set("api_key", apiKey);

  const url = `${EUTILS}/${endpoint}?${qs}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`NCBI ${endpoint} failed: ${res.status}`);
  return res;
}

export async function esearch(
  db: string,
  term: string,
  retmax = 50
): Promise<string[]> {
  const res = await ncbiFetch("esearch.fcgi", {
    db,
    term,
    retmax: String(retmax),
    retmode: "json",
  });
  const json = await res.json();
  return (json.esearchresult?.idlist as string[]) ?? [];
}

export async function esummary(
  db: string,
  ids: string[]
): Promise<Record<string, Record<string, unknown>>> {
  if (ids.length === 0) return {};
  const res = await ncbiFetch("esummary.fcgi", {
    db,
    id: ids.join(","),
    retmode: "json",
  });
  const json = await res.json();
  return (json.result as Record<string, Record<string, unknown>>) ?? {};
}

export async function efetchPubMedAbstracts(
  pmids: string[]
): Promise<Map<string, string>> {
  if (pmids.length === 0) return new Map();
  const res = await ncbiFetch("efetch.fcgi", {
    db: "pubmed",
    id: pmids.join(","),
    retmode: "xml",
  });
  const xml = await res.text();
  const map = new Map<string, string>();
  const blocks = xml.split("<PubmedArticle>");
  for (const block of blocks) {
    const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    const absMatch = block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
    if (pmidMatch && absMatch) {
      map.set(pmidMatch[1], absMatch[1].replace(/<[^>]+>/g, "").trim());
    }
  }
  return map;
}
