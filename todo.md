# AI Imposter Game — TODO

## Database & Backend
- [x] Define game rooms, players, rounds, answers, pointings, votes tables in schema.ts
- [x] Run migration and apply SQL
- [x] Add DB query helpers in server/db.ts
- [x] Build tRPC procedures: createRoom, joinRoom, getGameState, submitAnswer, submitPointing, submitVote, getAIAnswer
- [x] Integrate LLM to generate AI answers via invokeLLM
- [x] Add question bank (10+ open-ended questions)
- [x] Implement game state machine: lobby → question → pointing → (repeat x3) → voting → results
- [x] Real-time polling endpoint for game state sync

## Frontend Screens
- [x] Home / Landing page with "Create Game" and "Join Game" CTAs
- [x] Lobby screen: show room code, waiting for players, fruit avatar assignment
- [x] Question screen: display question, textarea with 250-word live counter, submit button
- [x] Waiting screen: show after answer submitted, waiting for others
- [x] Pointing screen: show all 3 answers, select suspect, optional explanation, submit
- [x] Voting screen: final vote on who is the AI imposter
- [x] Results screen: dark background, reveal AI identity, show votes, win/loss outcome

## UI / Style
- [x] Fruit avatar system (pineapple, apple, turtle, grape, watermelon, cherry)
- [x] Player names displayed in ALL CAPS throughout
- [x] Word counter circle on answer input
- [x] Dark background on results screen
- [x] Responsive layout for mobile and desktop
- [x] Smooth transitions between game phases

## Testing
- [x] Vitest tests for game state transitions
- [x] Vitest tests for AI answer generation procedure
- [x] Vitest tests for vote tallying logic
