import { useEffect, useState } from "react";
import { fetchCards, createCard, updateCard, deleteCard } from "./api.js";

function DeckDetailPage({ deck, onBack, onStartStudy }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingAnswer, setEditingAnswer] = useState("");
  const [editingDifficulty, setEditingDifficulty] = useState(1);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchCards(deck.id)
      .then((data) => {
        if (isMounted) {
          setCards(data);
          setError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load cards");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
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
      setCards((prev) => [card, ...prev]);
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
      setCards((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
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
      setCards((prev) => prev.filter((c) => c.id !== id));
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

        <div className="deck-header-row">
          <h3 style={{ marginBottom: "0.25rem" }}>Cards</h3>
          {cards.length > 0 && (
            <button
              type="button"
              className="btn primary small"
              onClick={() => onStartStudy(cards)}
            >
              Start study ({cards.length})
            </button>
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

