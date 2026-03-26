import { useEffect, useState } from "react";
import { fetchDecks, createDeck, updateDeck, deleteDeck } from "./api.js";

function loadCached(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

let _busy = false;

function DecksPage({ onOpenDeck }) {
  const [decks, setDecks] = useState(() => loadCached("decks"));
  const [loading, setLoading] = useState(() => loadCached("decks").length === 0);
  const [error, setError] = useState("");
  const [newDeckName, setNewDeckName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  function updateDecks(fn) {
    setDecks((prev) => {
      const next = fn(prev);
      try { localStorage.setItem("decks", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  useEffect(() => {
    let alive = true;
    const hadCache = loadCached("decks").length > 0;

    fetchDecks()
      .then((data) => {
        if (!alive) return;
        updateDecks(() => data);
        setError("");
      })
      .catch((err) => {
        if (alive && !hadCache)
          setError(err.message || "Failed to load decks");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => { alive = false; };
  }, []);

  async function handleCreateDeck(e) {
    e.preventDefault();
    if (_busy) return;
    const name = newDeckName.trim();
    if (!name) return;
    _busy = true;
    setSaving(true);
    e.target.querySelector('button[type="submit"]').disabled = true;
    try {
      const deck = await createDeck(name);
      updateDecks((prev) => [deck, ...prev]);
      setNewDeckName("");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to create deck");
    } finally {
      _busy = false;
      setSaving(false);
    }
  }

  function startEditing(deck) {
    setEditingId(deck.id);
    setEditingName(deck.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleUpdateDeck(e) {
    e.preventDefault();
    if (_busy || !editingId) return;
    const name = editingName.trim();
    if (!name) return;
    _busy = true;
    setSaving(true);
    try {
      const updated = await updateDeck(editingId, name);
      updateDecks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      cancelEditing();
      setError("");
    } catch (err) {
      setError(err.message || "Failed to update deck");
    } finally {
      _busy = false;
      setSaving(false);
    }
  }

  async function handleDeleteDeck(id) {
    if (!window.confirm("Delete this deck? This cannot be undone.")) return;
    if (_busy) return;
    _busy = true;
    setSaving(true);
    try {
      await deleteDeck(id);
      updateDecks((prev) => prev.filter((d) => d.id !== id));
      setError("");
    } catch (err) {
      setError(err.message || "Failed to delete deck");
    } finally {
      _busy = false;
      setSaving(false);
    }
  }

  return (
    <section className="decks-page">
      <div className="card">
        <h2>Decks</h2>
        <p className="subtitle">
          Create and manage decks. Cards and study mode will use these.
        </p>

        <form className="deck-form" onSubmit={editingId ? handleUpdateDeck : handleCreateDeck}>
          <label className="field">
            <span>{editingId ? "Rename deck" : "New deck name"}</span>
            <input
              type="text"
              value={editingId ? editingName : newDeckName}
              onChange={(e) =>
                editingId
                  ? setEditingName(e.target.value)
                  : setNewDeckName(e.target.value)
              }
              placeholder="e.g. Random test"
              disabled={saving}
            />
          </label>
          <div className="actions">
            {editingId && (
              <button
                type="button"
                className="btn secondary"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn primary" disabled={saving}>
              {editingId ? "Save" : "Add deck"}
            </button>
          </div>
        </form>

        {loading && <p>Loading decks...</p>}
        {error && !loading && <p className="error">{error}</p>}

        {!loading && decks.length === 0 && (
          <p className="empty">No decks yet. Create your first one above.</p>
        )}

        <ul className="deck-list">
          {decks.map((deck) => (
            <li key={deck.id} className="deck-item">
              <div className="deck-main">
                <div>
                  <div className="deck-name">{deck.name}</div>
                  {deck.created_at && (
                    <div className="deck-meta">
                      Created at:{" "}
                      {new Date(deck.created_at).toLocaleString() ||
                        deck.created_at}
                    </div>
                  )}
                </div>
              </div>
              <div className="deck-actions">
                <button
                  type="button"
                  className="btn small"
                  onClick={() => onOpenDeck && onOpenDeck(deck)}
                  disabled={saving}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => startEditing(deck)}
                  disabled={saving}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="btn small danger"
                  onClick={() => handleDeleteDeck(deck.id)}
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default DecksPage;
