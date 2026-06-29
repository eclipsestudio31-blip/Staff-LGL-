import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const sqlPath = join(__dirname, "..", "ox_doorlock.sql");
const outputPath = join(__dirname, "..", "doorlocks-data.json");

const sql = readFileSync(sqlPath, "utf-8");

interface DoorLockData {
  id: number;
  name: string;
  state: number;
  passcode: string | null;
  groups: Record<string, number>;
  maxDistance: number;
  data: Record<string, unknown>;
}

const results: DoorLockData[] = [];

const regex = /\((\d+),\s*'([^']*)',\s*'(\{.*?\})'\)/g;
let match: RegExpExecArray | null;

while ((match = regex.exec(sql)) !== null) {
  const id = parseInt(match[1], 10);
  const name = match[2];
  const jsonStr = match[3].replace(/\\"/g, '"').replace(/\\\\/g, "\\");

  try {
    const data = JSON.parse(jsonStr) as Record<string, unknown>;

    const state = typeof data.state === "number" ? data.state : 1;
    const maxDistance = typeof data.maxDistance === "number" ? data.maxDistance : 4.0;
    const passcode = typeof data.passcode === "string" && data.passcode !== "0" ? data.passcode : null;

    let groups: Record<string, number> = {};
    if (data.groups && typeof data.groups === "object") {
      groups = data.groups as Record<string, number>;
    }

    // Normalize group names (trim trailing spaces)
    const normalizedGroups: Record<string, number> = {};
    for (const [key, val] of Object.entries(groups)) {
      normalizedGroups[key.trim()] = val;
    }

    results.push({
      id,
      name,
      state,
      passcode,
      groups: normalizedGroups,
      maxDistance,
      data,
    });
  } catch (err) {
    console.error(`Failed to parse doorlock ${id} (${name}):`, err);
  }
}

writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
console.log(`Parsed ${results.length} doorlocks to ${outputPath}`);
