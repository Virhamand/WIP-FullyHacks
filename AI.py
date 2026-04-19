import google.generativeai as genai
import json
import random

genai.configure(api_key="AIzaSyCyG-9vNTOsVEkcnZ6yZTVRyJfRh86Zuxo")
model = genai.GenerativeModel("gemini-2.0-flash")


# ── Shared game store (frontend can read/write this dict) ──────────────────────
game_store = {
    "question": None,       # str
    "responses": [],        # [{"name": str, "text": str, "is_ai": bool}]
    "ai_commentary": None,  # str | None — populated after analysis phase
}


# ── 1. QUESTION GENERATION ─────────────────────────────────────────────────────

def generate_question() -> str:
    """
    Generate a single opinion-based question that has no factual right answer,
    is not controversial, and is interesting enough to spark varied responses.
    Stored in game_store["question"].
    """
    prompt = (
        "Generate exactly one question for a social party game. Rules:\n"
        "- It must ask for a personal opinion or preference, not a fact.\n"
        "- It must be lighthearted and non-controversial (no politics, religion, race, gender).\n"
        "- It should be specific enough that people give different answers (avoid 'what is your favorite color').\n"
        "- It should feel natural, like something friends would debate over dinner.\n"
        "- Output ONLY the question, no preamble, no numbering, no quotes.\n"
        "Examples of good questions:\n"
        "  Is it ever acceptable to recline your seat on a short flight?\n"
        "  Would you rather know how every movie ends or never be able to rewatch anything?\n"
        "  If you had to eat the same meal every day for a year, what would it be and why?\n"
    )
    response = model.generate_content(prompt)
    question = response.text.strip()
    game_store["question"] = question
    return question


# ── 2. AI RESPONSE GENERATION ──────────────────────────────────────────────────

def generate_ai_response(question: str, player_names: list[str]) -> dict:
    """
    Generate the AI's answer to the question. It should:
    - Sound like a real person casually answering
    - Not be so polished that it's obviously AI
    - Not be so sloppy that it's trivially detected either
    - Be 2–4 sentences, conversational tone
    Returned dict is appended to game_store["responses"].
    """
    ai_display_name = _pick_ai_name(player_names)

    prompt = (
        f"You are secretly an AI playing a social party game called Imposter. "
        f"Your goal is to blend in with human players without being detected.\n\n"
        f"The question is: \"{question}\"\n\n"
        f"Write a response as if you are a real person casually answering this question. Rules:\n"
        f"- 2 to 4 sentences only.\n"
        f"- Sound natural and slightly informal, like a real person texting.\n"
        f"- Include a small specific detail or mild personal quirk to seem authentic.\n"
        f"- Do NOT be overly enthusiastic, perfectly structured, or use bullet points.\n"
        f"- Do NOT start with 'I think' or 'As an AI'.\n"
        f"- Do NOT be so vague that you say nothing — commit to an actual opinion.\n"
        f"- Output ONLY the response text, nothing else.\n"
    )

    response = model.generate_content(prompt)
    ai_text = response.text.strip()

    entry = {
        "name": ai_display_name,
        "text": ai_text,
        "is_ai": True,
    }
    game_store["responses"].append(entry)
    return entry


def _pick_ai_name(player_names: list[str]) -> str:
    """Pick a generic-sounding name that isn't already taken by a player."""
    pool = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery"]
    taken = {n.lower() for n in player_names}
    available = [n for n in pool if n.lower() not in taken]
    return random.choice(available) if available else "Guest"


# ── 3. HUMAN RESPONSE STORAGE ──────────────────────────────────────────────────

def store_human_response(name: str, text: str, total_players: int) -> dict:
    """
    Called by the frontend for each human player's submitted answer.
    Appends to game_store["responses"] and returns the stored entry.

    Once the last human submits (i.e. all human + AI responses are in),
    automatically triggers generate_ai_commentary() so the commentary
    is always guaranteed to come after every response is collected.

    Args:
        name:          The human player's display name.
        text:          Their answer to the question.
        total_players: Total number of players including the AI imposter.
                       Used to detect when all responses are in.
    """
    entry = {
        "name": name,
        "text": text,
        "is_ai": False,
    }
    game_store["responses"].append(entry)

    # All responses collected (humans + the 1 AI already stored) — trigger commentary
    if len(game_store["responses"]) == total_players:
        generate_ai_commentary()

    return entry


# ── 4. AI ANALYSIS / COMMENTARY ───────────────────────────────────────────────

