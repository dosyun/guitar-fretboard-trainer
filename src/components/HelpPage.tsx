export function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-sm text-gray-700 leading-relaxed">
      <h2 className="text-xl font-bold text-gray-900">使い方ガイド</h2>

      {/* 指板マップ */}
      <section className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <h3 className="text-base font-bold text-gray-800">指板マップ</h3>
        <p>指板上の全ポジションの音名・度数を一覧表示します。まず全体像を把握するのに使いましょう。</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>音名 / 度数</strong> — 表示モードを切り替え。度数モードではルート音を選択できます</li>
          <li><strong>練習範囲</strong> — 弦・フレット・音名で絞り込み。範囲外は薄く表示されます</li>
          <li><strong>プリセット</strong> — 「開放〜4F」「ナチュラルのみ」など、よく使う範囲をワンタップで設定</li>
        </ul>
      </section>

      {/* クイズ */}
      <section className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <h3 className="text-base font-bold text-gray-800">クイズ</h3>
        <p>3つのモードで指板の音を暗記できます。</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>ポジション → ノート</strong> — 指板上のハイライト位置の音名を12個のボタンから回答</li>
          <li><strong>ノート → ポジション</strong> — 表示された音名の位置を指板上でタップ</li>
          <li><strong>度数</strong> — ルート音に対するハイライト位置のインターバルを回答</li>
        </ul>
        <div className="mt-2 space-y-1">
          <p className="font-medium text-gray-800">学習サポート:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>練習範囲</strong> — 弦・フレット・音名で出題範囲を絞り込めます</li>
            <li><strong>ヒント</strong> — クイズ中に「ヒントを見る」で目印（開放弦からの半音数、5F=隣弦の開放音など）を表示</li>
            <li><strong>スコア</strong> — 正解率・連続正解・最高記録を表示。最高記録はブラウザに保存されます</li>
          </ul>
        </div>
      </section>

      {/* スケール */}
      <section className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <h3 className="text-base font-bold text-gray-800">スケール</h3>
        <p>4種類のスケールを指板上で視覚的に学べます。5つのボックスポジションで段階的に覚えましょう。</p>

        <div className="mt-2 space-y-1">
          <p className="font-medium text-gray-800">対応スケール:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>メジャーペンタ</strong> — R, 2, 3, 5, 6</li>
            <li><strong>マイナーペンタ</strong> — R, m3, 4, 5, m7</li>
            <li><strong>メジャー</strong> — R, 2, 3, 4, 5, 6, 7</li>
            <li><strong>マイナー</strong> — R, 2, m3, 4, 5, m6, m7</li>
            <li><strong>ブルース</strong> — R, m3, 4, ♭5, 5, m7（マイナーペンタ + ブルーノート）</li>
            <li><strong>ドリアン</strong> — R, 2, m3, 4, 5, 6, m7（m7コードに合うモード）</li>
            <li><strong>ミクソリドアン</strong> — R, 2, 3, 4, 5, 6, m7（7thコードに合うモード）</li>
            <li><strong>オルタード</strong> — R, ♭2, ♭3, 3, ♭5, ♭6, m7（V7altコード用）</li>
          </ul>
        </div>

        <div className="mt-2 space-y-1">
          <p className="font-medium text-gray-800">表示モード:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>「全体」で指板全体のスケール音を表示、5つのボックスポジションを点線で区分け</li>
            <li>ポジション1〜5を選ぶと、そのボックスだけをハイライト表示</li>
            <li>ルート音(R)は大きめの丸で強調表示</li>
          </ul>
        </div>

        <div className="mt-2 space-y-1">
          <p className="font-medium text-gray-800">クイズモード (2種):</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>スケール内/外</strong> — ハイライト位置がスケールに含まれるかどうかを回答</li>
            <li><strong>度数当て</strong> — スケール内の音の度数(R, 2, 3, 4, 5, 6, 7等)を回答</li>
          </ul>
        </div>
      </section>

      {/* CAGED */}
      <section className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <h3 className="text-base font-bold text-gray-800">CAGED</h3>
        <p>CAGEDシステムで指板全体のコードフォームとペンタトニックスケールの位置関係を学べます。</p>

        <div className="mt-2 space-y-1">
          <p className="font-medium text-gray-800">表示モード:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>ルート音選択</strong> — 任意のキーに転調して表示</li>
            <li><strong>フォーム選択</strong> — C/A/G/E/D を個別ON/OFF、または全表示</li>
            <li><strong>コードトーン</strong> — 各フォームのR(ルート)/3(長3度)/5(完全5度)を表示</li>
            <li><strong>ペンタトニック</strong> — メジャーペンタトニック(R/2/3/5/6)をオーバーレイ表示</li>
          </ul>
        </div>

        <div className="mt-2 space-y-1">
          <p className="font-medium text-gray-800">クイズモード (3種):</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>フォーム当て</strong> — ポジション群を見て「何フォーム？」を回答</li>
            <li><strong>ポジション当て</strong> — フォーム名とルートが提示され、正しい位置をタップ</li>
            <li><strong>コードトーン当て</strong> — フォーム内の1つのポジションがR/3/5のどれかを回答</li>
          </ul>
        </div>
      </section>

      {/* ボイシング */}
      <section className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <h3 className="text-base font-bold text-gray-800">ボイシング</h3>
        <p>バレーコードのフォームをコードダイアグラムで確認できます。</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>6弦ルート</strong> — Eフォーム系。ジャズ教本ベースの5弦・1弦省略ボイシング</li>
          <li><strong>5弦ルート</strong> — Aフォーム系</li>
          <li><strong>4弦ルート</strong> — Dフォーム系</li>
          <li>コードタイプ: major / 7th / maj7 / minor / m7 / m7(♭5) の6種</li>
          <li>音名 / 度数 / 両方 で各弦の音を確認できます</li>
        </ul>
      </section>

      {/* オープンコード */}
      <section className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <h3 className="text-base font-bold text-gray-800">オープン</h3>
        <p>開放弦を使ったオープンコード32種をカテゴリ別に表示します。</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>カテゴリ: メジャー / マイナー / 7th / maj7 / m7 / sus / add9</li>
          <li>音名 / 度数 / 両方 で各弦の音を確認できます</li>
        </ul>
      </section>

      {/* ダイアトニック */}
      <section className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <h3 className="text-base font-bold text-gray-800">ダイアトニック</h3>
        <p>キーのダイアトニックコード一覧と、定番コード進行の練習ができます。</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>コード一覧</strong> — メジャー/マイナーキーの I〜VII コードをダイアグラムで表示</li>
          <li><strong>進行練習</strong> — ii-V-I、ターンアラウンドなどジャズ定番進行を選択して練習</li>
          <li>6弦ルート / 5弦ルートを切り替えて様々なポジションで確認</li>
        </ul>
      </section>

      {/* アルペジオ */}
      <section className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <h3 className="text-base font-bold text-gray-800">アルペジオ</h3>
        <p>コードトーンを低音から高音へ順番に弾くアルペジオの練習をサポートします。</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>コードタイプ: maj7 / 7th / m7 / m7(♭5) の4種</li>
          <li>番号 = 低い音から高い音への順番（同じ音程は同じ番号）</li>
          <li><strong>フレット範囲</strong> — 全体 / 開放〜5F / 5〜9F / 9〜12F で絞り込み、そのポジション内で振り直し</li>
          <li>番号 / 度数 / 音名 / 両方 で表示切替</li>
        </ul>
      </section>

      {/* 設定 */}
      <section className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
        <h3 className="text-base font-bold text-gray-800">設定</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>表記</strong> — # (シャープ) / ♭ (フラット) / #/♭ (併記) を切替</li>
          <li><strong>フレット数</strong> — 12 / 15 / 17 / 19 / 22 フレットに対応</li>
          <li><strong>スコアリセット</strong> — 正解数・連続記録をリセット（最高記録は保持）</li>
        </ul>
      </section>

      {/* おすすめの学習手順 */}
      <section className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-2">
        <h3 className="text-base font-bold text-blue-800">おすすめの学習ステップ</h3>
        <ol className="list-decimal ml-5 space-y-1 text-blue-900">
          <li>「指板マップ」で全体像を眺める</li>
          <li>範囲を「6弦のみ・0〜4F」に絞ってクイズで覚える</li>
          <li>5弦→4弦と弦を増やしていく</li>
          <li>フレット範囲を5〜9F、全範囲と広げる</li>
          <li>度数モードでインターバルを覚える</li>
          <li>「スケール」でマイナーペンタをポジション1つずつ覚える</li>
          <li>ブルース・ドリアン・ミクソリドアンに広げる</li>
          <li>「ボイシング」でバレーコードフォームを確認する</li>
          <li>「ダイアトニック」でキーのコード一覧を把握する</li>
          <li>ii-V-I などの進行練習でコードチェンジを練習する</li>
          <li>「アルペジオ」でコードトーンの音程順を把握する</li>
          <li>「CAGED」でコードフォームと指板全体の繋がりを理解する</li>
        </ol>
      </section>
    </div>
  );
}
