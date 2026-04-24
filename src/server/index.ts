import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { toClientState } from "../shared/engine";
import type { Game, NightAction } from "../shared/types";
import { RoomStore } from "./roomStore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 5173);
const hmrPort = Number(process.env.VITE_HMR_PORT ?? port + 1);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});
const store = new RoomStore();

type SocketData = {
  roomCode?: string;
  playerId?: string;
};

function emitRoom(game: Game) {
  const sockets = io.sockets.adapter.rooms.get(game.code);
  if (!sockets) {
    return;
  }

  for (const socketId of sockets) {
    const socket = io.sockets.sockets.get(socketId);
    const viewerId = (socket?.data as SocketData | undefined)?.playerId;
    socket?.emit("game:state", toClientState(game, viewerId));
  }
}

function fail(callback: unknown, message: string) {
  if (typeof callback === "function") {
    callback({ ok: false, error: message });
  }
}

function getSession(socket: any, payload: any): SocketData {
  const data = socket.data as SocketData;
  const roomCode = (payload?.roomCode || data.roomCode)?.toUpperCase();
  const playerId = payload?.playerId || data.playerId;

  if (roomCode && playerId) {
    if (!socket.rooms.has(roomCode)) {
      socket.join(roomCode);
    }
    socket.data = { roomCode, playerId };
  }

  return { roomCode, playerId };
}

io.on("connection", (socket) => {
  socket.on("lobby:list", (_payload, callback) => {
    callback?.({ ok: true, rooms: store.listRooms() });
  });

  socket.on(
    "room:create",
    (
      payload: {
        playerId: string;
        name: string;
        maxPlayers?: number;
        botsEnabled?: boolean;
        botOnly?: boolean;
        classicRolesEnabled?: boolean;
        botDifficulty?: "easy" | "normal" | "hard" | "impossible";
      },
      callback
    ) => {
    console.log("Server received room:create:", payload);
    const maxPlayers = Math.max(5, Math.min(30, Number(payload.maxPlayers ?? 30)));
    const game = store.createRoom(
      { id: payload.playerId, name: payload.name },
      {
        maxPlayers,
        botsEnabled: Boolean(payload.botsEnabled || payload.botOnly),
        botOnly: Boolean(payload.botOnly),
        classicRolesEnabled: payload.classicRolesEnabled ?? true,
        botDifficulty: payload.botDifficulty ?? "normal"
      }
    );
    socket.data = { roomCode: game.code, playerId: payload.playerId };
    socket.join(game.code);
    callback?.({ ok: true, roomCode: game.code, playerId: payload.playerId });
    emitRoom(game);
    }
  );

  socket.on("room:join", (payload: { roomCode: string; playerId: string; name: string }, callback) => {
    const roomCode = payload.roomCode.toUpperCase().trim();
    const result = store.joinRoom(roomCode, { id: payload.playerId, name: payload.name });
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not join room.");
      return;
    }

    socket.data = { roomCode: result.game.code, playerId: payload.playerId };
    socket.join(result.game.code);
    callback?.({ ok: true, roomCode: result.game.code, playerId: payload.playerId });
    emitRoom(result.game);
  });

  socket.on("player:ready", (payload: { ready: boolean }, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.setReady(roomCode, playerId, payload.ready);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not update ready state.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("room:settings", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.updateSettings(roomCode, playerId, payload);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not update settings.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("chat:send", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.addChat(roomCode, playerId, payload.text);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not send chat.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);

    const botReply = store.chooseBotChatReply(roomCode, payload.text, playerId);
    if (botReply) {
      windowlessDelay(botReply.delayMs, () => {
        const replyResult = store.addChat(roomCode, botReply.botId, botReply.text);
        if (replyResult.game) {
          emitRoom(replyResult.game);
        }
      });
    }
  });

  socket.on("bot:add", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.addBot(roomCode, playerId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not add bot.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("bot:fill", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.fillBots(roomCode, playerId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not fill bot seats.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("bot:remove", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.removeBot(roomCode, playerId, payload.botId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not remove bot.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("room:leave", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.leave(roomCode, playerId);
    socket.leave(roomCode);
    socket.data = {};
    socket.emit("room:left");
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not leave room.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("game:start", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.startGame(roomCode, playerId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not start game.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("game:reset", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.resetGame(roomCode, playerId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not reset game.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("game:advance", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.advance(roomCode, playerId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not advance phase.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("night:action", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const action = { ...payload, actorId: playerId } as NightAction;
    const result = store.submitNightAction(roomCode, action);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not submit night action.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("vote:submit", (payload: any, callback) => {
    const { roomCode, playerId } = getSession(socket, payload);
    if (!roomCode || !playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.submitVote(roomCode, playerId, payload.targetId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not submit vote.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("disconnect", () => {
    const { roomCode, playerId } = getSession(socket, {});
    if (!roomCode || !playerId) {
      return;
    }

    const result = store.disconnect(roomCode, playerId);
    if (result.game) {
      emitRoom(result.game);
    }
  });
});

if (isProduction) {
  app.use(express.static(path.resolve(__dirname, "../../dist/client")));
  app.get("*", (_request, response) => {
    response.sendFile(path.resolve(__dirname, "../../dist/client/index.html"));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { port: hmrPort } },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

httpServer.listen(port, () => {
  console.log(`Mafia is running at http://localhost:${port}`);
});

function windowlessDelay(delayMs: number, callback: () => void) {
  setTimeout(callback, delayMs);
}

setInterval(() => {
  store.cleanup();
}, 60000);

