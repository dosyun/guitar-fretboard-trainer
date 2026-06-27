/**
 * 「学ぶ」: ゼロから分かる土台コース（インプット → 確認 → 次へ）。
 * 各レッスン = 入力コンテンツ(説明+例+指板実演) + 理解度チェック(数問) + 関連練習への導線。
 * 理論を“読ませて終わり”にせず、見て・確かめて・練習に繋ぐ。
 */
export interface LessonLink {
  label: string;
  /** 理論サブタブ key、または 'practice-chord' / 'practice-prog' */
  target: string;
}

export interface LessonCheckQ {
  q: string;
  choices: string[];
  answer: number; // 正解の choices インデックス
  why?: string;
}

export interface Lesson {
  id: string;
  title: string;
  body: string[];
  example?: string;
  /** 指板で「見て分かる」実演（root からの度数を光らせる） */
  demo?: { root: string; tones: { st: number; label: string }[]; maxFret?: number };
  /** 理解度チェック（その場で確かめる） */
  check?: LessonCheckQ[];
  link?: LessonLink;
}

export const LESSONS: Lesson[] = [
  {
    id: 'notes',
    title: '音名と半音・全音',
    body: [
      'ギターは1フレット動くと「半音」上がる。2フレットで「全音」。',
      '音名は C C# D D# E F F# G G# A A# B の12個で一周（オクターブ）。',
      'ポイント: E→F と B→C の間だけは半音（間に # が無い）。ここが全ての土台。',
    ],
    example: 'C →半音→ C# →半音→ D … B →半音→ C（1オクターブ上）',
    check: [
      { q: 'E の半音上の音は？', choices: ['F', 'F#', 'D#'], answer: 0, why: 'E→F は半音（間に#が無い）。' },
      { q: '音名は1オクターブで何個？', choices: ['7', '8', '12'], answer: 2, why: 'C C# D … B の12個。' },
    ],
    link: { label: '指板マップで全音名を見る', target: 'map' },
  },
  {
    id: 'degree',
    title: '度数（インターバル）',
    body: [
      '度数は「基準の音(ルート)から何半音離れているか」のラベル。',
      '同じ度数はどのキーでも同じ響き。だから度数で覚えると12キー全部に効く。',
      'R=ルート、M3=長3度(半音4つ)、P5=完全5度(半音7つ) など。',
    ],
    example: 'Cをルートにすると E=M3(半音4) / G=P5(半音7)',
    demo: { root: 'C', tones: [{ st: 0, label: 'R' }, { st: 4, label: 'M3' }, { st: 7, label: 'P5' }] },
    check: [
      { q: 'ルートから半音4つの度数は？', choices: ['m3', 'M3', 'P4'], answer: 1, why: '半音4＝長3度(M3)。明るい3度。' },
      { q: 'P5（完全5度）は半音いくつ？', choices: ['5', '7', '8'], answer: 1, why: '半音7。とても安定した響き。' },
    ],
    link: { label: '指板マップの「度数」モードで見る', target: 'map' },
  },
  {
    id: 'major-scale',
    title: 'メジャースケール',
    body: [
      '明るい「ドレミファソラシド」。全全半全全全半 の間隔で並ぶ7音。',
      'この7音がキーの“地図”になり、コードもメロディもここから生まれる。',
    ],
    example: 'Cメジャー: C D E F G A B（ピアノの白鍵だけ）',
    demo: {
      root: 'C',
      tones: [
        { st: 0, label: 'R' }, { st: 2, label: '2' }, { st: 4, label: '3' }, { st: 5, label: '4' },
        { st: 7, label: '5' }, { st: 9, label: '6' }, { st: 11, label: '7' },
      ],
    },
    check: [
      { q: 'Cメジャーに含まれない音は？', choices: ['F', 'F#', 'A'], answer: 1, why: 'Cメジャー=C D E F G A B。F#は含まない。' },
      { q: 'メジャースケールの間隔は？', choices: ['全全半全全全半', '全半全全半全全'], answer: 0, why: '全全半全全全半。' },
    ],
    link: { label: 'スケールを指板で見る', target: 'scale' },
  },
  {
    id: 'triad',
    title: 'トライアド（3和音）',
    body: [
      'コードの基本。スケールの音を1個飛ばしで3つ積む＝ R・3・5。',
      '3度が長い(明るい=メジャー)か短い(暗い=マイナー)かで色が決まる。',
    ],
    example: 'C = C(R) E(3) G(5) / Cm = C E♭ G',
    demo: { root: 'C', tones: [{ st: 0, label: 'R' }, { st: 4, label: '3' }, { st: 7, label: '5' }] },
    check: [
      { q: 'メジャートライアドの構成は？', choices: ['R ♭3 5', 'R 3 5', 'R 3 ♭5'], answer: 1, why: '長3度＝メジャー(明るい)。' },
      { q: 'C メジャーの3度の音は？', choices: ['E♭', 'E', 'G'], answer: 1, why: 'Cから長3度＝E。' },
    ],
    link: { label: 'オープンコードで押さえ方を見る', target: 'open' },
  },
  {
    id: '7th',
    title: '7thコード',
    body: [
      'トライアドにもう1つ3度を積んで4音にしたもの＝ R・3・5・7。',
      'ジャズ/ポップスの土台。7の種類で maj7 / 7 / m7 などの色が変わる。',
    ],
    example: 'Cmaj7=C E G B / C7=C E G B♭ / Dm7=D F A C',
    demo: {
      root: 'C',
      tones: [{ st: 0, label: 'R' }, { st: 4, label: '3' }, { st: 7, label: '5' }, { st: 11, label: '7' }],
    },
    check: [
      { q: 'Dm7 の構成音は？', choices: ['D F A C', 'D F# A C', 'D F A B'], answer: 0, why: 'R ♭3 5 ♭7 ＝ D F A C。' },
      { q: '7thコードは何音？', choices: ['3', '4', '5'], answer: 1, why: 'トライアド3音 + 7th ＝ 4音。' },
    ],
    link: { label: 'コードトーンを指板で探す練習へ', target: 'practice-chord' },
  },
  {
    id: 'diatonic',
    title: 'ダイアトニックコード',
    body: [
      'キーのメジャースケールの音「だけ」で積んだ7つのコード。',
      'そのキーで“使えるコード”の基本セット。曲はだいたいこの中で動く。',
    ],
    example: 'Key C: I=C IIm=Dm IIIm=Em IV=F V=G VIm=Am VIIm♭5=Bm♭5',
    check: [
      { q: 'Key C の V のコードは？', choices: ['F', 'G', 'Am'], answer: 1, why: 'スケール5番目のG。' },
      { q: 'Key C のダイアトニックに無いのは？', choices: ['Dm', 'D', 'Em'], answer: 1, why: 'D(メジャー)はF#を含むので圏外。Dmが正しい。' },
    ],
    link: { label: 'ダイアトニックコード一覧を見る', target: 'diatonic' },
  },
  {
    id: 'ii-v-i',
    title: 'ii-V-I（最重要の進行）',
    body: [
      'ダイアトニックの ii → V → I（例: Dm7 → G7 → Cmaj7）。',
      '緊張(V)→解決(I) の流れが強く、ジャズ/ポップスに頻出。',
      'コードトーンを繋げて弾けると、暗記が一気に“演奏”になる。',
    ],
    example: 'Key C: Dm7 → G7 → Cmaj7',
    check: [
      { q: 'Key C の ii-V-I は？', choices: ['Dm7-G7-Cmaj7', 'Em7-A7-Dmaj7', 'Am7-D7-Gmaj7'], answer: 0, why: 'ii=Dm7, V=G7, I=Cmaj7。' },
      { q: 'V→I の流れは？', choices: ['緊張→解決', '解決→緊張'], answer: 0, why: 'V(緊張)からI(解決)へ。これが進行の推進力。' },
    ],
    link: { label: '進行モードで弾いてみる', target: 'practice-prog' },
  },
];
