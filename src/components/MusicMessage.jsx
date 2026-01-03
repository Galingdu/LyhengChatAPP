import { useEffect, useState } from "react";
import { Play, Square } from "lucide-react";


export default function MusicMessage({ title, youtubeId, duration = "—" }) {
  const [playing, setPlaying] = useState(false);

  const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handlePlay = () => {
    if (isIOS()) {
      const key = "ios_youtube_notice_shown";
      if (!localStorage.getItem(key)) {
        alert("📱 iPhone users: Open YouTube to hear this song.");
        localStorage.setItem(key, "true");
      }
      return;
    }

    // 🔔 Notify others
    window.dispatchEvent(
      new CustomEvent("music-play", { detail: youtubeId })
    );

    setPlaying(true);
  };

  const handleStop = () => {
    setPlaying(false);
  };

  // 🧠 Listen for other songs playing
  useEffect(() => {
    const onOtherPlay = (e) => {
      if (e.detail !== youtubeId) {
        setPlaying(false);
      }
    };

    window.addEventListener("music-play", onOtherPlay);
    return () => window.removeEventListener("music-play", onOtherPlay);
  }, [youtubeId]);

  return (
    <div className="flex items-center gap-3 bg-[#1f2937] rounded-2xl p-3 max-w-xs">
      
      {/* Thumbnail */}
      <div className="relative w-14 h-14 flex-shrink-0">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full rounded-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 rounded-full" />

     

        <button
  onClick={playing ? handleStop : handlePlay}
  className="
    absolute inset-0 
    flex items-center justify-center 
    text-gray-400
  "
>
  {playing ? (
    <Square className="text-white" size={22} strokeWidth={2.5} />
  ) : (
    <Play  size={22} strokeWidth={2.5} />
  )}
</button>

      </div>

      {/* Info */}
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-semibold text-white truncate">
          {title}
        </p>
        <p className="text-xs text-gray-400">YouTube Music</p>
      </div>

      {/* Duration */}
      <div className="text-xs text-gray-400 whitespace-nowrap">
        {duration}
      </div>

      {/* Hidden Player */}
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
