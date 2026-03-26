const API = import.meta.env.VITE_API_BASE || "";

async function api(path, opts) {
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    let msg = "Request failed";
    try {
      const d = await res.json();
      if (d.detail) msg = d.detail;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// hit /health so Render wakes up while the UI loads cached data
export function warmUp() {
  fetch(API + "/health").catch(() => {});
}

export function fetchDecks() {
  return api("/api/decks");
}

export function createDeck(name) {
  return api("/api/decks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function updateDeck(id, name) {
  return api("/api/decks/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function deleteDeck(id) {
  return api("/api/decks/" + id, { method: "DELETE" });
}

export function fetchCards(deckId) {
  return api("/api/decks/" + deckId + "/cards");
}

export function createCard(deckId, data) {
  return api("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deck_id: deckId, ...data }),
  });
}

export function updateCard(id, data) {
  return api("/api/cards/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function deleteCard(id) {
  return api("/api/cards/" + id, { method: "DELETE" });
}
