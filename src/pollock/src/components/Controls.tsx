import { GlobeIcon, TranscriptIcon, SoundIcon, SoundOffIcon, InfoIcon } from './Icons';
import { LANGUAGE_LABELS, LANGUAGE_SHORT, UI_LABELS } from '../data/transcripts';
import type { PanelType } from './PollockViewer';

interface ControlsProps {
  onOpenPanel: (panel: PanelType) => void;
  currentLang: string;
  muted?: boolean;
  onMuteToggle?: () => void;
  showLanguageSelection?: boolean;
}

const btn = 'cursor-pointer transition-opacity hover:opacity-80';

export default function Controls({
  onOpenPanel,
  currentLang,
  muted = false,
  onMuteToggle,
  showLanguageSelection = true,
}: ControlsProps) {
  const MuteIcon = muted ? SoundOffIcon : SoundIcon;
  const labels = UI_LABELS[currentLang] ?? UI_LABELS.en;

  return (
    <>
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
