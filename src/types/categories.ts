/**
 * Category registry — the single source of truth for which scoring categories
 * exist, their canonical order (form, validation and storage all follow it),
 * and which are "special" expansion categories flagged in the games tables.
 *
 * Colours are deliberately absent: presentation lives in `styles/design.ts`,
 * keyed by category name, so the domain never depends on styling.
 */
export const CATEGORIES = [
  { name: "Birds" },
  { name: "Bonus Cards" },
  { name: "End-Of-Round" },
  { name: "Eggs" },
  { name: "Food on Cards" },
  { name: "Tucked" },
  { name: "Nectar", special: { abbrev: "N" } },
  { name: "Duet", special: { abbrev: "D" } },
  { name: "Hummingbirds", special: { abbrev: "H" } },
] as const;

type CategoryDefinition = (typeof CATEGORIES)[number];
type SpecialCategoryDefinition = Extract<CategoryDefinition, { special: unknown }>;

export type ValidCategory = CategoryDefinition["name"];
export type SpecialCategory = SpecialCategoryDefinition["name"];

/** Category names in canonical order. */
export const VALID_CATEGORIES: readonly ValidCategory[] = CATEGORIES.map((c) => c.name);

/** Special categories in canonical order — drives the tick columns in both games tables. */
export const SPECIAL_CATEGORIES: readonly SpecialCategoryDefinition[] = CATEGORIES.filter(
  (c): c is SpecialCategoryDefinition => "special" in c,
);