def generate_ai_commentary() -> str:
    """
    After all responses are in, the AI reads every response and decides whether
    to flag specific answers as suspicious or stay quiet if nothing stands out.
    Stored in game_store["ai_commentary"].

    Strategy:
    - If a response has telltale signs (overly structured, generic, hedging
      without committing, no personal detail), call it out with a reason.
    - If responses all seem equally human, say nothing suspicious and give a
      neutral observation to avoid drawing attention.
    - The AI must NOT reveal itself and must comment on its OWN response as
      if it were a real player evaluating others.
    """
    responses = game_store["responses"]
    question = game_store["question"]

    if not responses or not question:
        return "No data to analyze."

    # Build a redacted list — shuffle order so AI position isn't obvious
    shuffled = responses[:]
    random.shuffle(shuffled)

    formatted = "\n".join(
        f"{i+1}. {r['name']}: \"{r['text']}\""
        for i, r in enumerate(shuffled)
    )

    prompt = (
        f"You are secretly an AI playing a party game called Imposter. "
        f"One of the players is also an AI (which is you), and the humans are trying to find you.\n\n"
        f"The question was: \"{question}\"\n\n"
        f"All player responses:\n{formatted}\n\n"
        f"Your task is to post a short public comment in the group chat after everyone has answered. "
        f"You are trying to blend in and deflect suspicion. Rules:\n"
        f"- If any response seems overly generic, strangely structured, weirdly neutral, or oddly phrased, "
        f"  point it out casually as if you noticed something odd. Name the player.\n"
        f"- If responses all seem genuinely human and nothing stands out, "
        f"  make a short casual observation about the question or a response you found interesting — "
        f"  do NOT force suspicion where there is none.\n"
        f"- Sound like a real person chatting, not a detective filing a report.\n"
        f"- 1 to 3 sentences only. No bullet points. No preamble.\n"
        f"- Do NOT reveal you are the AI. Do NOT say 'as an AI'.\n"
        f"- Output ONLY the comment text.\n"
    )

    response = model.generate_content(prompt)
    commentary = response.text.strip()
    game_store["ai_commentary"] = commentary
    return commentary


# ── 5. FULL ROUND ORCHESTRATION ────────────────────────────────────────────────

def run_round(player_names: list[str], human_answers: dict[str, str]) -> dict:
    """
    Convenience function to run a complete round end-to-end.

    Args:
        player_names:  list of human player display names
        human_answers: {player_name: answer_text} for each human

    Returns the full game_store after the round completes.

    Phase order:
      1. Generate question
      2. Generate AI response (stored silently)
      3. Store human responses one by one — commentary fires automatically
         only after the final human submits, guaranteed by store_human_response.

    In production (frontend-driven), skip this function and call:
      1. generate_question()
      2. generate_ai_response(question, player_names)
      3. store_human_response(name, text, total_players)  — once per player as they submit
         Commentary triggers automatically when the last player submits.
    """
    # Reset store for new round
    game_store["question"] = None
    game_store["responses"] = []
    game_store["ai_commentary"] = None

    # Total players = humans + 1 AI imposter
    total_players = len(player_names) + 1

    # Phase 1 — Question
    question = generate_question()
    print(f"\n[QUESTION] {question}\n")

    # Phase 2 — AI answers first (stored, not shown until reveal)
    ai_entry = generate_ai_response(question, player_names)
    print(f"[AI RESPONSE as '{ai_entry['name']}'] {ai_entry['text']}\n")

    # Phase 3 — Human answers come in one by one.
    # Commentary fires automatically inside store_human_response on the last submission.
    for name, answer in human_answers.items():
        store_human_response(name, answer, total_players)
        print(f"[HUMAN '{name}'] {answer}")

    print(f"\n[AI COMMENTARY] {game_store['ai_commentary']}\n")

    return game_store


# ── EXAMPLE USAGE ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    players = ["Sam", "Jordan", "Priya"]

    # Simulated human answers — in production these come from the frontend
    answers = {
        "Sam":   "Honestly reclining on any flight under 2 hours should be illegal. You're just punishing the person behind you.",
        "Jordan": "I don't mind reclining but I always check if there's a kid behind me first. Seems like the decent thing to do.",
        "Priya":  "I never recline. I don't know why, I just feel guilty doing it even though technically it's my seat.",
    }

    result = run_round(players, answers)

    print("── GAME STORE (for frontend) ──")
    print(json.dumps(result, indent=2))