const API_BASE = import.meta.env.VITE_API_BASE || "";
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 20000;

async function apiFetch(path, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const url = `${API_BASE}${path}`;

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(
        `Request timed out after ${Math.round(
          API_TIMEOUT_MS / 1000
        )}s. If deployed, your Render API may be sleeping.`
      );
    }
    throw new Error(`Could not reach API at ${url}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.detail) {
        message = Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg || d.detail || String(d)).join(", ")
          : data.detail;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

export async function fetchDecks() {
  const res = await apiFetch("/api/decks");
  return handleResponse(res);
}

export async function createDeck(name) {
  const res = await apiFetch("/api/decks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
}

export async function updateDeck(id, name) {
  const res = await apiFetch(`/api/decks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
}

export async function deleteDeck(id) {
  const res = await apiFetch(`/api/decks/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function fetchCards(deckId) {
  const res = await apiFetch(`/api/decks/${deckId}/cards`);
  return handleResponse(res);
}

export async function createCard(deckId, payload) {
  const res = await apiFetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deck_id: deckId, ...payload }),
  });
  return handleResponse(res);
}

export async function updateCard(cardId, payload) {
  const res = await apiFetch(`/api/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteCard(cardId) {
  const res = await apiFetch(`/api/cards/${cardId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}


