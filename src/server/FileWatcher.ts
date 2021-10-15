import fs from "fs";
import path from "path";
import type { FileEvent, EventType } from "../types/FileEvent";

async function getFileType(file: string): Promise<EventType> {
  return fs.promises
    .stat(file)
    .then((file) => {
      if (file.isDirectory()) return "folder";
      return "file";
    })
    .catch(() => "unlink");
}

export default class FileWatcher {
  subscriptions = new Map<string, Set<(event: FileEvent) => void>>();
  watchers = new Map<string, fs.FSWatcher>();

  publish(pathname: string, event: FileEvent) {
    // only broadcast if there are subscribers
    const subscribers = this.subscriptions.get(pathname);
    if (!subscribers) return;

    console.log("Publishing", event, "to", subscribers.size, "clients");
    for (let callback of subscribers) {
      callback(event);
    }
  }
  subscribe(pathname: string, callback: (event: FileEvent) => void) {
    if (!this.watchers.get(pathname)) this.watch(pathname);

    let subscribers = this.subscriptions.get(pathname);
    if (!subscribers) {
      subscribers = new Set();
      this.subscriptions.set(pathname, subscribers);
    }
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscriptions.delete(pathname);
        this.unwatch(pathname);
      }
    };
  }

  async watch(pathname: string) {
    if (this.watchers.get(pathname)) return;

    //Setup watcher
    const watcher = fs.watch(pathname, async (eventType, filename) => {
      // Only watch rename events, we do not care about changes
      if (eventType != "rename") return;

      const realEvent: EventType = await getFileType(
        path.join(pathname, filename)
      );

      this.publish(pathname, { eventType: realEvent, filename, pathname });
    });

    this.watchers.set(pathname, watcher);

    // Send full listing when subscribing
    // This isn't a very good way of doing it, but it's awfully convenient
    const files = await fs.promises.readdir(pathname);
    for (let filename of files) {
      this.publish(pathname, {
        eventType: await getFileType(path.join(pathname, filename)),
        filename,
        pathname,
      });
    }
  }
  unwatch(pathname: string) {
    const watcher = this.watchers.get(pathname);
    if (!watcher) return;
    watcher.close();
    this.watchers.delete(pathname);
  }
}
