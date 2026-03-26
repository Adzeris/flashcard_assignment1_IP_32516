import { useState } from "react";
import DecksPage from "./DecksPage.jsx";
import DeckDetailPage from "./DeckDetailPage.jsx";
import StudyPage from "./StudyPage.jsx";

function App() {
  const [view, setView] = useState("decks");
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [studyCards, setStudyCards] = useState([]);
  const [studyShuffle, setStudyShuffle] = useState(true);
  const [studySessionKey, setStudySessionKey] = useState(0);
  const [studyMode, setStudyMode] = useState("practice");

  function handleOpenDeck(deck) {
    setSelectedDeck(deck);
    setView("deckDetail");
  }

  function handleBackToDecks() {
    setSelectedDeck(null);
    setView("decks");
  }

  function handleStartStudy(cards, shuffle, mode) {
    setStudyCards(cards);
    setStudyShuffle(shuffle !== false);
    setStudyMode(mode === "exam" ? "exam" : "practice");
    setStudySessionKey((k) => k + 1);
    setView("study");
  }

  function handleExitStudy() {
    setView("deckDetail");
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Flashcard Learning App</h1>
        <p>
          Create decks and flashcards, then study them in a single-page app.
        </p>
      </header>
      <main>
        {view === "decks" && <DecksPage onOpenDeck={handleOpenDeck} />}
        {view === "deckDetail" && selectedDeck && (
          <DeckDetailPage
            deck={selectedDeck}
            onBack={handleBackToDecks}
            onStartStudy={handleStartStudy}
          />
        )}
        {view === "study" && selectedDeck && (
          <StudyPage
            key={studySessionKey}
            deck={selectedDeck}
            cards={studyCards}
            shuffleEnabled={studyShuffle}
            studyMode={studyMode}
            onExit={handleExitStudy}
          />
        )}
      </main>
    </div>
  );
}

export default App;
