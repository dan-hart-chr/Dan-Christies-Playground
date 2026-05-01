import { useEffect } from 'react';
import GlassPanel from './GlassPanel';
import { UI_LABELS } from '../data/transcripts';

function ScrollIcon() {
  return (
    <div className="flex size-[60px] items-center justify-center rounded-[12px] bg-[rgba(244,244,244,0.52)] text-[#222] backdrop-blur-[20px]">
      <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1" />
        <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

interface InfoPanelProps {
  onClose: () => void;
  lang?: string;
  /** Intro flow: hide ×, disable backdrop, show CONTINUE + auto-dismiss bar */
  introMode?: boolean;
  /** Triggered by Continue or auto-dismiss in intro mode */
  onContinue?: () => void;
  autoDismissMs?: number;
  hideClose?: boolean;
  disableBackdropClose?: boolean;
  closing?: boolean;
}

export default function InfoPanel({
  onClose,
  lang = 'en',
  introMode = false,
  onContinue,
  autoDismissMs = 6000,
  hideClose = false,
  disableBackdropClose = false,
  closing = false,
}: InfoPanelProps) {
  const labels = UI_LABELS[lang] ?? UI_LABELS.en;

  // Auto-dismiss timer (intro only)
  useEffect(() => {
    if (!introMode || !onContinue) return;
    const id = window.setTimeout(() => onContinue(), autoDismissMs);
    return () => clearTimeout(id);
  }, [introMode, autoDismissMs, onContinue]);

  return (
    <GlassPanel
      onClose={onClose}
      className="h-[403px] w-[358px]"
      hideClose={hideClose}
      disableBackdropClose={disableBackdropClose}
      closing={closing}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2">
        <ScrollIcon />
        <p className="text-center font-sans text-[16px] font-light leading-[1.4] text-black">
          {labels.instructions}
        </p>
        {introMode && (
          <button
            type="button"
            onClick={() => onContinue?.()}
            data-analytics="splashContinue"
            className="mt-2 cursor-pointer rounded-full border border-black/40 bg-transparent px-9 py-2.5 text-[13px] font-light uppercase tracking-normal text-black transition-colors hover:border-black hover:bg-black/5"
          >
            {labels.continueLabel}
          </button>
        )}
      </div>
    </GlassPanel>
  );
}
