import { useEffect, useState } from "react";
import { fetchDecks, createDeck, updateDeck, deleteDeck } from "./api.js";

const DECKS_CACHE_KEY = "flashcards:decks";

function readDecksCache() {
  try {
    const raw = localStorage.getItem(DECKS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDecksCache(decks) {
  try {
    localStorage.setItem(DECKS_CACHE_KEY, JSON.stringify(decks));
  } catch {
    // Ignore storage failures (private mode / quota)
  }
}

function DecksPage({ onOpenDeck }) {
  const [decks, setDecks] = useState(() => readDecksCache());
  const [loading, setLoading] = useState(() => readDecksCache().length === 0);
  const [showWakeHint, setShowWakeHint] = useState(false);
  const [error, setError] = useState("");
  const [newDeckName, setNewDeckName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  function setDecksAndCache(nextOrUpdater) {
    setDecks((prev) => {
      const next =
        typeof nextOrUpdater === "function"
          ? nextOrUpdater(prev)
          : nextOrUpdater;
      writeDecksCache(next);
      return next;
    });
  }

  useEffect(() => {
    let isMounted = true;
    const cachedDecks = readDecksCache();
    const hasCached = cachedDecks.length > 0;

    if (hasCached) {
      setDecksAndCache(cachedDecks);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setShowWakeHint(false);
    const wakeHintTimer = setTimeout(() => {
      if (isMounted && !hasCached) {
        setShowWakeHint(true);
      }
    }, 5000);
    fetchDecks()
      .then((data) => {
        if (isMounted) {
          setDecksAndCache(data);
          setError("");
        }
      })
      .catch((err) => {
        if (isMounted && !hasCached) {
          setError(err.message || "Failed to load decks");
        }
      })
      .finally(() => {
        if (isMounted && !hasCached) {
          setLoading(false);
          setShowWakeHint(false);
        }
      });
    return () => {
      isMounted = false;
      clearTimeout(wakeHintTimer);
    };
  }, []);

  async function handleCreateDeck(e) {
    e.preventDefault();
    const name = newDeckName.trim();
    if (!name) return;

    setSaving(true);
    try {
      const deck = await createDeck(name);
      setDecksAndCache((prev) => [deck, ...prev]);
      setNewDeckName("");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to create deck");
    } finally {
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
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;

    setSaving(true);
    try {
      const updated = await updateDeck(editingId, name);
      setDecksAndCache((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
      cancelEditing();
      setError("");
    } catch (err) {
      setError(err.message || "Failed to update deck");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDeck(id) {
    if (!window.confirm("Delete this deck? This cannot be undone.")) {
      return;
    }
    setSaving(true);
    try {
      await deleteDeck(id);
      setDecksAndCache((prev) => prev.filter((d) => d.id !== id));
      setError("");
    } catch (err) {
      setError(err.message || "Failed to delete deck");
    } finally {
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

        {loading && (
          <>
            <p>Loading decks...</p>
            {showWakeHint && (
              <p className="subtitle">
                Waking backend service... this can take up to a minute on free
                hosting.
              </p>
            )}
          </>
        )}
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

