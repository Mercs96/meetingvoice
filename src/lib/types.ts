// Shared types for MeetingVoice app

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: string; // ISO
  duration: number; // seconds
  status: MeetingStatus;
  language: string;
  tags: string[];
  summary: string | null;
  keyPoints: string[] | null;
  actionItems: ActionItem[] | null;
  audioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MeetingStatus =
  | "recording"
  | "completed"
  | "transcribed"
  | "summarized"
  | "failed";

export interface Segment {
  id: string;
  meetingId: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface Attendee {
  id: string;
  meetingId: string;
  name: string;
  email: string | null;
  role: string | null;
}

export interface ActionItem {
  text: string;
  assignee?: string;
  done?: boolean;
}

export interface EmailLog {
  id: string;
  meetingId: string;
  toEmail: string;
  subject: string;
  bodyPreview: string;
  status: "sent" | "failed";
  sentAt: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  secure: boolean;
}

export interface AppSettings {
  language: "es-ES" | "en-US";
  defaultSpeakerLabel: string;
  autoSummarize: boolean;
  smtp: SmtpSettings | null;
}

export interface TranscriptionConfig {
  engine: "web-speech" | "whisper" | "vosk";
  language: string;
  continuous: boolean;
  interimResults: boolean;
}
