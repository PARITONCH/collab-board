import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import WebSocket from "ws";

const SERVER = process.env.WS_URL ?? "ws://localhost:1234";
const ROOM = `smoke-${Date.now()}`;

function connect() {
  const doc = new Y.Doc();
  const provider = new WebsocketProvider(`${SERVER}/rooms`, ROOM, doc, {
    WebSocketPolyfill: WebSocket as unknown as typeof globalThis.WebSocket,
    disableBc: true,
  });
  return { doc, provider, shapes: doc.getMap<Y.Map<unknown>>("shapes") };
}

async function waitFor(check: () => boolean, label: string, timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  while (!check()) {
    if (Date.now() - started > timeoutMs) throw new Error(`timeout: ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  console.log(`ok  ${label}`);
}

async function main() {
  const a = connect();
  const b = connect();
  await waitFor(() => a.provider.synced && b.provider.synced, "clients synced");

  const shape = new Y.Map<unknown>();
  shape.set("id", "s1");
  shape.set("x", 10);
  shape.set("color", "#ffffff");
  a.shapes.set("s1", shape);
  await waitFor(() => b.shapes.has("s1"), "shape replicates a -> b");

  a.shapes.get("s1")!.set("x", 50);
  b.shapes.get("s1")!.set("color", "#f87171");
  await waitFor(
    () =>
      [a, b].every((c) => c.shapes.get("s1")?.get("x") === 50 && c.shapes.get("s1")?.get("color") === "#f87171"),
    "concurrent edits to different fields merge"
  );

  a.provider.awareness.setLocalStateField("cursor", { x: 1, y: 2 });
  await waitFor(() => {
    const state = b.provider.awareness.getStates().get(a.doc.clientID) as { cursor?: { x: number } } | undefined;
    return state?.cursor?.x === 1;
  }, "awareness cursor reaches peer");

  const late = connect();
  await waitFor(() => late.shapes.get("s1")?.get("x") === 50, "late joiner receives full state");

  a.provider.destroy();
  await waitFor(() => !b.provider.awareness.getStates().has(a.doc.clientID), "peer removed on disconnect", 8000);

  for (const client of [b, late]) client.provider.destroy();

  if (process.env.EXPECT_PERSISTENCE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const restored = connect();
    await waitFor(() => restored.shapes.get("s1")?.get("x") === 50, "board restored from database after all clients left");
    restored.provider.destroy();
  }

  console.log("all checks passed");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
