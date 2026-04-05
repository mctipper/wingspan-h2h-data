import type { RawGame } from "@/types/raw";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function fetchGames(): Promise<RawGame[]> {
  return request<RawGame[]>("/api/games");
}

export async function createGame(game: Omit<RawGame, "game_id">): Promise<RawGame> {
  return request<RawGame>("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(game),
  });
}

export async function updateGame(id: number, game: RawGame): Promise<RawGame> {
  return request<RawGame>(`/api/games/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(game),
  });
}

export async function deleteGame(id: number): Promise<void> {
  await request<void>(`/api/games/${id}`, { method: "DELETE" });
}

