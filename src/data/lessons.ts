/**
 * 「学ぶ」: ゼロから分かる音楽理論コース（インプット → 確認 → 練習）。
 * 各レッスン = 説明+例+指板実演(入力) → 理解度チェック(確認) → 練習への導線。
 * 章(chapter)で段階化。理論を“読ませて終わり”にせず、見て・確かめて練習に繋ぐ。
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
  chapter: string;
  title: string;
  body: string[];
  example?: string;
  /** 指板で「見て分かる」実演（root からの度数を光らせる） */
  demo?: { root: string; tones: { st: number; label: string }[]; maxFret?: number };
  /** 理解度チェック（その場で確かめる） */
  check?: LessonCheckQ[];
  link?: LessonLink;
}

const CH1 = '1. 音と度数';
const CH2 = '2. スケール';
const CH3 = '3. コード';
const CH4 = '4. キーと進行';
const CH5 = '5. コード機能と発展';
const CH6 = '6. 響きの拡張';
const CH7 = '7. 上級テクニック';

export type LessonLevel = '初級' | '中級' | '上級';
/** 章 → レベル（一覧/レッスンのバッジ用）。 */
export const CHAPTER_LEVEL: Record<string, LessonLevel> = {
  [CH1]: '初級', [CH2]: '初級', [CH3]: '初級', [CH4]: '初級',
  [CH5]: '中級', [CH6]: '中級',
  [CH7]: '上級',
};

