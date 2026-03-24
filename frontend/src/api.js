const API_BASE = import.meta.env.VITE_API_BASE || "";

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
  const res = await fetch(`${API_BASE}/api/decks`);
  return handleResponse(res);
}

export async function createDeck(name) {
  const res = await fetch(`${API_BASE}/api/decks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
}

export async function updateDeck(id, name) {
  const res = await fetch(`${API_BASE}/api/decks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
}

export async function deleteDeck(id) {
  const res = await fetch(`${API_BASE}/api/decks/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function fetchCards(deckId) {
  const res = await fetch(`${API_BASE}/api/decks/${deckId}/cards`);
  return handleResponse(res);
}

export async function createCard(deckId, payload) {
  const res = await fetch(`${API_BASE}/api/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deck_id: deckId, ...payload }),
  });
  return handleResponse(res);
}

export async function updateCard(cardId, payload) {
  const res = await fetch(`${API_BASE}/api/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteCard(cardId) {
  const res = await fetch(`${API_BASE}/api/cards/${cardId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}


