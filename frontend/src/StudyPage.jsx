import { useMemo, useState } from "react";

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function StudyPage({
  deck,
  cards,
  shuffleEnabled = true,
  studyMode = "practice",
  onExit,
}) {
  const isExam = studyMode === "exam";
  const doShuffle = shuffleEnabled !== false;
  const queue = useMemo(() => {
    if (!Array.isArray(cards) || cards.length === 0) return [];
    return doShuffle ? shuffle(cards) : [...cards];
  }, [cards, doShuffle]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

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

  function handleExamGrade(wasCorrect) {
    if (wasCorrect) setCorrectCount((c) => c + 1);
    else setWrongCount((w) => w + 1);
    if (index + 1 < queue.length) {
      setIndex((i) => i + 1);
      setShowAnswer(false);
    } else {
      setSessionComplete(true);
    }
  }

  if (!current && !(sessionComplete && isExam)) {
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

  if (sessionComplete && isExam) {
    const total = correctCount + wrongCount;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <section className="decks-page">
        <div className="card">
          <h2 style={{ marginTop: "0" }}>Final exam results</h2>
          <p className="subtitle">{deck.name}</p>
          <div className="exam-summary">
            <p className="exam-summary-score">{pct}% correct</p>
            <p className="exam-summary-detail">
              {correctCount} right · {wrongCount} wrong · {total} cards
            </p>
          </div>
          <div className="actions" style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              className="btn primary"
              onClick={onExit}
            >
              Back to deck
            </button>
          </div>
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
          {isExam ? (
            <>
              Final exam: after each answer, mark whether you got it right or
              wrong. You will see your score at the end.
            </>
          ) : (
            <>
              Practice mode: study freely; your answers are not scored.
            </>
          )}{" "}
          Click the card to reveal the answer.
          {doShuffle
            ? " Order is randomized for this session."
            : " Cards follow the list order."}
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

        {showAnswer && !isExam && (
          <div className="actions" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn primary" onClick={handleNext}>
              {index + 1 < queue.length ? "Next card" : "Finish session"}
            </button>
          </div>
        )}

        {showAnswer && isExam && (
          <div className="exam-grade-actions">
            <p className="exam-grade-prompt">How did you do on this card?</p>
            <div className="actions exam-grade-buttons">
              <button
                type="button"
                className="btn danger"
                onClick={() => handleExamGrade(false)}
              >
                Wrong
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => handleExamGrade(true)}
              >
                Right
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default StudyPage;
