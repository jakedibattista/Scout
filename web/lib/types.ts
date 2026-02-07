export type SportOption = "lacrosse" | "hockey" | "football";

export type ScoutLevel = "D1" | "D2" | "D3" | "JUCO" | "Club";

export type DrillType = "speed_ladder" | "shuttle_run" | "position_specific";

export type ReportType = "scout" | "research" | "coach";

export type ReportLevel = "D1" | "D2" | "D3" | "JUCO" | "Club";

export type ScoutProfile = {
  userId: string;
  username: string;
  name: string;
  email: string;
  sport: SportOption;
  program: string;
  level: ScoutLevel;
  recruitingStates?: string[];
  minAge?: number;
  positionFocus?: string[];
};

export type AthleteProfile = {
  userId: string;
  username: string;
  name: string;
  email: string;
  state: string;
  sport: SportOption;
  position: string;
  height: string;
  weight: string;
  gradYear: number;
  highSchoolTeam: string;
  goal: string;
  clubTeam?: string;
  currentOffers?: string[];
  highlightTapeUrl?: string;
  socials?: {
    instagram?: string;
    x?: string;
    tiktok?: string;
    youtube?: string;
  };
  gpa?: number;
  relocateStates?: string[];
};

export type Video = {
  athleteId: string;
  drillType: DrillType;
  fileUrl: string;
  uploadDate: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  notes?: string;
  retries?: number;
};

export type Report = {
  athleteId: string;
  type: ReportType;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  metrics: Record<string, string | number>;
  recommendedLevel: ReportLevel;
  createdAt: string;
};

export type SavedSearch = {
  scoutId: string;
  query: string;
  parsedFilters: Record<string, string | number | string[]>;
  createdAt: string;
  notifyEmail: boolean;
};
