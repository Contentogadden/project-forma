export default function RenaissanceArt({ src = '/art-concert.jpeg' }: { src?: string }) {
  return (
    <figure className="hero-figure renaissance-art">
      <img
        src={src}
        onError={(e) => {
          e.currentTarget.src = '/art-concert.jpeg';
        }}
        alt="Репродукция из художественной коллекции Forma"
        fetchPriority="high"
      />
      <svg className="art-waves" viewBox="0 0 1000 400" fill="none" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <path
            key={i}
            d={`M-30 ${220 + i * 15} C180 ${220 + i * 15},220 ${60 + i * 15},440 ${120 + i * 15} S700 ${350 + i * 15},1050 ${140 + i * 15}`}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}
        {[260, 470, 670, 850].map((x, i) => (
          <g key={x} transform={`translate(${x} ${[150, 140, 260, 230][i]})`}>
            <ellipse rx="8" ry="5" transform="rotate(-20)" fill="currentColor" />
            <path d="M7 0V-40" stroke="currentColor" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="art-grid" aria-hidden="true" />
    </figure>
  );
}
