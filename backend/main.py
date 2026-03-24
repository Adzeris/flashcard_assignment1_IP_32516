from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import init_db, get_conn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DeckCreate(BaseModel):
    name: str


class CardCreate(BaseModel):
    deck_id: int
    question: str
    answer: str
    difficulty: int | None = 1


class CardUpdate(BaseModel):
    question: str
    answer: str
    difficulty: int | None = 1


def normalise_difficulty(value: int | None) -> int:
    d = value if value is not None else 1
    if d < 1:
        return 1
    if d > 5:
        return 5
    return d


@app.on_event("startup")
def startup():
    init_db()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/decks")
def list_decks():
    conn = get_conn()
    rows = conn.execute("SELECT id, name, created_at FROM decks ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/decks", status_code=201)
def create_deck(payload: DeckCreate):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Deck name is required")
    conn = get_conn()
    cur = conn.execute("INSERT INTO decks(name) VALUES (?)", (name,))
    conn.commit()
    deck_id = cur.lastrowid
    row = conn.execute("SELECT id, name, created_at FROM decks WHERE id=?", (deck_id,)).fetchone()
    conn.close()
    return dict(row)

@app.put("/api/decks/{deck_id}")
def update_deck(deck_id: int, payload: DeckCreate):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Deck name is required")

    conn = get_conn()
    cur = conn.execute("UPDATE decks SET name=? WHERE id=?", (name, deck_id))
    conn.commit()

    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Deck not found")

    row = conn.execute("SELECT id, name, created_at FROM decks WHERE id=?", (deck_id,)).fetchone()
    conn.close()
    return dict(row)


@app.delete("/api/decks/{deck_id}")
def delete_deck(deck_id: int):
    conn = get_conn()
    cur = conn.execute("DELETE FROM decks WHERE id=?", (deck_id,))
    conn.commit()

    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Deck not found")

    conn.close()
    return {"message": "Deck deleted"}


@app.get("/api/decks/{deck_id}/cards")
def list_cards(deck_id: int):
    conn = get_conn()
    rows = conn.execute(
        """
        SELECT id, deck_id, question, answer, difficulty, created_at
        FROM cards
        WHERE deck_id=?
        ORDER BY id DESC
        """,
        (deck_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/cards", status_code=201)
def create_card(payload: CardCreate):
    question = payload.question.strip()
    answer = payload.answer.strip()
    if not question or not answer:
        raise HTTPException(status_code=400, detail="Question and answer are required")

    difficulty = normalise_difficulty(payload.difficulty)

    conn = get_conn()
    # Ensure deck exists
    deck = conn.execute("SELECT id FROM decks WHERE id=?", (payload.deck_id,)).fetchone()
    if deck is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Deck not found")

    cur = conn.execute(
        """
        INSERT INTO cards(deck_id, question, answer, difficulty)
        VALUES (?, ?, ?, ?)
        """,
        (payload.deck_id, question, answer, difficulty),
    )
    conn.commit()
    card_id = cur.lastrowid
    row = conn.execute(
        """
        SELECT id, deck_id, question, answer, difficulty, created_at
        FROM cards
        WHERE id=?
        """,
        (card_id,),
    ).fetchone()
    conn.close()
    return dict(row)


@app.put("/api/cards/{card_id}")
def update_card(card_id: int, payload: CardUpdate):
    question = payload.question.strip()
    answer = payload.answer.strip()
    if not question or not answer:
        raise HTTPException(status_code=400, detail="Question and answer are required")

    difficulty = normalise_difficulty(payload.difficulty)

    conn = get_conn()
    cur = conn.execute(
        """
        UPDATE cards
        SET question=?, answer=?, difficulty=?
        WHERE id=?
        """,
        (question, answer, difficulty, card_id),
    )
    conn.commit()

    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Card not found")

    row = conn.execute(
        """
        SELECT id, deck_id, question, answer, difficulty, created_at
        FROM cards
        WHERE id=?
        """,
        (card_id,),
    ).fetchone()
    conn.close()
    return dict(row)


@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int):
    conn = get_conn()
    cur = conn.execute("DELETE FROM cards WHERE id=?", (card_id,))
    conn.commit()

    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Card not found")

    conn.close()
    return {"message": "Card deleted"}
