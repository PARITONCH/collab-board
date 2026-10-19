import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import type { WebSocket } from "ws";
import { flushSave, loadSnapshot, scheduleSave } from "./persistence";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const OPEN = 1;

interface Room {
  id: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Map<WebSocket, Set<number>>;
}

const rooms = new Map<string, Promise<Room>>();

async function createRoom(id: string): Promise<Room> {
  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  awareness.setLocalState(null);
  const room: Room = { id, doc, awareness, conns: new Map() };

  await loadSnapshot(id, doc);

  doc.on("update", (update: Uint8Array, origin: unknown) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    broadcast(room, encoding.toUint8Array(encoder), origin as WebSocket | null);
    scheduleSave(id, doc);
  });

  awareness.on(
    "update",
    (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      const changed = added.concat(updated, removed);
      if (origin && room.conns.has(origin as WebSocket)) {
        const controlled = room.conns.get(origin as WebSocket)!;
        added.forEach((c) => controlled.add(c));
        removed.forEach((c) => controlled.delete(c));
      }
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changed)
      );
      broadcast(room, encoding.toUint8Array(encoder), null);
    }
  );

  return room;
}

function getRoom(id: string): Promise<Room> {
  let room = rooms.get(id);
  if (!room) {
    room = createRoom(id);
    rooms.set(id, room);
  }
  return room;
}

function send(conn: WebSocket, message: Uint8Array): void {
  if (conn.readyState !== OPEN) return;
  conn.send(message, (err) => {
    if (err) conn.close();
  });
}

function broadcast(room: Room, message: Uint8Array, except: WebSocket | null): void {
  room.conns.forEach((_, conn) => {
    if (conn !== except) send(conn, message);
  });
}

function handleMessage(room: Room, conn: WebSocket, data: Uint8Array): void {
  const decoder = decoding.createDecoder(data);
  const type = decoding.readVarUint(decoder);

  if (type === MESSAGE_SYNC) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn);
    if (encoding.length(encoder) > 1) send(conn, encoding.toUint8Array(encoder));
    return;
  }

  if (type === MESSAGE_AWARENESS) {
    awarenessProtocol.applyAwarenessUpdate(
      room.awareness,
      decoding.readVarUint8Array(decoder),
      conn
    );
  }
}

export async function flushAllRooms(): Promise<void> {
  const settled = await Promise.allSettled(Array.from(rooms.values()));
  const live = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  await Promise.all(live.map((room) => flushSave(room.id, room.doc)));
}

async function closeConnection(room: Room, conn: WebSocket): Promise<void> {
  const controlled = room.conns.get(conn);
  room.conns.delete(conn);
  if (controlled) {
    awarenessProtocol.removeAwarenessStates(room.awareness, Array.from(controlled), null);
  }
  conn.close();

  if (room.conns.size === 0) {
    await flushSave(room.id, room.doc).catch((err) => console.error("flush failed", err));
    if (room.conns.size === 0) {
      rooms.delete(room.id);
      room.doc.destroy();
    }
  }
}

export async function setupConnection(conn: WebSocket, roomId: string): Promise<void> {
  conn.binaryType = "arraybuffer";

  const pending: Uint8Array[] = [];
  let room: Room | null = null;
  let closed = false;
  let alive = true;
  const heartbeat: { timer?: ReturnType<typeof setInterval> } = {};

  const dispatch = (target: Room, data: Uint8Array) => {
    try {
      handleMessage(target, conn, data);
    } catch (err) {
      console.error("message error", err);
    }
  };

  conn.on("message", (raw: ArrayBuffer) => {
    const data = new Uint8Array(raw);
    if (room) dispatch(room, data);
    else pending.push(data);
  });

  conn.on("pong", () => {
    alive = true;
  });

  conn.on("close", () => {
    closed = true;
    clearInterval(heartbeat.timer);
    if (room) void closeConnection(room, conn);
  });

  const joined = await getRoom(roomId);
  joined.conns.set(conn, new Set());
  room = joined;

  if (closed) {
    await closeConnection(joined, conn);
    return;
  }

  heartbeat.timer = setInterval(() => {
    if (!alive) {
      clearInterval(heartbeat.timer);
      void closeConnection(joined, conn);
      return;
    }
    alive = false;
    conn.ping();
  }, 30000);

  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(syncEncoder, joined.doc);
  send(conn, encoding.toUint8Array(syncEncoder));

  const states = joined.awareness.getStates();
  if (states.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(joined.awareness, Array.from(states.keys()))
    );
    send(conn, encoding.toUint8Array(awarenessEncoder));
  }

  for (const data of pending.splice(0)) dispatch(joined, data);
}
