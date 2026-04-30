import { GlobeIcon, TranscriptIcon, SoundIcon, SoundOffIcon, InfoIcon } from './Icons';
import { LANGUAGE_LABELS, LANGUAGE_SHORT, UI_LABELS } from '../data/transcripts';
import type { PanelType } from './PollockViewer';

type ThemeMode = 'light' | 'dark';

interface ControlsProps {
  onOpenPanel: (panel: PanelType) => void;
  currentLang: string;
  muted?: boolean;
  onMuteToggle?: () => void;
  showLanguageSelection?: boolean;
  themeMode: ThemeMode;
  onThemeToggle: () => void;
}

const btn = 'cursor-pointer transition-opacity hover:opacity-80';

function SunIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.75v2.5M12 18.75v2.5M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2.75 12h2.5M18.75 12h2.5M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M19.2 14.7A7.58 7.58 0 0 1 9.3 4.8a7.6 7.6 0 1 0 9.9 9.9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Controls({
  onOpenPanel,
  currentLang,
  muted = false,
  onMuteToggle,
  showLanguageSelection = true,
  themeMode,
  onThemeToggle,
}: ControlsProps) {
  const MuteIcon = muted ? SoundOffIcon : SoundIcon;
  const ThemeIcon = themeMode === 'light' ? MoonIcon : SunIcon;
  const labels = UI_LABELS[currentLang] ?? UI_LABELS.en;

  return (
    <>
      <button
        className={`${btn} absolute right-4 top-[44px] z-30 flex size-[48px] items-center justify-center rounded-[24px] bg-[rgba(244,244,244,0.7)] text-[#222] backdrop-blur-[20px] md:right-[48px]`}
        aria-label={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        onClick={onThemeToggle}
        type="button"
      >
        <ThemeIcon key={themeMode} className="size-5" />
      </button>

      {/* ===== MOBILE: all bottom buttons in one centered row ===== */}
      <div className="absolute bottom-[155px] left-1/2 z-30 flex -translate-x-1/2 gap-[7px] md:hidden">
        <button
          className={`${btn} flex size-[48px] shrink-0 items-center justify-center rounded-[24px] bg-[rgba(244,244,244,0.8)] text-[#222]`}
          aria-label="Information"
          onClick={() => onOpenPanel('info')}
          data-analytics="infoButton"
          type="button"
        >
          <InfoIcon />
        </button>

        {showLanguageSelection && (
          <button
            className={`${btn} flex shrink-0 items-center gap-2 rounded-[24px] bg-[rgba(244,244,244,0.8)] p-4 text-[#222]`}
            onClick={() => onOpenPanel('language')}
            data-analytics={`changeLanguageButton:${currentLang}`}
            type="button"
          >
            <span className="whitespace-nowrap text-[14px] font-light uppercase leading-[1.2] text-black">
              {LANGUAGE_SHORT[currentLang] ?? 'EN'}
            </span>
            <GlobeIcon className="size-4 shrink-0" />
          </button>
        )}

        <button
          className={`${btn} flex h-[48px] shrink-0 items-center gap-2 rounded-[24px] bg-[rgba(244,244,244,0.8)] px-6 py-3 text-[#222]`}
          onClick={() => onOpenPanel('transcript')}
          data-analytics={`viewTranscriptButton:${currentLang}`}
          type="button"
        >
          <TranscriptIcon className="size-4 shrink-0" />
          <span className="whitespace-nowrap text-[14px] font-light uppercase leading-[1.2] text-black">
            {labels.transcript}
          </span>
        </button>

        <button
          className={`${btn} flex shrink-0 items-center rounded-[100px] bg-[rgba(244,244,244,0.8)] p-4 text-[#222]`}
          aria-label="Toggle sound"
          onClick={onMuteToggle}
          data-muted={`${muted ? 'true' : 'false'}`}
          data-analytics="muteButton"
          type="button"
        >
          <MuteIcon className="size-4 shrink-0" />
        </button>
      </div>

      {/* ===== DESKTOP: 3 independently positioned groups ===== */}
      <div className="hidden md:block">
        <button
          className={`${btn} absolute bottom-[120px] left-[48px] z-30 flex size-[48px] items-center justify-center rounded-[24px] bg-[rgba(244,244,244,0.7)] text-[#222] backdrop-blur-[20px]`}
          aria-label="Information"
          onClick={() => onOpenPanel('info')}
          data-analytics="infoButton"
          type="button"
        >
          <InfoIcon />
        </button>

        <div className="absolute bottom-[120px] left-1/2 z-30 flex -translate-x-1/2 gap-[7px]">
          {showLanguageSelection && (
            <button
              className={`${btn} flex shrink-0 items-center gap-2 rounded-[24px] bg-[rgba(244,244,244,0.7)] p-4 text-[#222] backdrop-blur-[10px]`}
              onClick={() => onOpenPanel('language')}
              data-analytics={`changeLanguageButton:${currentLang}`}
              type="button"
            >
              <span className="whitespace-nowrap text-[14px] font-light uppercase leading-[1.2] text-[#222]">
                {LANGUAGE_LABELS[currentLang] ?? 'ENGLISH'}
              </span>
              <GlobeIcon className="size-4 shrink-0" />
            </button>
          )}

          <button
            className={`${btn} flex h-[48px] shrink-0 items-center gap-2 rounded-[24px] bg-[rgba(244,244,244,0.7)] px-6 py-3 text-[#222] backdrop-blur-[10px]`}
            onClick={() => onOpenPanel('transcript')}
            data-analytics={`viewTranscriptButton:${currentLang}`}
            type="button"
          >
            <span className="whitespace-nowrap text-[14px] font-light uppercase leading-[1.2] text-[#222]">
              {labels.viewTranscript}
            </span>
            <TranscriptIcon className="size-4 shrink-0" />
          </button>
        </div>

        <button
          className={`${btn} absolute bottom-[120px] right-[48px] z-30 flex items-center rounded-[100px] bg-[rgba(244,244,244,0.7)] p-4 text-[#222] backdrop-blur-[20px]`}
          aria-label="Toggle sound"
          onClick={onMuteToggle}
          data-muted={`${muted ? 'true' : 'false'}`}
          data-analytics="muteButton"
          type="button"
        >
          <MuteIcon className="size-4 shrink-0" />
        </button>
      </div>
    </>
  );
}
