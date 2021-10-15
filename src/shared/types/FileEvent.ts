import type { EventType } from "./EventType";
export interface FileEvent {
  eventType: EventType;
  filename: string;
  pathname: string;
}
