import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { initPersistence } from "./persistence";
import { flushAllRooms, setupConnection } from "./rooms";

const PORT = Number(process.env.PORT ?? process.env.WS_PORT ?? 1234);
const ROOM_PATH = /^\/rooms\/([A-Za-z0-9_-]{1,64})$/;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin: string | undefined): boolean =>
  ALLOWED_ORIGINS.length === 0 || (origin !== undefined && ALLOWED_ORIGINS.includes(origin));

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const match = ROOM_PATH.exec(pathname);
  if (!match) {
    socket.destroy();
    return;
  }
  if (!isAllowedOrigin(req.headers.origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    void setupConnection(ws, match[1]);
  });
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, flushing boards`);
  server.close();
  wss.clients.forEach((client) => client.close(1001));
  await flushAllRooms().catch((err) => console.error("flush on shutdown failed", err));
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

initPersistence()
  .then(() => {
    server.listen(PORT, () => console.log(`realtime server on :${PORT}`));
  })
  .catch((err) => {
    console.error("failed to init persistence", err);
    process.exit(1);
  });
