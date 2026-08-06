import { useState, useEffect, useMemo } from 'react';
import { useQcfFont } from '@/hooks/useQcfFont';
import { MushafLayoutService, type MushafWord } from '@/services/MushafLayoutService';

interface QcfVerseProps {
  verseKey: string;
  pageNumber: number;
  wordStart?: number;
  wordEnd?: number;
  className?: string;
  style?: React.CSSProperties;
  showOrnaments?: boolean;
}

export default function QcfVerse({
  verseKey,
  pageNumber,
  wordStart = 1,
  wordEnd = 999,
  className = '',
  style = {},
  showOrnaments = true,
}: QcfVerseProps) {
  const [words, setWords] = useState<MushafWord[]>([]);
  const [loading, setLoading] = useState(true);
  const isFontLoaded = useQcfFont(pageNumber);

  useEffect(() => {
    let mounted = true;

    const loadWords = async () => {
      setLoading(true);
      try {
        const page = await MushafLayoutService.getPage(pageNumber);
        if (!mounted || !page) {
          setLoading(false);
          return;
        }

        const collected: MushafWord[] = [];
        for (const line of page.lines) {
          if (line.type === 'text' && line.words) {
            for (const w of line.words) {
              const parts = w.location.split(':');
              if (parts.length >= 3) {
                const wordVerseKey = `${parts[0]}:${parts[1]}`;
                const wordPosition = parseInt(parts[2], 10);
                if (wordVerseKey === verseKey && wordPosition >= wordStart && wordPosition <= wordEnd) {
                  collected.push(w);
                }
              }
            }
          }
        }
        if (mounted) setWords(collected);
      } catch (err) {
        console.error('QcfVerse load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadWords();
    return () => { mounted = false; };
  }, [verseKey, pageNumber, wordStart, wordEnd]);

  const fontFamily = useMemo(
    () => `QCF_P${String(pageNumber).padStart(3, '0')}`,
    [pageNumber]
  );

  if (loading || !isFontLoaded || words.length === 0) {
    return (
      <span
        className={className}
        style={{
          ...style,
          fontFamily: '"Amiri", "Cairo", serif',
          direction: 'rtl',
        }}
      >
        {showOrnaments ? '﴿ ' : ''}
        {words.map(w => w.word.replace(/\s*\d+\s*$/, '').replace(/[\u0660-\u0669]/g, '').trim()).join(' ')}
        {showOrnaments ? ' ﴾' : ''}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        ...style,
        fontFamily,
        direction: 'rtl',
        whiteSpace: 'nowrap',
        letterSpacing: 0,
      }}
    >
      {showOrnaments && <span style={{ marginLeft: '0.3em', opacity: 0.6 }}>﴿</span>}
      {words.map((word, idx) => (
        <span key={idx} style={{ display: 'inline-block', margin: '0 0.05em' }}>
          {word.qpcV2}
        </span>
      ))}
      {showOrnaments && <span style={{ marginRight: '0.3em', opacity: 0.6 }}>﴾</span>}
    </span>
  );
}
