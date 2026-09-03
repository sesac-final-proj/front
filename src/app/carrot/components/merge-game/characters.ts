const svg = (body: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`)}`;

function face(color: string, expression = "smile") {
  return `<g fill="${color}" stroke="${color}" stroke-width="2.8">
    <ellipse cx="45" cy="64" rx="2.4" ry="3.5" stroke="none"/>
    <ellipse cx="75" cy="64" rx="2.4" ry="3.5" stroke="none"/>
    ${expression === "happy" ? '<path d="M54 72 Q60 84 66 72 Z" fill="#ef8c8c"/>' : expression === "sleepy" ? '<path d="M56 76 Q60 72 64 76" fill="none"/>' : '<path d="M55 74 Q60 81 65 74" fill="none"/>'}
  </g><g fill="#f79891" opacity=".65"><ellipse cx="34" cy="73" rx="6" ry="3.4"/><ellipse cx="86" cy="73" rx="6" ry="3.4"/></g>`;
}

const art = [
  `<path d="M62 12 C96 10 113 34 108 68 C104 103 81 111 49 107 C18 104 6 80 13 53 C17 39 35 45 39 32 C41 20 48 13 62 12Z" fill="#e6cb8d" stroke="#8c703f" stroke-width="3"/>
   <path d="M26 56 Q39 64 30 78" fill="none" stroke="#ad8a52" stroke-width="5"/>
   <path d="M62 22 Q79 20 86 29" fill="none" stroke="#fff0c8" stroke-width="6"/>${face("#654c32", "sleepy")}`,
  `<path d="M61 18 C83 12 111 32 109 64 C108 95 90 109 60 109 C26 109 11 92 11 64 C9 35 34 13 61 18Z" fill="#f36758" stroke="#b83c37" stroke-width="3"/>
   <path d="M60 27 L35 30 L45 20 L36 13 L54 17 L62 5 L68 18 L87 16 L77 25 L87 33 L66 29 L60 41Z" fill="#538947" stroke="#3c6736" stroke-width="2.5"/>
   <path d="M26 47 L23 55" stroke="#ffb1a0" stroke-width="7"/>${face("#7b2e2b")}`,
  `<path d="M40 26 C71 10 106 36 106 67 C105 94 78 110 49 108 C16 105 7 83 15 61 C21 48 27 37 40 26Z" fill="#ffab4d" stroke="#c67131" stroke-width="3"/>
   <path d="M45 29 Q23 13 32 8 Q45 6 53 23 Q50 0 61 5 Q73 9 62 27 Q79 11 86 19 Q85 30 62 35Z" fill="#6eaa50" stroke="#4a7636" stroke-width="2.5"/>
   <path d="M21 65 L34 69 M23 86 L33 87 M87 42 L98 45" fill="none" stroke="#d6833c" stroke-width="3"/>${face("#80461e", "happy")}`,
  `<path d="M60 8 C85 7 98 34 96 68 C95 97 81 109 60 110 C38 109 24 94 24 67 C23 30 36 8 60 8Z" fill="#f8d450" stroke="#b39a36" stroke-width="3"/>
   <path d="M47 17 Q39 38 42 51 M62 15 L62 49 M76 21 Q83 37 80 49 M33 31 L86 31 M29 44 L91 44 M31 88 L88 88" fill="none" stroke="#dcaf37" stroke-width="2"/>
   <path d="M59 110 Q9 101 10 51 Q34 59 48 95 M60 110 Q109 99 110 50 Q88 58 73 95" fill="#79b967" stroke="#4f8345" stroke-width="3"/>${face("#766026")}`,
  `<path d="M59 25 C76 9 103 20 109 47 C118 78 100 107 79 105 Q61 113 42 105 C17 108 3 78 12 48 C18 19 43 11 59 25Z" fill="#8acb69" stroke="#4e883f" stroke-width="3"/>
   <path d="M56 25 Q52 12 66 8 L72 13 Q62 17 65 26" fill="#5b8b40" stroke="#4b7336" stroke-width="3"/>
   <path d="M32 35 Q24 45 25 54 M40 91 L42 102 M80 92 L78 102" fill="none" stroke="#b5e597" stroke-width="4"/>${face("#3d6532", "happy")}`,
  `<path d="M61 23 C87 9 112 31 109 65 C118 100 91 114 61 105 C28 116 5 97 11 65 C7 35 29 9 61 23Z" fill="#f6ad59" stroke="#b97133" stroke-width="3"/>
   <path d="M45 26 Q20 56 41 101 M77 25 Q99 61 79 102" fill="none" stroke="#d58a3d" stroke-width="3"/>
   <path d="M55 27 L55 12 L68 7 L70 14 L65 28Z" fill="#7c9954" stroke="#526d38" stroke-width="3"/>${face("#805128", "sleepy")}`,
  `<path d="M61 23 C83 12 108 39 108 68 C111 94 91 110 60 110 C28 110 10 97 12 69 C14 39 34 16 61 23Z" fill="#9570b8" stroke="#634784" stroke-width="3"/>
   <path d="M31 32 L43 22 L37 16 L54 19 Q49 7 60 6 L66 9 L63 21 L83 17 L77 27 L90 35 L69 34 L61 46 L53 34Z" fill="#74aa64" stroke="#4d7946" stroke-width="2.5"/>
   <path d="M25 52 Q21 62 23 66" fill="none" stroke="#c5a8dd" stroke-width="6"/>${face("#392847", "happy")}`,
  `<path d="M61 25 C85 15 110 39 108 70 C110 96 90 110 60 110 C29 110 9 96 12 67 C14 40 34 20 61 25Z" fill="#f4cd4e" stroke="#a6872f" stroke-width="3"/>
   <path d="M35 32 L31 9 L48 20 L61 5 L73 20 L91 9 L85 33Z" fill="#ffe77d" stroke="#a6872f" stroke-width="3"/>
   <path d="M49 32 L61 44 L73 32" fill="#8bac5a" stroke="#64843d" stroke-width="2"/>
   <path d="M25 50 L23 58" stroke="#fff1b1" stroke-width="6"/>${face("#786123", "happy")}`,
];

export const VEGETABLES = [
  { name: "콩", radius: 16, score: 2, color: "#e6cb8d" },
  { name: "토마토", radius: 21, score: 5, color: "#f36758" },
  { name: "당근", radius: 27, score: 10, color: "#ffab4d" },
  { name: "옥수수", radius: 34, score: 18, color: "#f8d450" },
  { name: "파프리카", radius: 42, score: 30, color: "#8acb69" },
  { name: "호박", radius: 51, score: 50, color: "#f6ad59" },
  { name: "꿈가지", radius: 62, score: 80, color: "#9570b8" },
  { name: "황금가지", radius: 75, score: 130, color: "#f4cd4e" },
].map((vegetable, index) => ({ ...vegetable, image: svg(art[index]) }));
