/**
 * 「学ぶ」: ゼロから分かる土台レッスン（理論を“読ませず”指板で繋ぐ）。
 * 各レッスン = 平易な説明 + 具体例 + 関連の「見る/練習する」導線。
 * 網羅はしない。このアプリの練習が使う概念だけを順に。
 */
export interface LessonLink {
  label: string;
  /** 理論サブタブ key（map/scale/caged/voicing/open/diatonic/arpeggio）または 'practice-chord' / 'practice-prog' */
  target: string;
}

export interface Lesson {
  id: string;
  title: string;
  body: string[];
  example?: string;
  link?: LessonLink;
  /** 指板で「見て分かる」実演（root からの度数を光らせる） */
  demo?: { root: string; tones: { st: number; label: string }[]; maxFret?: number };
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
    link: { label: '進行モードで弾いてみる', target: 'practice-prog' },
  },
];
