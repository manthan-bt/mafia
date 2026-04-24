import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientGameState, NightAction, Phase, PublicPlayer, Role } from "../shared/types";

type Ack = { ok: boolean; error?: string; roomCode?: string; playerId?: string };

const PLAYER_ID_KEY = "mafia.playerId";

function getPlayerId() {
  const existing = sessionStorage.getItem(PLAYER_ID_KEY);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  sessionStorage.setItem(PLAYER_ID_KEY, created);
  return created;
}

const socket: Socket = io();

const phaseCopy: Record<Phase, string> = {
  lobby: "Lobby",
  roleReveal: "Role Reveal",
  night: "Night",
  nightResolution: "Dawn Report",
  dayDiscussion: "Day Discussion",
  voting: "Voting",
  elimination: "Elimination",
  gameOver: "Game Over"
};

const roleCopy: Record<Role, string> = {
  mafia: "Mafia",
  villager: "Villager",
  detective: "Detective",
  doctor: "Doctor"
};

export function App() {
  const [playerId] = useState(getPlayerId);
  const [game, setGame] = useState<ClientGameState | undefined>();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(30);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    socket.on("game:state", setGame);
    return () => {
      socket.off("game:state", setGame);
    };
  }, []);

  const self = game?.players.find((player) => player.id === playerId);
  const livingPlayers = game?.players.filter((player) => player.alive) ?? [];
  const deadPlayers = game?.players.filter((player) => !player.alive) ?? [];
  const isHost = Boolean(self?.isHost);

  function emitWithAck(event: string, payload: unknown) {
    setPending(true);
    setError("");
    socket.emit(event, payload, (ack: Ack) => {
      setPending(false);
      if (!ack?.ok) {
        setError(ack?.error ?? "Something went wrong.");
      }
    });
  }

  function createRoom() {
    emitWithAck("room:create", { playerId, name, maxPlayers });
  }

  function joinRoom() {
    emitWithAck("room:join", { playerId, name, roomCode });
  }

  if (!game) {
    return (
      <main className="entry-shell">
        <section className="entry-hero">
          <div className="brand-mark">M</div>
          <p className="eyebrow">Realtime social deduction</p>
          <h1>Mafia Night</h1>
          <p className="intro">
            Create a private room, deal secret roles, run night actions, vote in daylight,
            and let the server keep every hidden move honest.
          </p>
        </section>

        <section className="entry-panel" aria-label="Create or join a Mafia room">
          <label>
            Display name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Vera" />
          </label>

          <div className="split-controls">
            <label>
              Max players
              <input
                min={5}
                max={30}
                type="number"
                value={maxPlayers}
                onChange={(event) => setMaxPlayers(Number(event.target.value))}
              />
            </label>
            <button disabled={pending || !name.trim()} onClick={createRoom}>
              Create Room
            </button>
          </div>

          <div className="join-row">
            <label>
              Room code
              <input
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="A7KQ2"
              />
            </label>
            <button disabled={pending || !name.trim() || !roomCode.trim()} onClick={joinRoom}>
              Join
            </button>
          </div>

          {error && <p className="error">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Room {game.code}</p>
          <h1>{phaseCopy[game.phase]}</h1>
        </div>
        <PhaseStatus game={game} />
      </header>

      {error && <p className="error floating-error">{error}</p>}

      <section className="command-strip">
        <RolePanel game={game} self={self} />
        <HostControls game={game} isHost={isHost} pending={pending} emitWithAck={emitWithAck} />
      </section>

      <section className="board-grid">
        <PlayerColumn
          title={`Alive (${livingPlayers.length})`}
          players={livingPlayers}
          game={game}
          selfId={playerId}
          emitWithAck={emitWithAck}
        />
        <ActionPanel game={game} self={self} emitWithAck={emitWithAck} />
        <EventLog game={game} deadPlayers={deadPlayers} />
      </section>
    </main>
  );
}

function PhaseStatus({ game }: { game: ClientGameState }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsLeft = game.phaseEndsAt ? Math.max(0, Math.ceil((game.phaseEndsAt - now) / 1000)) : undefined;

  return (
    <div className="phase-status">
      <span>Day {game.dayNumber}</span>
      <span>Night {game.nightNumber}</span>
      {secondsLeft !== undefined && <strong>{secondsLeft}s</strong>}
    </div>
  );
}

function RolePanel({ game, self }: { game: ClientGameState; self?: PublicPlayer }) {
  const role = game.self?.role;
  const alive = self?.alive ?? false;
  const mafiaNames = game.self?.mafiaTeam.map((player) => player.name).join(", ");

  return (
    <article className={`role-panel ${role ?? "unknown"}`}>
      <p className="eyebrow">Private card</p>
      <h2>{role ? roleCopy[role] : "Awaiting role"}</h2>
      <p>
        {game.phase === "lobby"
          ? "Ready up, then wait for the host to deal roles."
          : alive
            ? roleDescription(role)
            : "You are eliminated. Watch the table, but your actions are locked."}
      </p>
      {mafiaNames && <p className="intel">Mafia team: {mafiaNames}</p>}
    </article>
  );
}

function roleDescription(role?: Role) {
  if (role === "mafia") return "Choose one target with the Mafia during night.";
  if (role === "detective") return "Investigate one living player each night.";
  if (role === "doctor") return "Protect one living player each night.";
  if (role === "villager") return "Read the room and vote out the Mafia.";
  return "Roles are hidden until the game starts.";
}

function HostControls({
  game,
  isHost,
  pending,
  emitWithAck
}: {
  game: ClientGameState;
  isHost: boolean;
  pending: boolean;
  emitWithAck: (event: string, payload: unknown) => void;
}) {
  const canStart =
    game.phase === "lobby" &&
    game.players.length >= game.settings.minPlayers &&
    game.players.every((player) => player.isReady);

  const advanceLabel = useMemo(() => {
    if (game.phase === "roleReveal" || game.phase === "elimination") return "Begin Night";
    if (game.phase === "night") return "Resolve Night";
    if (game.phase === "nightResolution") return "Begin Discussion";
    if (game.phase === "dayDiscussion") return "Open Voting";
    if (game.phase === "voting") return "Resolve Vote";
    return "";
  }, [game.phase]);

  return (
    <article className="host-panel">
      <p className="eyebrow">Table control</p>
      {game.phase === "lobby" ? (
        <>
          <p>
            {game.players.length}/{game.settings.maxPlayers} seated. Minimum {game.settings.minPlayers} required.
          </p>
          {isHost ? (
            <button disabled={pending || !canStart} onClick={() => emitWithAck("game:start", {})}>
              Deal Roles
            </button>
          ) : (
            <button onClick={() => emitWithAck("player:ready", { ready: true })}>Ready</button>
          )}
        </>
      ) : (
        <>
          <p>{isHost ? "You control phase advancement." : "Waiting for host to advance the table."}</p>
          {isHost && advanceLabel && (
            <button disabled={pending} onClick={() => emitWithAck("game:advance", {})}>
              {advanceLabel}
            </button>
          )}
        </>
      )}
    </article>
  );
}

function PlayerColumn({
  title,
  players,
  game,
  selfId,
  emitWithAck
}: {
  title: string;
  players: PublicPlayer[];
  game: ClientGameState;
  selfId: string;
  emitWithAck: (event: string, payload: unknown) => void;
}) {
  return (
    <section className="panel player-column">
      <div className="panel-heading">
        <h2>{title}</h2>
        <span>{game.players.length} total</span>
      </div>
      <div className="player-list">
        {players.map((player) => (
          <PlayerRow key={player.id} player={player} game={game} selfId={selfId} emitWithAck={emitWithAck} />
        ))}
      </div>
    </section>
  );
}

function PlayerRow({
  player,
  game,
  selfId,
  emitWithAck
}: {
  player: PublicPlayer;
  game: ClientGameState;
  selfId: string;
  emitWithAck: (event: string, payload: unknown) => void;
}) {
  const voteCount = Object.values(game.votes).filter((targetId) => targetId === player.id).length;
  const canVote = game.phase === "voting" && game.players.find((candidate) => candidate.id === selfId)?.alive;

  return (
    <article className={`player-row ${player.id === selfId ? "self" : ""}`}>
      <div>
        <strong>{player.name}</strong>
        <span>
          {player.isHost ? "Host" : player.isReady ? "Ready" : "Not ready"} · {player.isConnected ? "Online" : "Away"}
        </span>
      </div>
      <div className="row-actions">
        {player.role && <small>{roleCopy[player.role]}</small>}
        {voteCount > 0 && <small>{voteCount} vote{voteCount > 1 ? "s" : ""}</small>}
        {canVote && player.id !== selfId && (
          <button onClick={() => emitWithAck("vote:submit", { targetId: player.id })}>Vote</button>
        )}
      </div>
    </article>
  );
}

function ActionPanel({
  game,
  self,
  emitWithAck
}: {
  game: ClientGameState;
  self?: PublicPlayer;
  emitWithAck: (event: string, payload: unknown) => void;
}) {
  const [targetId, setTargetId] = useState("");
  const role = game.self?.role;
  const livingTargets = game.players.filter((player) => player.alive && player.id !== self?.id);
  const alive = self?.alive ?? false;

  useEffect(() => {
    setTargetId("");
  }, [game.phase, role]);

  const actionType = role === "mafia" ? "mafiaKill" : role === "detective" ? "investigate" : role === "doctor" ? "protect" : undefined;
  const canAct = game.phase === "night" && alive && actionType;

  function submitAction() {
    if (!targetId || !actionType) return;
    const payload: Omit<NightAction, "actorId"> = { type: actionType, targetId };
    emitWithAck("night:action", payload);
  }

  return (
    <section className="panel action-panel">
      <div className="panel-heading">
        <h2>Actions</h2>
        <span>{canAct ? "Private" : "Locked"}</span>
      </div>

      {game.winner ? (
        <div className="winner">
          <p>{game.winner === "town" ? "Town wins" : "Mafia wins"}</p>
        </div>
      ) : canAct ? (
        <>
          <label>
            Target
            <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
              <option value="">Choose a living player</option>
              {livingTargets.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <button disabled={!targetId} onClick={submitAction}>
            Submit {actionTypeLabel(actionType)}
          </button>
        </>
      ) : (
        <p className="muted">Your available action appears here when the phase and role allow it.</p>
      )}

      {game.self?.investigationResults.map((result) => {
        const target = game.players.find((player) => player.id === result.targetId);
        return (
          <p className="intel" key={`${result.night}-${result.targetId}`}>
            Night {result.night}: {target?.name ?? "Target"} is {result.result}.
          </p>
        );
      })}
    </section>
  );
}

function actionTypeLabel(actionType: "mafiaKill" | "investigate" | "protect") {
  if (actionType === "mafiaKill") return "Kill";
  if (actionType === "investigate") return "Investigation";
  return "Protection";
}

function EventLog({ game, deadPlayers }: { game: ClientGameState; deadPlayers: PublicPlayer[] }) {
  return (
    <section className="panel log-panel">
      <div className="panel-heading">
        <h2>Chronicle</h2>
        <span>{deadPlayers.length} dead</span>
      </div>
      <ol>
        {game.events.slice(-10).reverse().map((event) => (
          <li key={event.id}>{event.message}</li>
        ))}
      </ol>
      {deadPlayers.length > 0 && (
        <div className="graveyard">
          <p className="eyebrow">Graveyard</p>
          {deadPlayers.map((player) => (
            <span key={player.id}>{player.name}</span>
          ))}
        </div>
      )}
    </section>
  );
}
