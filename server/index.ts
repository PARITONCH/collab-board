import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { initPersistence } from "./persistence";
import { setupConnection } from "./rooms";

const PORT = Number(process.env.WS_PORT ?? 1234);
const ROOM_PATH = /^\/rooms\/([A-Za-z0-9_-]{1,64})$/;

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
  wss.handleUpgrade(req, socket, head, (ws) => {
    void setupConnection(ws, match[1]);
  });
});

initPersistence()
  .then(() => {
    server.listen(PORT, () => console.log(`realtime server on :${PORT}`));
  })
  .catch((err) => {
    console.error("failed to init persistence", err);
    process.exit(1);
  });
