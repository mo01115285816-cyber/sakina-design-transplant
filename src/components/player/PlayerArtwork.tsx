import React from 'react';

interface Props {
  photoUrl: string | null;
  surahName: string;
  reciterName: string;
}

export function PlayerArtwork({ photoUrl, surahName, reciterName }: Props) {
  return (
    <div className="flex flex-col items-center mt-12 z-0">
      {/* Reciter Image */}
      <div className="relative w-48 h-48 mb-6">
        {/* Animated teal ring around the image */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-quranify-accent-primary/40 to-quranify-accent-secondary/40 blur-xl animate-pulse" />
        <div className="absolute inset-0 rounded-full border-2 border-quranify-accent-primary/30" />
        {/* The image itself */}
        <img 
          src={photoUrl || "/images/quran_artwork.jpg"} 
          className="relative w-full h-full rounded-full object-cover shadow-2xl"
          alt={reciterName}
          onError={(e) => {
            e.currentTarget.src = "/images/quran_artwork.jpg";
          }}
        />
      </div>
      
      {/* Surah Name */}
      <h1 className="text-[38px] font-quran text-quranify-text-primary text-center mb-2 leading-none">
        {surahName}
      </h1>
      
      {/* Reciter Name */}
      <p className="text-[15px] font-bold text-quranify-text-secondary font-heading tracking-wide">
        {reciterName}
      </p>
    </div>
  );
}
