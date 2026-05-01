import { type ReactNode, useEffect, useState, useCallback } from 'react';
import CloseIcon from './CloseIcon';

interface GlassPanelProps {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  position?: 'center' | 'right';
  hideClose?: boolean;
  disableBackdropClose?: boolean;
  /**
   * When true, run the exit animation and call onClose after it finishes.
   * Lets a parent drive the fade-out (e.g. for a forced intro flow where
   * picking a language transitions to the next panel without the user
   * clicking the × or the backdrop).
   */
  closing?: boolean;
}

export default function GlassPanel({
  children,
  onClose,
  className = '',
  position = 'center',
  hideClose = false,
  disableBackdropClose = false,
  closing = false,
}: GlassPanelProps) {
  const [visible, setVisible] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 350);
  }, [onClose]);

  // Parent-driven fade-out
  useEffect(() => {
    if (!closing) return;
    let closeTimeout: ReturnType<typeof setTimeout> | null = null;
    const frameId = requestAnimationFrame(() => {
      setVisible(false);
      closeTimeout = setTimeout(onClose, 350);
    });
    return () => {
      cancelAnimationFrame(frameId);
      if (closeTimeout) clearTimeout(closeTimeout);
    };
  }, [closing, onClose]);

  useEffect(() => {
    if (disableBackdropClose) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose, disableBackdropClose]);

  const positionClasses =
    position === 'right'
      ? 'items-center justify-center md:items-center md:justify-end md:pr-12'
      : 'items-center justify-center';

  return (
    <div
      className={`absolute inset-0 z-50 flex transition-opacity duration-350 ease-out ${positionClasses} ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={disableBackdropClose ? undefined : handleClose}
      />

      {/* Panel */}
      <div
        className={`relative flex flex-col gap-1 rounded-[20px] bg-[rgba(244,244,244,0.7)] px-3 pb-7 pt-4 shadow-[0px_4px_68px_0px_rgba(255,255,255,0.25)] backdrop-blur-[20px] transition-all duration-350 ease-out ${
          visible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-4 scale-[0.97] opacity-0'
        } ${className}`}
      >
        {/* Close button (preserves spacing even when hidden) */}
        <div className="flex min-h-[23px] w-full justify-end p-1">
          {!hideClose && (
            <button
              onClick={handleClose}
              className="flex size-[15px] cursor-pointer items-center justify-center text-black/60 transition-colors hover:text-black"
              aria-label="Close"
              data-analytics="glassPanelCloseButton"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
