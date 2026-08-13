import { create } from "zustand";
import type { Meeting, Segment, Attendee, AppSettings } from "@/lib/types";

interface AppState {
  // Current recording session
  isRecording: boolean;
  currentMeetingId: string | null;
  currentTitle: string;
  liveSegments: Segment[];
  liveDuration: number;
  interimText: string;
  currentSpeaker: string;

  // Meetings list cache
  meetings: Meeting[];
  selectedMeeting: Meeting | null;
  selectedSegments: Segment[];
  selectedAttendees: Attendee[];

  // Search / filters
  searchQuery: string;
  filterTag: string | null;

  // Settings
  settings: AppSettings;
  settingsLoaded: boolean;

  // UI state
  view: "dashboard" | "recording" | "detail" | "settings";
  sidebarOpen: boolean;

  // Actions
  startRecording: (title: string) => void;
  stopRecording: () => void;
  addLiveSegment: (segment: Segment) => void;
  updateInterim: (text: string) => void;
  setLiveDuration: (sec: number) => void;
  setSpeaker: (s: string) => void;
  resetLive: () => void;

  setMeetings: (m: Meeting[]) => void;
  selectMeeting: (m: Meeting, segments: Segment[], attendees: Attendee[]) => void;
  setView: (v: AppState["view"]) => void;
  setSidebar: (open: boolean) => void;

  setSearch: (q: string) => void;
  setFilterTag: (t: string | null) => void;

  setSettings: (s: AppSettings) => void;
}

const defaultSettings: AppSettings = {
  language: "es-ES",
  defaultSpeakerLabel: "Hablante 1",
  autoSummarize: true,
  smtp: null,
};

export const useAppStore = create<AppState>((set) => ({
  isRecording: false,
  currentMeetingId: null,
  currentTitle: "",
  liveSegments: [],
  liveDuration: 0,
  interimText: "",
  currentSpeaker: "Hablante 1",

  meetings: [],
  selectedMeeting: null,
  selectedSegments: [],
  selectedAttendees: [],

  searchQuery: "",
  filterTag: null,

  settings: defaultSettings,
  settingsLoaded: false,

  view: "dashboard",
  sidebarOpen: false,

  startRecording: (title) =>
    set({
      isRecording: true,
      currentTitle: title,
      liveSegments: [],
      liveDuration: 0,
      interimText: "",
      currentSpeaker: "Hablante 1",
      view: "recording",
    }),

  stopRecording: () => set({ isRecording: false }),

  addLiveSegment: (segment) =>
    set((s) => ({
      liveSegments: [...s.liveSegments, segment],
      interimText: "",
    })),

  updateInterim: (text) => set({ interimText: text }),
  setLiveDuration: (sec) => set({ liveDuration: sec }),
  setSpeaker: (sp) => set({ currentSpeaker: sp }),

  resetLive: () =>
    set({
      liveSegments: [],
      liveDuration: 0,
      interimText: "",
      currentTitle: "",
      currentMeetingId: null,
    }),

  setMeetings: (m) => set({ meetings: m }),

  selectMeeting: (meeting, segments, attendees) =>
    set({
      selectedMeeting: meeting,
      selectedSegments: segments,
      selectedAttendees: attendees,
      view: "detail",
    }),

  setView: (v) => set({ view: v }),
  setSidebar: (open) => set({ sidebarOpen: open }),

  setSearch: (q) => set({ searchQuery: q }),
  setFilterTag: (t) => set({ filterTag: t }),

  setSettings: (s) => set({ settings: s, settingsLoaded: true }),
}));
