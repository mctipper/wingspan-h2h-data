export const VALID_CATEGORIES = [
  "Birds",
  "Bonus Cards",
  "End-Of-Round",
  "Eggs",
  "Food on Cards",
  "Tucked",
  "Nectar",
  "Duet",
  "Hummingbirds",
] as const;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];
