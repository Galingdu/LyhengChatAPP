import { useState } from "react";

export default function MusicPlayer({ youtubeId, title }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="bg-white rounded-xl p-3 shadow w-full max-w-sm">
      <p className="text-sm text-gray-500 font-semibold mb-2">🎵 {title}</p>

      {!playing ? (
        <button
          onClick={() => setPlaying(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm"
        >
          ▶️ Play
        </button>
      ) : (
        <>
          <iframe
            width="0"
            height="0"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            allow="autoplay"
            style={{ display: "none" }}
          />
          <button
            onClick={() => setPlaying(false)}
            className="bg-red-500 text-white px-4 py-2 rounded-full text-sm"
          >
            ⏹ Stop
          </button>
        </>
      )}
    </div>
  );
}
