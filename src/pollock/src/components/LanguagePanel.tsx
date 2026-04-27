import GlassPanel from './GlassPanel';

const LANGUAGES = [
  { code: 'en', label: 'ENGLISH' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
];

interface LanguagePanelProps {
  onClose: () => void;
  currentLang?: string;
  onSelect?: (code: string) => void;
  hideClose?: boolean;
  disableBackdropClose?: boolean;
  closing?: boolean;
}

export default function LanguagePanel({
  onClose,
  currentLang = 'en',
  onSelect,
  hideClose = false,
  disableBackdropClose = false,
  closing = false,
}: LanguagePanelProps) {
  return (
    <GlassPanel
      onClose={onClose}
      className="h-[403px] w-[358px]"
      hideClose={hideClose}
      disableBackdropClose={disableBackdropClose}
      closing={closing}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onSelect?.(lang.code)}
            data-analytics={`language:${lang.code}`}
            className={`cursor-pointer px-1 py-1 text-[14px] font-light uppercase leading-[1.2] text-black transition-opacity hover:opacity-70 ${
              lang.code === currentLang
                ? 'border-b border-black'
                : ''
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}
