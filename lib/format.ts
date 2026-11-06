export function fmtDate(d: string) {
  return new Date(String(d).slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
