import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 9999 });

export default function broadcast(message) {
  for (let client of wss.clients) {
    client.send(message);
  }
}
