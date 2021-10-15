import Koa from "koa";
import http from "http";
import { registerWebSocketServer } from "./WSService";
import serve from "koa-static";
import path from "path";

const app = new Koa();

const server = http.createServer(app.callback());

registerWebSocketServer(server);
app.use(serve(path.join(__dirname, "..", "public")));

server.listen(8080, function listening() {
  // @ts-ignore
  console.log("Listening on", server.address().port);
});
