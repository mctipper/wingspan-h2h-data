import type { RawGame } from "@/types/raw";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateGame(raw: RawGame): ValidationResult {
  const errors: ValidationError[] = [];
  const { hubby, wifey } = raw.players;

  const hubbyKeys = Object.keys(hubby);
  const wifeyKeys = Object.keys(wifey);

  if (hubbyKeys.length === 0) {
    errors.push({ field: "categories", message: "At least one category is required" });
    return { valid: false, errors };
  }

  // Check for empty category names
  for (let i = 0; i < hubbyKeys.length; i++) {
    if (!hubbyKeys[i].trim()) {
      errors.push({ field: `category[${i}].name`, message: `Category ${i + 1} name is empty` });
    }
  }

  // Check for duplicate names
  const seen = new Set<string>();
  for (let i = 0; i < hubbyKeys.length; i++) {
    const name = hubbyKeys[i].trim();
    if (seen.has(name)) {
      errors.push({ field: `category[${i}].name`, message: `Duplicate category name: "${name}"` });
    }
    seen.add(name);
  }

  // Check matching keys between players
  const missingFromHubby = wifeyKeys.filter((k) => !hubbyKeys.includes(k));
  const missingFromWifey = hubbyKeys.filter((k) => !wifeyKeys.includes(k));
  if (missingFromHubby.length > 0) {
    errors.push({ field: "categories", message: `Missing from hubby: ${missingFromHubby.join(", ")}` });
  }
  if (missingFromWifey.length > 0) {
    errors.push({ field: "categories", message: `Missing from wifey: ${missingFromWifey.join(", ")}` });
  }

  // Check all values are valid numbers
  for (const key of hubbyKeys) {
    if (typeof hubby[key] !== "number" || isNaN(hubby[key])) {
      errors.push({ field: `category.hubby.${key}`, message: `Hubby score for "${key}" is not a valid number` });
    }
  }
  for (const key of wifeyKeys) {
    if (typeof wifey[key] !== "number" || isNaN(wifey[key])) {
      errors.push({ field: `category.wifey.${key}`, message: `Wifey score for "${key}" is not a valid number` });
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  // Check drawResult when totals are equal
  const totalHubby = hubbyKeys.reduce((s, k) => s + (hubby[k] ?? 0), 0);
  const totalWifey = wifeyKeys.reduce((s, k) => s + (wifey[k] ?? 0), 0);

  if (totalHubby === totalWifey) {
    if (!raw.drawResult) {
      errors.push({
        field: "drawResult",
        message: "Scores are equal — select a draw result",
      });
    } else if (!["draw", "wifey", "hubby"].includes(raw.drawResult)) {
      errors.push({
        field: "drawResult",
        message: `Invalid draw result: "${raw.drawResult}"`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
