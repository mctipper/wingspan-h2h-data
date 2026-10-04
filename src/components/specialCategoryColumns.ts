/**
 * The special-category tick columns shared by the public games table and the
 * admin games list — one header and one cell per registry entry, so adding a
 * special category to the registry adds the column everywhere.
 */
import { SPECIAL_CATEGORIES } from "@/types/categories";
import type { CategoryScore } from "@/types/domain";
import { SPECIAL_CATEGORY_COLOUR } from "@/styles/design";

/** `<th>` per special category: abbreviation as text, full name as tooltip. */
export function specialCategoryHeaders(): string {
  return SPECIAL_CATEGORIES.map(({ name, special }) => `<th title="${name}">${special.abbrev}</th>`).join("\n");
}

/** `<td>` per special category, holding a coloured tick when the game included it. */
export function specialCategoryCells(categories: readonly CategoryScore[]): string {
  const present = new Set(categories.map((c) => c.category));
  return SPECIAL_CATEGORIES.map(({ name }) => {
    const tick = present.has(name)
      ? `<span style="color:${SPECIAL_CATEGORY_COLOUR[name]};font-weight:700;" title="${name}">✓</span>`
      : "";
    return `<td>${tick}</td>`;
  }).join("\n");
}
