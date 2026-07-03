import { LESSONS } from '../data/lessons';

/**
 * アプリ紹介（About）。何のためのアプリか・考え方・信頼性の根拠を示す（E-E-A-T）。
 * 制作者の経歴は事実に基づく範囲でのみ記載する方針。
 */
export function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-sm text-ink leading-relaxed">
      <h2 className="text-xl font-bold text-ink">このアプリについて</h2>

      <section className="bg-surface rounded-lg p-4 border border-hair space-y-2">
        <h3 className="text-base font-bold text-ink">目的</h3>
        <p>
          Guitar Fretboard Trainer は、ギター指板の<strong>音名・度数を「反射で使える」</strong>ようにするための練習トレーナーです。
          単なる理論ビューアではなく、1問ごとに回答時間を計測し、弱点をヒートマップで可視化する
          「練習エンジン」を中核にしています。
        </p>
      </section>

      <section className="bg-surface rounded-lg p-4 border border-hair space-y-2">
        <h3 className="text-base font-bold text-ink">考え方</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>測って直す</strong>: 正答率と反応速度から弱点を割り出し、弱点を優先して出題します。</li>
          <li><strong>読ませず、見て確かめる</strong>: 理論は説明を読むだけでなく、指板で見て・理解度チェックで確かめ、練習に繋げます。</li>
          <li><strong>実戦へ</strong>: 音名だけでなく、コードトーン・進行・キー機能・耳・ガイドトーンまで、演奏に直結する課題を用意しています。</li>
        </ul>
      </section>

      <section className="bg-surface rounded-lg p-4 border border-hair space-y-2">
        <h3 className="text-base font-bold text-ink">内容</h3>
        <p>
          全{LESSONS.length}レッスンを初級〜上級の7章に段階化し、指板マップ・スケール・CAGED・ボイシング・
          ダイアトニックなどのリファレンスと合わせて学べます。理論は一般的な音楽理論（メジャースケール、
          ダイアトニックコード、機能和声など）に基づいています。
        </p>
      </section>

      <section className="bg-surface rounded-lg p-4 border border-hair space-y-2">
        <h3 className="text-base font-bold text-ink">プライバシー</h3>
        <p>
          練習記録・成績・設定はすべてこの端末のブラウザ内にのみ保存され、外部送信はありません。
          フォントも同梱しており、外部サービスへのアクセスは発生しません。詳しくは「使い方ガイド」内の
          「データの扱い」をご覧ください。
        </p>
      </section>

      <p className="text-dim text-xs text-pretty">
        オフラインでも動作する PWA です。ホーム画面に追加するとアプリのように起動できます。
      </p>
    </div>
  );
}
