import fs from "fs";
import path from "path";
import type { FileEvent } from "../shared/types/FileEvent";
import type { EventType } from "../shared/types/EventType";

export async function getFileType(file: string): Promise<EventType> {
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

    console.log(
      `Publishing ${pathname} change to ${subscribers.size} subscribers`,
      event
    );
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

    console.log(`Subscribed to ${pathname} (${subscribers.size})`);
    return () => {
      subscribers.delete(callback);
      console.log(`Unsubscribing from ${pathname} (${subscribers.size})`);
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

    console.log(`Watching ${pathname}`);
    this.watchers.set(pathname, watcher);
  }
  unwatch(pathname: string) {
    const watcher = this.watchers.get(pathname);
    if (!watcher) return;

    console.log(`Unwatching ${pathname}`);
    watcher.close();
    this.watchers.delete(pathname);
  }
}