export const LESSONS: Lesson[] = [
  {
    id: 'notes',
    chapter: CH1,
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
    id: 'octave',
    chapter: CH1,
    title: 'オクターブ（同じ音を探す）',
    body: [
      '同じ音は指板の色々な場所にある。覚えるのは1つでも、形で芋づる式に見つかる。',
      '定番の形: そこから「2本細い弦へ移って、2フレット上」が1オクターブ上の同じ音。',
      'これを知ると、1つ場所を覚えれば指板全体に展開できる。',
    ],
    example: '6弦5F(A) のオクターブ上 = 4弦7F(A)',
    demo: { root: 'C', tones: [{ st: 0, label: 'R' }], maxFret: 12 },
    check: [
      {
        q: 'オクターブ上の定番の形は？',
        choices: ['2本細い弦・2フレット上', '1本細い弦・同フレット', '同じ弦・5フレット上'],
        answer: 0,
        why: '例: 6弦5F(A)→4弦7F(A)。',
      },
      { q: 'オクターブは何度？', choices: ['完全8度', '完全5度'], answer: 0, why: '1オクターブ＝完全8度。' },
    ],
    link: { label: '指板マップで同じ音の位置を見る', target: 'map' },
  },
  {
    id: 'degree',
    chapter: CH1,
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
    chapter: CH2,
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
    id: 'minor-scale',
    chapter: CH2,
    title: 'マイナースケール',
    body: [
      '暗い響きのスケール（ナチュラルマイナー）。間隔は 全半全全半全全。',
      'メジャーの6番目の音から始めた並びと同じ（平行調）。だから使う音はメジャーと共通。',
    ],
    example: 'Aマイナー: A B C D E F G（Cメジャーと同じ音）',
    demo: {
      root: 'A',
      tones: [
        { st: 0, label: 'R' }, { st: 2, label: '2' }, { st: 3, label: '♭3' }, { st: 5, label: '4' },
        { st: 7, label: '5' }, { st: 8, label: '♭6' }, { st: 10, label: '♭7' },
      ],
    },
    check: [
      { q: 'ナチュラルマイナーの間隔は？', choices: ['全半全全半全全', '全全半全全全半'], answer: 0, why: '全半全全半全全。' },
      { q: 'A マイナーと同じ音のメジャーキーは？', choices: ['C', 'G', 'F'], answer: 0, why: 'Aマイナー=Cメジャー（平行調）。' },
    ],
    link: { label: 'スケールを指板で見る', target: 'scale' },
  },
  {
    id: 'pentatonic',
    chapter: CH2,
    title: 'ペンタトニック',
    body: [
      '5音だけのスケール。ロック/ブルースのソロの定番で、外れにくく弾きやすい。',
      'マイナーペンタ = R ♭3 4 5 ♭7 の5音。最初のアドリブに最適。',
    ],
    example: 'Aマイナーペンタ: A C D E G',
    demo: {
      root: 'A',
      tones: [
        { st: 0, label: 'R' }, { st: 3, label: '♭3' }, { st: 5, label: '4' }, { st: 7, label: '5' }, { st: 10, label: '♭7' },
      ],
      maxFret: 12,
    },
    check: [
      { q: 'マイナーペンタは何音？', choices: ['5', '6', '7'], answer: 0, why: 'R ♭3 4 5 ♭7 の5音。' },
      { q: 'マイナーペンタに含まれないのは？', choices: ['2', '♭3', '4'], answer: 0, why: '2度は含まない。' },
    ],
    link: { label: 'スケール（ペンタ）を指板で見る', target: 'scale' },
  },
  {
    id: 'triad',
    chapter: CH3,
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
    link: { label: 'トライアドを指板で組み立てる練習へ', target: 'practice-triad' },
  },
  {
    id: 'power-chord',
    chapter: CH3,
    title: 'パワーコード',
    body: [
      'ルートと5度だけの2音（3度を抜く）。明暗が無いので歪ませても濁らず、ロックの主役。',
      '「5」コード(例 C5)と書く。形は1つ覚えれば、どのフレットでも同じ形で使える。',
    ],
    example: 'C5 = C(R) G(5) ／ 6弦ルートなら 6弦 + 5弦(2フレット上)',
    demo: { root: 'C', tones: [{ st: 0, label: 'R' }, { st: 7, label: '5' }] },
    check: [
      { q: 'パワーコードの構成は？', choices: ['R 3 5', 'R 5', 'R ♭3 5'], answer: 1, why: '3度を抜いた R と 5 の2音。' },
      { q: 'パワーコードに明暗(メジャー/マイナー)は？', choices: ['ある', 'ない'], answer: 1, why: '3度が無いので明暗が決まらない。' },
    ],
    link: { label: 'ボイシングでコード形を見る', target: 'voicing' },
  },
  {
    id: '7th',
    chapter: CH3,
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
    chapter: CH4,
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
    chapter: CH4,
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

  {
    id: 'function',
    chapter: CH5,
    title: 'コードの機能（T・SD・D）',
    body: [
      'ダイアトニックの7つのコードは、役割で3グループに分かれる。',
      'トニック(T)=安定・家（I, vi, iii）。サブドミナント(SD)=動き出す（IV, ii）。ドミナント(D)=緊張・解決したい（V, vii°）。',
      '基本の流れは T→SD→D→T。ii-V-I はまさに SD→D→T。コードの“気持ち”が分かると進行が読める。',
    ],
    example: 'Key C: T=C/Am/Em  SD=F/Dm  D=G/Bm♭5',
    check: [
      { q: '緊張（ドミナント）のコードは？', choices: ['F', 'G', 'C'], answer: 1, why: 'V=G(G7)が緊張→I(C)へ解決したくなる。' },
      { q: 'ii-V-I の機能の流れは？', choices: ['T→SD→D', 'SD→D→T', 'D→T→SD'], answer: 1, why: 'ii(SD)→V(D)→I(T)。' },
    ],
    link: { label: 'キー機能クイズで役割を答える練習へ', target: 'practice-keyfunc' },
  },
  {
    id: 'secondary-dominant',
    chapter: CH5,
    title: 'セカンダリードミナント',
    body: [
      'あるコードを“仮のトニック”に見立て、その直前に専用の V7 を借りる技。',
      '例: Key C で Dm(ii)の前に A7 を置く＝「V7 of ii」。A7→Dm に一時的な解決感が出る。',
      '記号は V7/X（Xへ向かうドミナント）。進行に推進力と彩りを足せる。',
    ],
    example: 'Key C: C → A7 → Dm → G7 → C （A7 = V7/ii）',
    check: [
      { q: 'Dm に向かうセカンダリードミナントは？', choices: ['A7', 'D7', 'E7'], answer: 0, why: 'DmをIに見立てるとV7はA7。' },
      { q: 'セカンダリードミナントの役割は？', choices: ['一時的な解決感と彩り', 'テンポを上げる'], answer: 0 },
    ],
    link: { label: 'ダイアトニックで確認', target: 'diatonic' },
  },
  {
    id: 'tritone-sub',
    chapter: CH5,
    title: '代理コード（裏コード）',
    body: [
      'コードを、似た響きの別コードで置き換える技。',
      '定番は「裏コード(トライトーン代理)」: V7 を、半音上にルートを持つ7th(♭II7)で代理。G7 → D♭7。',
      'G7 と D♭7 は 3度と♭7（トライトーン）を共有。ルートが半音で滑らかに下りる。',
    ],
    example: 'Dm7 → D♭7 → Cmaj7 （D♭7 = G7 の裏コード）',
    check: [
      { q: 'G7 の裏コード（トライトーン代理）は？', choices: ['D♭7', 'C7', 'A7'], answer: 0, why: '半音上にルートを持つ7th。トライトーンを共有。' },
      { q: '裏コードで滑らかになる動きは？', choices: ['ルートが半音で下降', 'テンポが上がる'], answer: 0 },
    ],
    link: { label: 'ボイシングで 7th コードの形を見る', target: 'voicing' },
  },
  {
    id: 'modes',
    chapter: CH6,
    title: 'モード（ドリアンなど）',
    body: [
      'メジャースケールを「どの音から始めるか」で7つのモードができる。音は同じでも、起点(ルート)が変わると性格が変わる。',
      '人気はドリアン（マイナーっぽいが6度が長い＝おしゃれ）とミクソリディアン（メジャーっぽいが7度が短い＝ブルージー）。',
      '例: Cメジャーの音を D から弾くと D ドリアン。',
    ],
    example: 'D ドリアン: D E F G A B C（Cメジャーと同じ音、起点がD）',
    demo: {
      root: 'D',
      tones: [
        { st: 0, label: 'R' }, { st: 2, label: '2' }, { st: 3, label: '♭3' }, { st: 5, label: '4' },
        { st: 7, label: '5' }, { st: 9, label: '6' }, { st: 10, label: '♭7' },
      ],
    },
    check: [
      { q: 'ドリアンの特徴は？', choices: ['マイナーだが6度が長い', 'メジャーだが7度が短い'], answer: 0, why: 'm3だが長6度(M6)を持つのが個性。' },
      { q: 'Cメジャーの音をDから始めたモードは？', choices: ['Dドリアン', 'Dミクソリディアン'], answer: 0 },
    ],
    link: { label: 'スケールを指板で見る', target: 'scale' },
  },
  {
    id: 'tensions',
    chapter: CH6,
    title: 'テンション（9th・11th・13th）',
    body: [
      '7thコードのさらに上に積む音＝テンション。9th・11th・13th で色気やおしゃれさを足す。',
      '9th=2度、11th=4度、13th=6度（いずれもオクターブ上）。例: Cmaj9 = Cmaj7 + 9(D)。',
      '全部足すのではなく、コードに合うテンションを選んで使う。',
    ],
    example: 'Cmaj9 = C E G B D（7thに9thのDを追加）',
    demo: {
      root: 'C',
      tones: [
        { st: 0, label: 'R' }, { st: 4, label: '3' }, { st: 7, label: '5' }, { st: 11, label: '7' }, { st: 2, label: '9' },
      ],
    },
    check: [
      { q: '9th は何度の音（オクターブ上）？', choices: ['2度', '4度', '6度'], answer: 0, why: '9th=2度の1オクターブ上。11th=4度、13th=6度。' },
      { q: 'テンションの役割は？', choices: ['色気・おしゃれさを足す', '音量を上げる'], answer: 0 },
    ],
    link: { label: 'ボイシングでコード形を見る', target: 'voicing' },
  },

  {
    id: 'modes-usage',
    chapter: CH7,
    title: 'モードを使い分ける',
    body: [
      'メジャースケールから7つのモードができる（前章の続き）。明るい順〜暗い順で性格が並ぶ。',
      '明るい: リディアン(#4) ＞ アイオニアン(普通の長調) ＞ ミクソリディアン(♭7)。暗い: ドリアン(6が長い) ＞ エオリアン(自然短) ＞ フリジアン(♭2) ＞ ロクリアン(♭2♭5)。',
      'コードに合うモードを当てるとソロが“ハマる”。例: メジャー7thにはリディアンが映える。',
    ],
    example: 'C リディアン: C D E F# G A B（#4=F# が浮遊感）',
    demo: {
      root: 'C',
      tones: [
        { st: 0, label: 'R' }, { st: 2, label: '2' }, { st: 4, label: '3' }, { st: 6, label: '#4' },
        { st: 7, label: '5' }, { st: 9, label: '6' }, { st: 11, label: '7' },
      ],
    },
    check: [
      { q: 'リディアンの特徴音は？', choices: ['#4', '♭7', '♭2'], answer: 0, why: '第4音が半音上がる(#4)＝浮遊感。' },
      { q: '一番暗い（♭2♭5を持つ）モードは？', choices: ['ロクリアン', 'フリジアン', 'ドリアン'], answer: 0, why: 'ロクリアンは♭2と♭5を持つ最も不安定なモード。' },
    ],
    link: { label: 'スケールを指板で見る', target: 'scale' },
  },
  {
    id: 'mode-chord',
    chapter: CH7,
    title: '各旋法の実用（コード対応）',
    body: [
      'アドリブの実践は「鳴っているコードに合うモードを当てる」(コード・スケール対応)。',
      'ダイアトニックの定番: maj7→アイオニアン(orリディアン)、m7→ドリアン、7(ドミナント)→ミクソリディアン、m7♭5→ロクリアン。',
      'コードのルートを起点に対応モードを弾けば外れにくい。下の盤面は G7 に当てる Gミクソリディアン。',
    ],
    example: 'Key C: Dm7→Dドリアン / G7→Gミクソリディアン / Cmaj7→Cアイオニアン',
    demo: {
      root: 'G',
      tones: [
        { st: 0, label: 'R' }, { st: 2, label: '2' }, { st: 4, label: '3' }, { st: 5, label: '4' },
        { st: 7, label: '5' }, { st: 9, label: '6' }, { st: 10, label: '♭7' },
      ],
    },
    check: [
      { q: 'ドミナント7th(例 G7)に合う定番モードは？', choices: ['ミクソリディアン', 'ロクリアン', 'リディアン'], answer: 0, why: 'メジャー系だが♭7を持つ＝ドミナントにぴったり。' },
      { q: 'm7コード(例 Dm7)に合う定番は？', choices: ['ドリアン', 'フリジアン'], answer: 0, why: 'm7にはドリアン(長6度でおしゃれ)が定番。' },
    ],
    link: { label: 'スケールを指板で見る', target: 'scale' },
  },
  {
    id: 'reharmonize',
    chapter: CH7,
    title: 'リハーモナイズ',
    body: [
      '同じメロディに別のコードを当て直して響きを豊かにする技。',
      '道具はこれまでの応用: セカンダリードミナント・裏コード・代理コード・モーダルインターチェンジ(同主調から借用)。',
      '例: C → Am を、C → A7(V7/ii) → Dm7 → G7 のように厚くできる。',
    ],
    example: 'C → F → G → C  ⇒  C → A7 → Dm7 → D♭7 → C（裏コード入り）',
    check: [
      { q: 'リハーモナイズの道具でないのは？', choices: ['ピッキング強化', '裏コード', 'セカンダリードミナント'], answer: 0 },
      { q: '同主調から和音を借りる技は？', choices: ['モーダルインターチェンジ', 'トランスポーズ'], answer: 0, why: 'Cメジャーに Cマイナーの和音(例 Fm)を借用＝モーダルインターチェンジ。' },
    ],
    link: { label: 'ダイアトニックで素材を確認', target: 'diatonic' },
  },
  {
    id: 'modulation',
    chapter: CH7,
    title: '転調（モジュレーション）',
    body: [
      '曲の途中でキーを変える技。場面転換やサビの高揚に効く。',
      '定番: ①ピボットコード(両キー共通の和音)で橋渡し ②転調先の V7 で着地 ③半音上げてサビを持ち上げる(ダイレクト)。',
      '転調先のキーで ii-V-I を差し込むと自然に移れる。',
    ],
    example: 'Key C →(Dm7-G7-C のあと)→ Gm7-C7-F で Key F へ',
    check: [
      { q: '両キー共通の和音で橋渡しする方法は？', choices: ['ピボットコード', 'ダイレクト転調'], answer: 0 },
      { q: 'サビを半音上げて高揚させるのは？', choices: ['ダイレクト転調', 'ピボット'], answer: 0, why: 'キーをそのまま半音上げる定番の盛り上げ。' },
    ],
    link: { label: '進行モードで弾いてみる', target: 'practice-prog' },
  },
  {
    id: 'negative-harmony',
    chapter: CH7,
    title: 'ネガティブハーモニー',
    body: [
      'コードや音を、ある“軸”で鏡のように反転させて別の響きを得る発想。',
      '軸はキーのトニックとドミナントの中点(Cメジャーなら E♭と E の境目)。各音をその軸で折り返す。',
      'メジャーがマイナー側へ反転し、独特の哀愁や新鮮な進行が生まれる(ジェイコブ・コリアー等で話題)。',
    ],
    example: 'Key C: ドミナント G を軸で反転 → Fm 的な響き（V を裏返してサブドミナントマイナーへ）',
    check: [
      { q: 'ネガティブハーモニーの軸は何の中点？', choices: ['トニックとドミナント', 'ルートと5度'], answer: 0, why: 'キーの I と V の中点を軸に各音を折り返す。' },
      { q: '反転で起きやすい変化は？', choices: ['メジャー↔マイナーの反転', 'テンポの変化'], answer: 0, why: '明るい和音が暗い側へ（その逆も）反転する。' },
    ],
    link: { label: 'ダイアトニックで素材を確認', target: 'diatonic' },
  },
];

/** 章の順序（出現順） */
export const LESSON_CHAPTERS: string[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7];
