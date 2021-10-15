import FileWatcher from "./FileWatcher";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 9999 });

const fileWatcher = new FileWatcher();

interface FolderOperation {
  type: "open" | "close";
  pathname: string;
}

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

console.log("Ready!");
