/** "Oct 17, 2026, 8:21 PM ET" */
export function etStamp(d = new Date()): string {
  return (
    d.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }) + " ET"
  );
}

export const oneLine = (t: string) => t.replace(/[\r\n\u0000-\u001f]+/g, " ").trim();

/** "Last, First" */
export const nameLabel = (last: string, first: string) => `${oneLine(last)}, ${oneLine(first)}`;
