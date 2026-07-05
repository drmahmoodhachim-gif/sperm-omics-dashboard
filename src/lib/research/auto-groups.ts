export type SampleGroup = "A" | "B" | null;

export interface MatrixSampleLike {
  id: string;
  title: string;
  characteristics: string[];
}

export function suggestGroup(char: string): SampleGroup {
  const c = char.toLowerCase();
  if (/esc|ipsc|pluripot|h1esc|normal-ipsc/i.test(c)) return "A";
  if (/pgclc|melc|germline|meiosis|d4pgclc/i.test(c)) return "B";
  if (/control|fertile|normal|healthy|wild|wt|norm|reference/.test(c)) return "A";
  if (/infertile|case|disease|patient|azoosperm|astheno|oligo|mut|patholog/.test(c)) return "B";
  return null;
}

export function buildAutoGroups(samples: MatrixSampleLike[]): Record<string, SampleGroup> {
  const auto: Record<string, SampleGroup> = {};
  for (const s of samples) {
    auto[s.id] = suggestGroup(`${s.characteristics.join(" ")} ${s.title}`);
  }

  const groupA = Object.values(auto).filter((g) => g === "A").length;
  const groupB = Object.values(auto).filter((g) => g === "B").length;
  if (groupA >= 2 && groupB >= 2) return auto;

  const ids = samples.map((s) => s.id);
  if (ids.length < 4) return auto;

  const mid = Math.floor(ids.length / 2);
  for (let i = 0; i < ids.length; i++) {
    auto[ids[i]] = i < mid ? "A" : "B";
  }
  return auto;
}

export function groupsFromAssignments(assignments: Record<string, SampleGroup>) {
  const groupA = Object.entries(assignments)
    .filter(([, g]) => g === "A")
    .map(([id]) => id);
  const groupB = Object.entries(assignments)
    .filter(([, g]) => g === "B")
    .map(([id]) => id);
  return { groupA, groupB };
}
