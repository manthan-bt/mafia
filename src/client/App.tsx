import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { BotDifficulty, ClientGameState, NightAction, Phase, PublicPlayer, Role } from "../shared/types";

type Ack = { ok: boolean; error?: string; roomCode?: string; playerId?: string };

const PLAYER_ID_KEY = "mafia.playerId";

function getPlayerId() {
  const existing = sessionStorage.getItem(PLAYER_ID_KEY);
  if (existing) {
    return existing;
  }
  const created = typeof crypto.randomUUID === "function" 
    ? crypto.randomUUID() 
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
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
  godfather: "Godfather",
  roleblocker: "Roleblocker",
  villager: "Villager",
  detective: "Detective",
  doctor: "Doctor",
  vigilante: "Vigilante",
  mayor: "Mayor",
  jester: "Jester",
  serialKiller: "Serial Killer"
};

export function App() {
  const [playerId] = useState(getPlayerId);
  const [game, setGame] = useState<ClientGameState | undefined>();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(30);
  const [botsEnabled, setBotsEnabled] = useState(false);
  const [botOnly, setBotOnly] = useState(false);
  const [classicRolesEnabled, setClassicRolesEnabled] = useState(true);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("normal");
  const [roleCardOpen, setRoleCardOpen] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"home" | "create" | "browse" | "join">("home");
  const [publicRooms, setPublicRooms] = useState<any[]>([]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("room");
    if (code) setRoomCode(code.toUpperCase());
    socket.on("game:state", (state) => {
      setGame(state);
    });
    socket.on("room:left", () => setGame(undefined));
    return () => {
      socket.off("game:state");
      socket.off("room:left");
    };
  }, []);

  useEffect(() => {
    if (game?.phase === "roleReveal") {
      setRoleCardOpen(true);
    }
  }, [game?.id, game?.phase]);

  const self = game?.players?.find((player) => player.id === playerId);
  const livingPlayers = game?.players?.filter((player) => player.alive) ?? [];
  const deadPlayers = game?.players?.filter((player) => !player.alive) ?? [];
  const isHost = Boolean(self?.isHost);

  function emitWithAck(event: string, payload: any) {
    setPending(true);
    setError("");
    const data = { ...payload, roomCode: game?.code, playerId };
    socket.emit(event, data, (ack: Ack) => {
      console.log(`Received ack for ${event}:`, ack);
      setPending(false);
      if (!ack?.ok) {
        setError(ack?.error ?? "Something went wrong.");
      }
    });
  }

  function createRoom() {
    console.log("Attempting to create room with:", { name, maxPlayers, botsEnabled, botOnly });
    emitWithAck("room:create", { playerId, name, maxPlayers, botsEnabled, botOnly, classicRolesEnabled, botDifficulty });
  }

  function joinRoom(code?: string) {
    const finalCode = code ?? roomCode;
    if (!finalCode) return;
    emitWithAck("room:join", { playerId, name, roomCode: finalCode });
  }

  function fetchRooms() {
    setPending(true);
    socket.emit("lobby:list", {}, (ack: any) => {
      setPending(false);
      if (ack.ok) {
        setPublicRooms(ack.rooms);
      }
    });
  }

  useEffect(() => {
    if (mode === "browse") {
      fetchRooms();
      const interval = setInterval(fetchRooms, 10000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  if (!game) {
    return (
      <main className="entry-shell">
        <AdSlot placement="left" label="Ad space" />
        <section className="entry-hero">
          <div className="brand-mark" onClick={() => setMode("home")} style={{ cursor: "pointer" }}>M</div>
          <p className="eyebrow">Realtime social deduction</p>
          <h1>Mafia Night</h1>
          <nav className="entry-nav">
             <button className={mode === "home" ? "active" : ""} onClick={() => setMode("home")}>Home</button>
             <button className={mode === "browse" ? "active" : ""} onClick={() => setMode("browse")}>Browse</button>
             <button className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>Create</button>
             <button className={mode === "join" ? "active" : ""} onClick={() => setMode("join")}>Join</button>
          </nav>
        </section>

        <section className="entry-content">
          {mode === "home" && (
            <div className="home-view">
               <p className="intro">
                Create a private room, deal secret roles, run night actions, vote in daylight,
                and let the server keep every hidden move honest.
              </p>
              <div className="home-showcase" aria-hidden="true">
                <div className="mini-card red">Mafia</div>
                <div className="mini-card blue">Detective</div>
                <div className="mini-card gold">Jester</div>
              </div>
              <button className="cta-button" onClick={() => setMode("create")}>Start a Game</button>
            </div>
          )}

          {mode === "browse" && (
            <div className="entry-panel">
               <div className="panel-heading">
                <h2>Active Tables</h2>
                <span>{publicRooms.length} rooms</span>
              </div>
              <div className="room-list">
                {publicRooms.length === 0 ? (
                  <p className="muted">No active rooms found. Be the first to create one!</p>
                ) : (
                  publicRooms.map((room) => (
                    <div key={room.code} className="room-item">
                      <div>
                        <strong>Room {room.code}</strong>
                        <span>{room.playerCount}/{room.maxPlayers} players • {room.phase}</span>
                      </div>
                      <button disabled={!name.trim() || room.playerCount >= room.maxPlayers} onClick={() => joinRoom(room.code)}>
                        Join
                      </button>
                    </div>
                  ))
                )}
              </div>
              {!name.trim() && <p className="warning">Enter a display name below to join.</p>}
              <label>
                Display name
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Vera" />
              </label>
            </div>
          )}

          {mode === "create" && (
            <section className="entry-panel" aria-label="Create a Mafia room">
              <div className="panel-heading">
                <h2>Host a Table</h2>
                <span>5-30 players</span>
              </div>
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

              <div className="toggle-grid">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={classicRolesEnabled}
                    onChange={(event) => setClassicRolesEnabled(event.target.checked)}
                  />
                  Classic roles
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={botsEnabled}
                    onChange={(event) => {
                      setBotsEnabled(event.target.checked);
                      if (!event.target.checked) setBotOnly(false);
                    }}
                  />
                  Allow bots
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={botOnly}
                    onChange={(event) => {
                      setBotOnly(event.target.checked);
                      if (event.target.checked) setBotsEnabled(true);
                    }}
                  />
                  Bot practice room
                </label>
              </div>

              <label>
                Bot difficulty
                <select value={botDifficulty} onChange={(event) => setBotDifficulty(event.target.value as BotDifficulty)}>
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                  <option value="impossible">Impossible</option>
                </select>
              </label>
            </section>
          )}

          {mode === "join" && (
            <div className="entry-panel">
               <div className="panel-heading">
                <h2>Enter the Code</h2>
              </div>
              <label>
                Display name
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Vera" />
              </label>
              <div className="join-row">
                <label>
                  Room code
                  <input
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                    placeholder="A7KQ2"
                  />
                </label>
                <button disabled={pending || !name.trim() || !roomCode.trim()} onClick={() => joinRoom()}>
                  Join
                </button>
              </div>
            </div>
          )}

          {error && <p className="error">{error}</p>}
        </section>
        <AdSlot placement="right" label="Sponsored mystery slot" />
      </main>
    );
  }

  return (
    <main className="game-shell">
      <AdSlot placement="top" label="Ad space" />
      <header className="top-bar">
        <div>
          <p className="eyebrow">Room {game?.code ?? "..."}</p>
          <h1>{game?.phase ? phaseCopy[game.phase] : "Loading..."}</h1>
        </div>
        <PhaseStatus game={game} />
      </header>

      {error && <p className="error floating-error">{error}</p>}

      <section className="command-strip">
        <RolePanel game={game} self={self} />
        <RoomPanel game={game} isHost={isHost} pending={pending} emitWithAck={emitWithAck} />
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
        <ChatPanel game={game} self={self} emitWithAck={emitWithAck} />
        <VotePanel game={game} selfId={playerId} emitWithAck={emitWithAck} />
        <EventLog game={game} deadPlayers={deadPlayers} />
      </section>
      {game.phase === "roleReveal" && roleCardOpen && game.self?.role && (
        <RoleRevealCard role={game.self.role} game={game} onClose={() => setRoleCardOpen(false)} />
      )}
      <AdSlot placement="bottom" label="Ad space" />
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
  const mafiaTeam = game.self?.mafiaTeam ?? [];
  const mafiaNames = mafiaTeam.map((player) => player.name).join(", ");

  return (
    <article className={`role-panel ${role ?? "unknown"}`}>
      <p className="eyebrow">Private card</p>
      <h2>{role ? roleCopy[role] : "Awaiting role"}</h2>
      <p>
        {game.phase === "lobby"
          ? "Share the code, fill seats, then wait for roles."
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
  if (role === "godfather") return "Lead the Mafia and read as Town to investigations.";
  if (role === "roleblocker") return "Block one living player from acting at night.";
  if (role === "detective") return "Investigate one living player each night.";
  if (role === "doctor") return "Protect one living player each night.";
  if (role === "vigilante") return "Shoot one suspect at night. Choose carefully.";
  if (role === "mayor") return "Your public vote counts double.";
  if (role === "jester") return "Get voted out during the day to win.";
  if (role === "serialKiller") return "Kill at night and survive alone.";
  if (role === "villager") return "Read the room and vote out the Mafia.";
  return "Roles are hidden until the game starts.";
}

function RoomPanel({
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
      <p className="eyebrow">Room control</p>
      <RoomCodeTools game={game} emitWithAck={emitWithAck} />
      {game.phase === "lobby" ? (
        <>
          <p>
            {game.players.length}/{game.settings.maxPlayers} seated. Minimum {game.settings.minPlayers} required.
          </p>
          {isHost && (
      <BotControls game={game} pending={pending} emitWithAck={emitWithAck} />
          )}
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
          {isHost && game?.phase === "gameOver" && (
            <button className="primary-button" disabled={pending} onClick={() => emitWithAck("game:reset", {})}>
              Play Again
            </button>
          )}
        </>
      )}
    </article>
  );
}

function RoomCodeTools({
  game,
  emitWithAck
}: {
  game: ClientGameState;
  emitWithAck: (event: string, payload: unknown) => void;
}) {
  const [copied, setCopied] = useState(false);
  const roomLink = `${window.location.origin}?room=${game?.code ?? ""}`;

  async function copyRoom() {
    await navigator.clipboard.writeText(`${game.code} - ${roomLink}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="room-tools">
      <button type="button" className="secondary-button" onClick={copyRoom}>
        {copied ? "Copied" : `Copy ${game.code}`}
      </button>
      <button type="button" className="secondary-button danger" onClick={() => emitWithAck("room:leave", {})}>
        Leave Room
      </button>
    </div>
  );
}

function BotControls({
  game,
  pending,
  emitWithAck
}: {
  game: ClientGameState;
  pending: boolean;
  emitWithAck: (event: string, payload: unknown) => void;
}) {
  const botCount = (game?.players ?? []).filter((player) => player.isBot).length;

  return (
    <div className="bot-tools">
      <label className="check-row">
        <input
          type="checkbox"
          checked={game.settings.botsEnabled}
          onChange={(event) => emitWithAck("room:settings", { botsEnabled: event.target.checked, botOnly: false })}
        />
        Allow bots
      </label>
      <label>
        Bot difficulty
        <select
          value={game.settings.botDifficulty}
          onChange={(event) => emitWithAck("room:settings", { botDifficulty: event.target.value })}
        >
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="impossible">Impossible</option>
        </select>
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={game.settings.botOnly}
          onChange={(event) => emitWithAck("room:settings", { botOnly: event.target.checked, botsEnabled: event.target.checked || game.settings.botsEnabled })}
        />
        Bot practice mode
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={game.settings.classicRolesEnabled}
          onChange={(event) => emitWithAck("room:settings", { classicRolesEnabled: event.target.checked })}
        />
        Classic+ roles
      </label>
      <div className="room-tools">
        <button disabled={pending || !game.settings.botsEnabled} className="secondary-button" onClick={() => emitWithAck("bot:add", {})}>
          Add Bot
        </button>
        <button disabled={pending || !game.settings.botsEnabled} className="secondary-button" onClick={() => emitWithAck("bot:fill", {})}>
          Fill to Start
        </button>
      </div>
      {botCount > 0 && <p className="muted">{botCount} bot{botCount > 1 ? "s" : ""} seated.</p>}
    </div>
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
  const votes = game.votes ?? {};
  const voteCount = Object.values(votes).filter((targetId) => targetId === player.id).length;
  const canVote = game.phase === "voting" && game.players.find((candidate) => candidate.id === selfId)?.alive;

  return (
    <article className={`player-row ${player.id === selfId ? "self" : ""}`}>
      <div>
        <strong>{player.name}</strong>
        <span>
          {player.isBot ? "Bot" : player.isHost ? "Host" : player.isReady ? "Ready" : "Not ready"} -{" "}
          {player.isConnected ? "Online" : "Away"}
        </span>
      </div>
      <div className="row-actions">
        {player.role && <small>{roleCopy[player.role]}</small>}
        {voteCount > 0 && <small>{voteCount} vote{voteCount > 1 ? "s" : ""}</small>}
        {game.phase === "lobby" && player.isBot && game.players.find((candidate) => candidate.id === selfId)?.isHost && (
          <button onClick={() => emitWithAck("bot:remove", { botId: player.id })}>Remove</button>
        )}
        {canVote && player.id !== selfId && (
          <button onClick={() => emitWithAck("vote:submit", { targetId: player.id })}>Vote</button>
        )}
      </div>
    </article>
  );
}

function VotePanel({
  game,
  selfId,
  emitWithAck
}: {
  game: ClientGameState;
  selfId: string;
  emitWithAck: (event: string, payload: unknown) => void;
}) {
  const living = game.players.filter((player) => player.alive);
  const threshold = Math.floor(living.length / 2) + 1;
  const selfAlive = living.some((player) => player.id === selfId);
  const votes = game.votes ?? {};
  const counts = living
    .map((player) => ({
      player,
      votes: Object.values(votes).filter((targetId) => targetId === player.id).length
    }))
    .sort((a, b) => b.votes - a.votes || a.player.name.localeCompare(b.player.name));

  return (
    <section className="panel vote-panel">
      <div className="panel-heading">
        <h2>Vote Board</h2>
        <span>{game.settings.votingMode === "majority" ? `${threshold} to exile` : "Highest vote"}</span>
      </div>
      <div className="vote-list">
        {counts.map(({ player, votes }) => (
          <div className="vote-row" key={player.id}>
            <div>
              <strong>{player.name}</strong>
              <span>{votes} vote{votes === 1 ? "" : "s"}</span>
            </div>
            <meter min={0} max={Math.max(threshold, 1)} value={votes} />
            {game.phase === "voting" && selfAlive && player.id !== selfId && (
              <button className="secondary-button" onClick={() => emitWithAck("vote:submit", { targetId: player.id })}>
                Vote
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ChatPanel({
  game,
  self,
  emitWithAck
}: {
  game: ClientGameState;
  self?: PublicPlayer;
  emitWithAck: (event: string, payload: unknown) => void;
}) {
  const [text, setText] = useState("");
  const canChat = Boolean(self?.alive || game.phase === "gameOver");
  const chat = game.chat ?? [];

  function send() {
    if (!text.trim()) return;
    emitWithAck("chat:send", { text });
    setText("");
  }

  return (
    <section className="panel chat-panel">
      <div className="panel-heading">
        <h2>Table Chat</h2>
        <span>{chat.length} lines</span>
      </div>
      <div className="chat-feed" aria-live="polite">
        {chat.slice(-16).map((message) => (
          <article className={`chat-line ${message.isBot ? "bot-chat" : ""}`} key={message.id}>
            <strong>{message.playerName}</strong>
            <p>{message.text}</p>
          </article>
        ))}
        {chat.length === 0 && <p className="muted">Claims, pressure, bluffing, and bot table talk will appear here.</p>}
      </div>
      <div className="chat-compose">
        <input
          value={text}
          disabled={!canChat}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          placeholder={canChat ? "Ask a claim, bluff, or pressure a vote..." : "Eliminated players cannot chat"}
        />
        <button disabled={!canChat || !text.trim()} onClick={send}>
          Send
        </button>
      </div>
    </section>
  );
}

function RoleRevealCard({ role, game, onClose }: { role: Role; game: ClientGameState; onClose: () => void }) {
  return (
    <div className="role-reveal-backdrop" role="dialog" aria-modal="true" aria-label="Your role">
      <article className={`role-reveal-card ${role}`}>
        <p className="eyebrow">Your role</p>
        <h2>{roleCopy[role]}</h2>
        <p>{roleDescription(role)}</p>
        {game.self?.mafiaTeam && game.self.mafiaTeam.length ? (
          <p className="intel">Mafia team: {game.self.mafiaTeam.map((player) => player.name).join(", ")}</p>
        ) : null}
        <button onClick={onClose}>I Understand</button>
      </article>
    </div>
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

  const actionType = getNightActionType(role);
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
          <p>{winnerCopy(game.winner)}</p>
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

      {(game.self?.investigationResults ?? []).map((result) => {
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

function winnerCopy(winner: ClientGameState["winner"]) {
  if (winner === "town") return "Town wins";
  if (winner === "mafia") return "Mafia wins";
  if (winner === "jester") return "Jester wins";
  return "Serial Killer wins";
}

function getNightActionType(role?: Role): Omit<NightAction, "actorId">["type"] | undefined {
  if (role === "mafia" || role === "godfather") return "mafiaKill";
  if (role === "detective") return "investigate";
  if (role === "doctor") return "protect";
  if (role === "vigilante") return "vigilanteKill";
  if (role === "serialKiller") return "serialKill";
  if (role === "roleblocker") return "roleblock";
  return undefined;
}

function actionTypeLabel(actionType: Omit<NightAction, "actorId">["type"]) {
  if (actionType === "mafiaKill") return "Kill";
  if (actionType === "investigate") return "Investigation";
  if (actionType === "protect") return "Protection";
  if (actionType === "vigilanteKill") return "Shot";
  if (actionType === "serialKill") return "Kill";
  return "Block";
}

function EventLog({ game, deadPlayers }: { game: ClientGameState; deadPlayers: PublicPlayer[] }) {
  const events = game.events ?? [];
  return (
    <section className="panel log-panel">
      <div className="panel-heading">
        <h2>Chronicle</h2>
        <span>{deadPlayers.length} dead</span>
      </div>
      <ol>
        {events.slice(-10).reverse().map((event) => (
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

function AdSlot({ placement, label }: { placement: "left" | "right" | "top" | "bottom"; label: string }) {
  return (
    <aside className={`ad-slot ad-${placement}`} aria-label={label}>
      <span>{label}</span>
      <strong>Reserved</strong>
    </aside>
  );
}
