export type EventType = "unlink" | "file" | "folder";
export interface FileEvent {
  eventType: EventType;
  filename: string;
  pathname: string;
}
