# Mafia Social Deduction

A realtime multiplayer Mafia website with a DOM-first game UI, Socket.IO transport, and a standalone TypeScript rules engine.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Validate

```bash
npm test
npm run build
```

## Structure

- `src/shared`: pure Mafia rules, role balancing, public/private state shaping
- `src/server`: authoritative room store and Socket.IO event validation
- `src/client`: React UI, lobby flow, phase controls, role actions, voting
- `tests`: role, rules, and full-flow smoke coverage

## Playtest Notes

1. Create a room from the first screen.
2. Join from other browser tabs with the displayed room code.
3. Mark players ready and start with at least five players.
4. Confirm each player only sees their own role and legal private action.
5. Use the role reveal card to confirm the private role before night starts.
6. Send table chat; in bot-enabled rooms, bots reply after a short human-like delay.
7. Try bot difficulty from Easy to Impossible; higher levels use public table signals better without seeing hidden Town roles.
8. Submit night actions as Mafia, Detective, Doctor, Roleblocker, Vigilante, or Serial Killer.
9. Use the Vote Board to track vote counts and majority threshold.
10. Advance through day discussion, voting, elimination, and game over.
11. Resize to phone width and confirm phase, timer, player state, chat, voting, actions, and ads remain readable.
