export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "error" | "warn";
  message: string;
}
