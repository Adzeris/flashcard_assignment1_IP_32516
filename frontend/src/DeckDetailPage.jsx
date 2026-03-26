import { useEffect, useState } from "react";
import { fetchCards, createCard, updateCard, deleteCard } from "./api.js";

function loadCached(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

function DeckDetailPage({ deck, onBack, onStartStudy }) {
  const cacheKey = "cards_" + deck.id;
  const [cards, setCards] = useState(() => loadCached(cacheKey));
  const [loading, setLoading] = useState(() => loadCached(cacheKey).length === 0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingAnswer, setEditingAnswer] = useState("");
  const [editingDifficulty, setEditingDifficulty] = useState(1);
  const [shuffleStudy, setShuffleStudy] = useState(true);
  const [studyMode, setStudyMode] = useState("practice");

  function saveCards(list) {
    setCards(list);
    try { localStorage.setItem(cacheKey, JSON.stringify(list)); } catch {}
  }

  useEffect(() => {
    let alive = true;
    const key = "cards_" + deck.id;
    const hadCache = loadCached(key).length > 0;

    fetchCards(deck.id)
      .then((data) => {
        if (!alive) return;
        setCards(data);
        try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
        setError("");
      })
      .catch((err) => {
        if (alive && !hadCache)
          setError(err.message || "Failed to load cards");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => { alive = false; };
  }, [deck.id]);

  async function handleCreateCard(e) {
    e.preventDefault();
    const q = question.trim();
    const a = answer.trim();
    if (!q || !a) return;
    setSaving(true);
    try {
      const card = await createCard(deck.id, {
        question: q,
        answer: a,
        difficulty: Number(difficulty) || 1,
      });
      saveCards([card, ...cards]);
      setQuestion("");
      setAnswer("");
      setDifficulty(1);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to create card");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(card) {
    setEditingId(card.id);
    setEditingQuestion(card.question);
    setEditingAnswer(card.answer);
    setEditingDifficulty(card.difficulty || 1);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingQuestion("");
    setEditingAnswer("");
    setEditingDifficulty(1);
  }

  async function handleUpdateCard(e) {
    e.preventDefault();
    if (!editingId) return;
    const q = editingQuestion.trim();
    const a = editingAnswer.trim();
    if (!q || !a) return;
    setSaving(true);
    try {
      const updated = await updateCard(editingId, {
        question: q,
        answer: a,
        difficulty: Number(editingDifficulty) || 1,
      });
      saveCards(cards.map((c) => (c.id === updated.id ? updated : c)));
      cancelEditing();
      setError("");
    } catch (err) {
      setError(err.message || "Failed to update card");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCard(id) {
    if (!window.confirm("Delete this card?")) return;
    setSaving(true);
    try {
      await deleteCard(id);
      saveCards(cards.filter((c) => c.id !== id));
      setError("");
    } catch (err) {
      setError(err.message || "Failed to delete card");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="decks-page">
      <div className="card">
        <button type="button" className="btn secondary small" onClick={onBack}>
          ← Back to decks
        </button>

        <h2 style={{ marginTop: "0.75rem" }}>{deck.name}</h2>
        <p className="subtitle">
          Manage cards in this deck. Then start a study session.
        </p>

        <form
          className="deck-form"
          onSubmit={editingId ? handleUpdateCard : handleCreateCard}
        >
          <label className="field">
            <span>{editingId ? "Edit question" : "New card question"}</span>
            <textarea
              value={editingId ? editingQuestion : question}
              onChange={(e) =>
                editingId
                  ? setEditingQuestion(e.target.value)
                  : setQuestion(e.target.value)
              }
              rows={2}
              disabled={saving}
            />
          </label>
          <label className="field">
            <span>{editingId ? "Edit answer" : "New card answer"}</span>
            <textarea
              value={editingId ? editingAnswer : answer}
              onChange={(e) =>
                editingId
                  ? setEditingAnswer(e.target.value)
                  : setAnswer(e.target.value)
              }
              rows={2}
              disabled={saving}
            />
          </label>
          <label className="field">
            <span>Difficulty (1-5, optional)</span>
            <input
              type="number"
              min="1"
              max="5"
              value={editingId ? editingDifficulty : difficulty}
              onChange={(e) =>
                editingId
                  ? setEditingDifficulty(e.target.value)
                  : setDifficulty(e.target.value)
              }
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
              {editingId ? "Save card" : "Add card"}
            </button>
          </div>
        </form>

        {loading && <p>Loading cards...</p>}
        {error && !loading && <p className="error">{error}</p>}

        {!loading && cards.length === 0 && (
          <p className="empty">
            No cards yet. Add some questions and answers above.
          </p>
        )}

        <div className="study-header-grid">
          <h3 className="cards-section-title">Cards</h3>
          {cards.length > 0 && (
            <div className="study-options-block">
              <div className="study-controls-row">
                <div
                  className={`study-mode-group${saving ? " is-disabled" : ""}`}
                  role="group"
                  aria-label="Study mode"
                >
                  <span className="study-mode-heading">Mode</span>
                  <label className="study-mode-option">
                    <input
                      type="radio"
                      name={`study-mode-${deck.id}`}
                      checked={studyMode === "practice"}
                      onChange={() => setStudyMode("practice")}
                      disabled={saving}
                    />
                    <span>Practice</span>
                  </label>
                  <label className="study-mode-option">
                    <input
                      type="radio"
                      name={`study-mode-${deck.id}`}
                      checked={studyMode === "exam"}
                      onChange={() => setStudyMode("exam")}
                      disabled={saving}
                    />
                    <span>Final exam</span>
                  </label>
                </div>
                <div
                  className={`shuffle-option${saving ? " is-disabled" : ""}`}
                >
                  <label
                    className="shuffle-option-text"
                    htmlFor={`shuffle-deck-${deck.id}`}
                  >
                    Shuffle order
                  </label>
                  <input
                    id={`shuffle-deck-${deck.id}`}
                    type="checkbox"
                    checked={shuffleStudy}
                    onChange={(e) => setShuffleStudy(e.target.checked)}
                    disabled={saving}
                  />
                </div>
                <button
                  type="button"
                  className="btn primary btn-study-start"
                  onClick={() => onStartStudy(cards, shuffleStudy, studyMode)}
                >
                  Start study ({cards.length})
                </button>
              </div>
            </div>
          )}
        </div>

        <ul className="card-list">
          {cards.map((card) => (
            <li key={card.id} className="card-item">
              <div className="card-main">
                <div className="card-question">{card.question}</div>
                <div className="card-answer-preview">
                  Answer: {card.answer}
                </div>
                <div className="card-meta">
                  Difficulty: {card.difficulty || 1}
                </div>
              </div>
              <div className="deck-actions">
                <button
                  type="button"
                  className="btn small"
                  onClick={() => startEditing(card)}
                  disabled={saving}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn small danger"
                  onClick={() => handleDeleteCard(card.id)}
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

export default DeckDetailPage;
