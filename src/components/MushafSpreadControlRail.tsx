import React from 'react';
import {
  Bookmark,
  BookOpen,
  Copy,
  Image as ImageIcon,
  Palette,
  Pause,
  Play,
  Settings,
} from 'lucide-react';
import type { MushafControlLayout } from '@/services/MushafSpreadPlanner';

interface SelectedVerse {
  verseKey: string;
  text: string;
}

interface Props {
  layout: MushafControlLayout | null;
  showControls: boolean;
  showActionCard: boolean;
  selectedVerse: SelectedVerse | null;
  isPlaying: boolean;
  playMode: 'single' | 'page' | 'continuous';
  showReciterModal: boolean;
  isVerseBookmarked: boolean;
  primaryTextClassName: string;
  onToggleSettings: () => void;
  onTogglePlay: () => void;
  onShowReciter: () => void;
  onToggleAudioSettings: () => void;
  onStopPlayer: () => void;
  onPlaySelected: () => void;
  onShowTafsir: () => void;
  onShowReflection: () => void;
  onCopySelected: (text: string) => void;
  onToggleVerseBookmark: () => void;
}

function RailButton({
  children,
  title,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      title={title}
      className={`mushaf-spread-rail-button ${active ? 'mushaf-spread-rail-button--active' : ''}`}
    >
      {children}
    </button>
  );
}

/**
 * The rail exists only when the adaptive planner selected the side-rail
 * composition. It consumes horizontal spare area and never overlays a QCF page.
 */
export default function MushafSpreadControlRail({
  layout,
  showControls,
  showActionCard,
  selectedVerse,
  isPlaying,
  playMode,
  showReciterModal,
  isVerseBookmarked,
  primaryTextClassName,
  onToggleSettings,
  onTogglePlay,
  onShowReciter,
  onToggleAudioSettings,
  onStopPlayer,
  onPlaySelected,
  onShowTafsir,
  onShowReflection,
  onCopySelected,
  onToggleVerseBookmark,
}: Props) {
  if (layout?.mode !== 'side-rail' || !layout.sideRail) return null;

  const railStyle = {
    left: `${layout.sideRail.left}px`,
    top: `${layout.sideRail.top}px`,
    width: `${layout.sideRail.width}px`,
    height: `${layout.sideRail.height}px`,
  };

  const isActionRail = Boolean(showActionCard && selectedVerse);
  const isSinglePlayerRail = isPlaying && playMode === 'single' && !showReciterModal;

  if (!isActionRail && !isSinglePlayerRail && !showControls) return null;

  return (
    <div className="mushaf-spread-side-rail" style={railStyle} aria-label="عناصر تحكم قارئ المصحف">
      <div className={`mushaf-spread-side-rail__card cut-crystal-capsule ${primaryTextClassName}`} dir="ltr">
        {isActionRail && selectedVerse ? (
          <>
            <RailButton title="تلاوة" onClick={onPlaySelected} active>
              <Play size={18} fill="currentColor" />
            </RailButton>
            <RailButton title="تفسير" onClick={onShowTafsir}>
              <BookOpen size={18} />
            </RailButton>
            <RailButton title="بطاقة تدبر" onClick={onShowReflection}>
              <ImageIcon size={18} />
            </RailButton>
            <RailButton title="نسخ" onClick={() => onCopySelected(selectedVerse.text)}>
              <Copy size={18} />
            </RailButton>
            <RailButton title="حفظ العلامة المرجعية" onClick={onToggleVerseBookmark} active={isVerseBookmarked}>
              <Bookmark size={18} fill={isVerseBookmarked ? 'currentColor' : 'none'} />
            </RailButton>
          </>
        ) : isSinglePlayerRail ? (
          <>
            <RailButton title="القارئ" onClick={onShowReciter}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </RailButton>
            <RailButton title="إيقاف" onClick={onStopPlayer} active>
              <span className="mushaf-spread-rail-stop" />
            </RailButton>
            <RailButton title="إعدادات التكرار" onClick={onToggleAudioSettings}>
              <Settings size={18} />
            </RailButton>
          </>
        ) : (
          <>
            <RailButton title="السمات والألوان" onClick={onToggleSettings}>
              <Palette size={18} />
            </RailButton>
            <RailButton title={isPlaying && playMode === 'continuous' ? 'إيقاف مؤقت' : 'تشغيل'} onClick={onTogglePlay} active>
              {isPlaying && playMode === 'continuous' ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </RailButton>
            <RailButton title="القارئ" onClick={onShowReciter}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </RailButton>
          </>
        )}
      </div>
    </div>
  );
}
