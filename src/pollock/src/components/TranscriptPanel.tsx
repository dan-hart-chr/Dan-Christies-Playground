import GlassPanel from './GlassPanel';
import transcripts, {
  ARTIST_NAME,
  ARTIST_DATES,
  ARTWORK_TITLE,
} from '../data/transcripts';

interface TranscriptPanelProps {
  onClose: () => void;
  lang: string;
}

export default function TranscriptPanel({ onClose, lang }: TranscriptPanelProps) {
  const paragraphs = transcripts[lang] ?? transcripts.en;

  return (
    <GlassPanel
      onClose={onClose}
      position="right"
      className="h-[532px] w-[358px]"
    >
      <div className="flex flex-1 flex-col overflow-hidden px-2 py-1">
        <div className="mb-2.5 shrink-0 border-b border-black/20 pb-2.5">
          <h3 className="font-serif text-[20px] font-light leading-[1.15] text-black">
            {ARTIST_NAME}
            <br />
            <span className="whitespace-nowrap">{ARTIST_DATES}</span>
          </h3>
          <p className="mt-1.5 font-sans text-[13px] font-light italic leading-[1.3] text-black/80">
            {ARTWORK_TITLE}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto pr-3 text-[14px] font-light leading-[1.4] text-black">
          {paragraphs.map((text, i) => (
            <p key={i} className={i < paragraphs.length - 1 ? 'mb-3' : ''}>
              {text}
            </p>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
