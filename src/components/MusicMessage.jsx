import { useState } from "react";

export default function MusicMessage({ title, youtubeId, duration = "—" }) {
  const [playing, setPlaying] = useState(false);

  const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  return (
    <div className="flex items-center gap-3 bg-[#1f2937] rounded-2xl p-3 max-w-xs shadow-sm">
      
      {/* Thumbnail with Play/Stop overlay */}
<div className="relative flex-shrink-0 w-14 h-14">
  <img
    src={thumbnail}
    alt={title}
    className="w-full h-full rounded-full object-cover"
  />

  {/* Dark overlay */}
  <div className="absolute inset-0 bg-black/40 rounded-full" />

  {/* Play / Stop button */}
  <button
    onClick={() => setPlaying(!playing)}
    className="
      absolute inset-0 
      flex items-center justify-center
      text-white text-lg
      focus:outline-none
    "
  >
    {playing ? "⏹" : "▶️"}
  </button>
</div>


      {/* Info */}
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-semibold text-white truncate">
          {title}
        </p>
        <p className="text-xs text-gray-400">
          YouTube Music
        </p>

      </div>

      {/* Duration */}
      <div className="text-xs text-gray-400 whitespace-nowrap">
        {duration}
      </div>

      {/* Hidden YouTube player */}
      {playing && (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          allow="autoplay"
          style={{ display: "none" }}
        />
      )}
    </div>
  );
}
