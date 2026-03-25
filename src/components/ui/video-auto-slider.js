import React from 'react';

export const VideoAutoSlider = ({ videos, onVideoClick }) => {
  // Duplicate videos for seamless loop
  const duplicatedVideos = [...videos, ...videos];

  return (
    <div className="w-full bg-transparent relative overflow-hidden flex items-center justify-center py-4">
      <style>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll {
          animation: scroll-right 30s linear infinite;
        }


        .infinite-scroll:hover {
          animation-play-state: paused;
        }

        .scroll-container {
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .video-item {
          transition: transform 0.3s ease, filter 0.3s ease, box-shadow 0.3s ease;
        }

        .video-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
          box-shadow: 0 20px 25px -5px var(--primary-soft), 0 10px 10px -5px var(--primary-soft);
        }
      `}</style>

      {/* Scrolling videos container */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <div className="scroll-container w-full">
          <div className="infinite-scroll flex gap-6 w-max px-4">
            {duplicatedVideos.map((video, index) => (
              <div
                key={`${video.id}-${index}`}
                className="video-item flex-shrink-0 w-64 md:w-80 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg cursor-pointer border border-slate-200 dark:border-slate-800"
                onClick={() => onVideoClick(video)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-primary shadow-xl">
                      ▶
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full"
                      style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
                    >
                      YouTube Lesson
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1 group-hover:text-[var(--primary)] transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {video.channel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
