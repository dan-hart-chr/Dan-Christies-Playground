export {};

declare global {
  interface AudioTrackPayload {
    audio_playing?: boolean;
    audio_title: string;       // identifies the artName
    audio_language: string;    // active language at time of event
    audio_progress?: string;   // '25%' | '50%' | '75%' only on audio_progress
  }


  interface AnalyticsDataLayer {
    page: {
      name: string;
      channel: string;
      language: string;
      template: string;
    };
    platform: {
      name: string;
      version: string;
    };
    user: {
      status: string;
      GUID: string;
    };
    audio?: AudioTrackPayload;
  }

  interface Window {
    artName?: string;
    AnalyticsDataLayer?: AnalyticsDataLayer;
    viewPageViewFired?: boolean;
    // Adobe Launch runtime — no official @types package available
    _satellite?: {
      track(event: string, detail?: unknown): void;
    };
  }
}
