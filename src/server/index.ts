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

io.on("connection", (socket) => {
  socket.on("room:create", (payload: { playerId: string; name: string; maxPlayers?: number }, callback) => {
    const maxPlayers = Math.max(5, Math.min(30, Number(payload.maxPlayers ?? 30)));
    const game = store.createRoom(
      { id: payload.playerId, name: payload.name },
      { maxPlayers }
    );
    socket.data.roomCode = game.code;
    socket.data.playerId = payload.playerId;
    socket.join(game.code);
    callback?.({ ok: true, roomCode: game.code, playerId: payload.playerId });
    emitRoom(game);
  });

  socket.on("room:join", (payload: { roomCode: string; playerId: string; name: string }, callback) => {
    const roomCode = payload.roomCode.toUpperCase().trim();
    const result = store.joinRoom(roomCode, { id: payload.playerId, name: payload.name });
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not join room.");
      return;
    }

    socket.data.roomCode = result.game.code;
    socket.data.playerId = payload.playerId;
    socket.join(result.game.code);
    callback?.({ ok: true, roomCode: result.game.code, playerId: payload.playerId });
    emitRoom(result.game);
  });

  socket.on("player:ready", (payload: { ready: boolean }, callback) => {
    const data = socket.data as SocketData;
    if (!data.roomCode || !data.playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.setReady(data.roomCode, data.playerId, payload.ready);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not update ready state.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("game:start", (_payload, callback) => {
    const data = socket.data as SocketData;
    if (!data.roomCode || !data.playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.startGame(data.roomCode, data.playerId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not start game.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("game:advance", (_payload, callback) => {
    const data = socket.data as SocketData;
    if (!data.roomCode || !data.playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.advance(data.roomCode, data.playerId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not advance phase.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("night:action", (payload: Omit<NightAction, "actorId">, callback) => {
    const data = socket.data as SocketData;
    if (!data.roomCode || !data.playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const action = { ...payload, actorId: data.playerId } as NightAction;
    const result = store.submitNightAction(data.roomCode, action);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not submit night action.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("vote:submit", (payload: { targetId: string }, callback) => {
    const data = socket.data as SocketData;
    if (!data.roomCode || !data.playerId) {
      fail(callback, "Join a room first.");
      return;
    }

    const result = store.submitVote(data.roomCode, data.playerId, payload.targetId);
    if (!result.game || result.error) {
      fail(callback, result.error ?? "Could not submit vote.");
      return;
    }

    callback?.({ ok: true });
    emitRoom(result.game);
  });

  socket.on("disconnect", () => {
    const data = socket.data as SocketData;
    if (!data.roomCode || !data.playerId) {
      return;
    }

    const result = store.disconnect(data.roomCode, data.playerId);
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
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

httpServer.listen(port, () => {
  console.log(`Mafia is running at http://localhost:${port}`);
});
