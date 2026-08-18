import { readFileSync } from "node:fs";
import path from "node:path";

export function readJson<T>(fileName: string): T {
  const filePath = path.join(__dirname, "../seed-data", fileName);
  return JSON.parse(readFileSync(filePath, "utf-8"));
}
