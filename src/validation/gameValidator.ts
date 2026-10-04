/**
 * Single source of truth for what constitutes a valid game submission.
 *
 * Shared by the admin form (fast feedback) and the API (authoritative gate), so
 * the rules cannot drift between tiers. Accepts `unknown` because the server
 * feeds it untrusted request bodies; on success it returns a *canonical* copy —
 * only known fields, players and categories in a fixed order — so persisted
 * JSON stays stable regardless of how the client shaped its payload.
 */
import { VALID_CATEGORIES, type ValidCategory } from "@/types/categories";
import type { RawGame, RawScore } from "@/types/raw";
import { PLAYERS, type Player } from "@/types/domain";

/** A game as submitted by a client — the server owns `game_id`. */
export type GameInput = Omit<RawGame, "game_id">;

export interface ValidationError {
  /** Dotted path to the offending field, used by the form to locate errors. */
  field: string;
  message: string;
}

export type ValidationResult =
  | { valid: true; game: GameInput }
  | { valid: false; errors: ValidationError[] };

const DRAW_RESULTS: ReadonlyArray<NonNullable<RawGame["drawResult"]>> = ["hubby", "wifey", "draw"];
const ALLOWED_TOP_LEVEL_FIELDS = new Set(["game_id", "players", "drawResult"]);

/** Narrows to a plain object (excludes null and arrays, which `typeof` lets through). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Type guard against the canonical category list. */
function isValidCategory(name: string): name is ValidCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(name);
}

/**
 * Validates and canonicalises a game submission.
 *
 * Runs in phases, short-circuiting when a phase fails because later phases
 * depend on its guarantees (e.g. totals are meaningless with non-numeric scores).
 * `game_id` is tolerated in the input but never validated or returned — callers
 * attach their own. Pure: never mutates `input`.
 */
export function validateGameInput(input: unknown): ValidationResult {
  // ── Phase 1: structure ──
  if (!isPlainObject(input)) {
    return fail({ field: "game", message: "Game must be an object" });
  }

  const structuralErrors: ValidationError[] = [];
  for (const key of Object.keys(input)) {
    if (!ALLOWED_TOP_LEVEL_FIELDS.has(key)) {
      structuralErrors.push({ field: key, message: `Unknown field: "${key}"` });
    }
  }

  const { players } = input;
  if (!isPlainObject(players)) {
    structuralErrors.push({ field: "players", message: "Players must be an object" });
    return { valid: false, errors: structuralErrors };
  }
  for (const player of PLAYERS) {
    if (!isPlainObject(players[player])) {
      structuralErrors.push({ field: `players.${player}`, message: `Scores for ${player} must be an object` });
    }
  }
  for (const key of Object.keys(players)) {
    if (!(PLAYERS as readonly string[]).includes(key)) {
      structuralErrors.push({ field: `players.${key}`, message: `Unknown player: "${key}"` });
    }
  }
  if (structuralErrors.length > 0) return { valid: false, errors: structuralErrors };

  const scores = players as Record<Player, Record<string, unknown>>;

  // ── Phase 2: categories ──
  const categoryErrors = validateCategories(scores);
  if (categoryErrors.length > 0) return { valid: false, errors: categoryErrors };

  // ── Phase 3: scores ──
  const scoreErrors = validateScores(scores);
  if (scoreErrors.length > 0) return { valid: false, errors: scoreErrors };

  const typedScores = scores as Record<Player, RawScore>;

  // ── Phase 4: outcome ──
  const drawResultErrors = validateDrawResult(input.drawResult, typedScores);
  if (drawResultErrors.length > 0) return { valid: false, errors: drawResultErrors };

  return { valid: true, game: canonicalise(typedScores, input.drawResult as GameInput["drawResult"]) };
}

/** Both players must score the same, non-empty set of known categories. */
function validateCategories(scores: Record<Player, Record<string, unknown>>): ValidationError[] {
  const errors: ValidationError[] = [];
  const wifeyKeys = Object.keys(scores.wifey);
  const hubbyKeys = Object.keys(scores.hubby);

  if (wifeyKeys.length === 0 && hubbyKeys.length === 0) {
    return [{ field: "categories", message: "At least one category is required" }];
  }

  const unknown = new Set([...wifeyKeys, ...hubbyKeys].filter((k) => !isValidCategory(k)));
  for (const name of unknown) {
    errors.push({ field: "categories", message: `Unknown category: "${name}"` });
  }

  const missingFromHubby = wifeyKeys.filter((k) => !(k in scores.hubby));
  const missingFromWifey = hubbyKeys.filter((k) => !(k in scores.wifey));
  if (missingFromHubby.length > 0) {
    errors.push({ field: "categories", message: `Missing from hubby: ${missingFromHubby.join(", ")}` });
  }
  if (missingFromWifey.length > 0) {
    errors.push({ field: "categories", message: `Missing from wifey: ${missingFromWifey.join(", ")}` });
  }
  return errors;
}

/**
 * Scores must be non-negative integers. Strings are rejected outright rather
 * than coerced — a numeric string would silently concatenate in totals.
 */
function validateScores(scores: Record<Player, Record<string, unknown>>): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const player of PLAYERS) {
    for (const [category, value] of Object.entries(scores[player])) {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        errors.push({
          field: `players.${player}.${category}`,
          message: `${capitalise(player)} score for "${category}" must be a whole number of 0 or more`,
        });
      }
    }
  }
  return errors;
}

/**
 * `drawResult` is required exactly when totals are equal, and forbidden
 * otherwise — a stale value on a decided game would misrepresent the outcome.
 */
function validateDrawResult(drawResult: unknown, scores: Record<Player, RawScore>): ValidationError[] {
  const isTie = total(scores.wifey) === total(scores.hubby);

  if (drawResult === undefined) {
    return isTie ? [{ field: "drawResult", message: "Scores are equal — select a draw result" }] : [];
  }
  if (!DRAW_RESULTS.includes(drawResult as NonNullable<RawGame["drawResult"]>)) {
    return [{ field: "drawResult", message: `Invalid draw result: "${String(drawResult)}"` }];
  }
  if (!isTie) {
    return [{ field: "drawResult", message: "Draw result is only allowed when scores are equal" }];
  }
  return [];
}

/**
 * Rebuilds the game from validated parts in storage order (drawResult before
 * players, wifey before hubby, categories in VALID_CATEGORIES order), dropping
 * anything not explicitly copied.
 */
function canonicalise(scores: Record<Player, RawScore>, drawResult: GameInput["drawResult"]): GameInput {
  /** Copies a player's scores with keys in registry order. */
  const ordered = (score: RawScore): RawScore =>
    Object.fromEntries(VALID_CATEGORIES.filter((c) => c in score).map((c) => [c, score[c]]));

  return {
    ...(drawResult !== undefined && { drawResult }),
    players: { wifey: ordered(scores.wifey), hubby: ordered(scores.hubby) },
  };
}

/** Sum of a player's category scores. */
function total(score: RawScore): number {
  return Object.values(score).reduce((sum, v) => sum + v, 0);
}

/** Upper-cases the first letter, for player names in messages. */
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Wraps a single error as a failed result. */
function fail(error: ValidationError): ValidationResult {
  return { valid: false, errors: [error] };
}
