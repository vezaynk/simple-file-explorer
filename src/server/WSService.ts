import FileWatcher from "./FileWatcher";
import { WebSocketServer } from "ws";
import http from "http";

interface FolderOperation {
  type: "open" | "close";
  pathname: string;
}

export function registerWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  const fileWatcher = new FileWatcher();

  wss.on("connection", (ws) => {
    console.log("Connected");
    const subscriptions = new Map<string, () => void>();
    ws.on("close", () => {
      for (let [pathname, unsub] of subscriptions) {
        unsub();
        subscriptions.delete(pathname);
      }
    });
    ws.on("message", async (message: string) => {
      const { type, pathname } = JSON.parse(message) as FolderOperation;
      switch (type) {
        case "open":
          if (!subscriptions.get(pathname)) {
            subscriptions.set(
              pathname,
              fileWatcher.subscribe(pathname, (fileEvent) =>
                ws.send(JSON.stringify(fileEvent))
              )
            );
          }
          break;
        case "close":
          const unsub = subscriptions.get(pathname);
          if (!unsub) return;
          subscriptions.delete(pathname);
          unsub();
          break;
      }
    });
  });

  server.on("upgrade", (request, socket, head) =>
    // @ts-ignore
    wss.handleUpgrade(request, socket, head, (ws) =>
      wss.emit("connection", ws, request)
    )
  );
}
