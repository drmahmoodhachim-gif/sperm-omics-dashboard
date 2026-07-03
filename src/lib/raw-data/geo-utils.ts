export function toHttps(url: string): string {
  return url.replace(/^ftp:\/\//i, "https://");
}

export function unquoteGeoCell(s: string): string {
  return s.replace(/^"|"$/g, "").trim();
}
