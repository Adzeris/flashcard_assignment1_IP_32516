import { useState } from "react";

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function StudyPage({ deck, cards, onExit }) {
  const [queue] = useState(() => shuffle(cards));
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const current = queue[index] || null;
  const difficulty = current
    ? Math.min(5, Math.max(1, Number(current.difficulty) || 1))
    : 1;

  function handleReveal() {
    setShowAnswer(true);
  }

  function handleNext() {
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      setShowAnswer(false);
    } else {
      onExit();
    }
  }

  if (!current) {
    return (
      <section className="decks-page">
        <div className="card">
          <button
            type="button"
            className="btn secondary small"
            onClick={onExit}
          >
            ← Back to deck
          </button>
          <h2 style={{ marginTop: "0.75rem" }}>Study session</h2>
          <p className="empty">No cards available to study.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="decks-page">
      <div className="card">
        <button
          type="button"
          className="btn secondary small"
          onClick={onExit}
        >
          ← Back to deck
        </button>

        <h2 style={{ marginTop: "0.75rem" }}>Study: {deck.name}</h2>
        <p className="subtitle">
          Click the card to reveal the answer. After viewing, move to the next
          card. Cards disappear from this session once used.
        </p>

        <div className="study-info">
          <span>
            Card {index + 1} of {queue.length}
          </span>
          <span className="study-difficulty" title="How hard you rated this card (1 easy, 5 hard)">
            Difficulty {difficulty}/5
          </span>
        </div>

        <button
          type="button"
          className="flashcard"
          onClick={showAnswer ? undefined : handleReveal}
        >
          {!showAnswer ? (
            <>
              <div className="flashcard-label">Question</div>
              <div className="flashcard-text">{current.question}</div>
              <div className="flashcard-hint">(Click to show answer)</div>
            </>
          ) : (
            <>
              <div className="flashcard-label">Answer</div>
              <div className="flashcard-text">{current.answer}</div>
            </>
          )}
        </button>

        {showAnswer && (
          <div className="actions" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn primary"
              onClick={handleNext}
            >
              {index + 1 < queue.length ? "Next card" : "Finish session"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default StudyPage;

