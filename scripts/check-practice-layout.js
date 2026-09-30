// ローカル開発サーバーを起動し、専用の一時ブラウザで実行する。
// playwright-cli -s=guitar-ui run-code --filename=scripts/check-practice-layout.js
async page => {
  const isolated = await page.context().browser().newContext({ viewport: { width: 390, height: 844 } });
  const testPage = await isolated.newPage();
  try {
    await testPage.addInitScript(() => localStorage.setItem('gft-tempo-v1', 'manual'));
    await testPage.goto('http://127.0.0.1:5173/');
    await testPage.getByRole('button', { name: 'あとで決める（スキップ）' }).click();
    await testPage.getByRole('navigation', { name: 'メインナビゲーション' }).getByRole('button', { name: '練習', exact: true }).click();
    await testPage.getByRole('button', { name: 'チャレンジ開始' }).click();
    await testPage.getByRole('status').filter({ hasText: 'フレットの音名は' }).waitFor();
    if (await testPage.getByRole('button', { name: '基本', exact: true }).isVisible()) {
      throw new Error('練習中は練習メニューを畳み、問題・指板・回答の表示を優先する');
    }
    if (await testPage.getByRole('button', { name: '位置→音名', exact: true }).isVisible()) {
      throw new Error('練習中は出題モードの設定を畳む');
    }
    const menu = testPage.locator('summary').filter({ hasText: '練習メニュー' });
    await menu.click();
    if (!await testPage.getByRole('button', { name: '基本', exact: true }).isVisible()) {
      throw new Error('練習メニューは練習中も開いて操作できる');
    }
    await menu.click();
    await testPage.getByRole('button', { name: '終了して結果を見る' }).click();
    await testPage.getByRole('button', { name: 'チャレンジ開始' }).waitFor();
    if (!await testPage.getByRole('button', { name: '基本', exact: true }).isVisible()) {
      throw new Error('開始前は練習メニューを表示する');
    }
    await testPage.getByRole('button', { name: 'チャレンジ開始' }).click();
    await testPage.getByRole('button', { name: 'C', exact: true }).click();
    await testPage.getByText('1/10', { exact: true }).waitFor();
    const question = await testPage.getByRole('status').filter({ hasText: 'フレットの音名は' }).innerText();
    await testPage.locator('summary').filter({ hasText: '出題モード' }).click();
    await testPage.getByRole('button', { name: '位置→音名', exact: true }).click();
    if (!await testPage.getByText('1/10', { exact: true }).isVisible()) {
      throw new Error('現在の出題モードを再タップしても回答件数を維持する');
    }
    if (await testPage.getByRole('status').filter({ hasText: 'フレットの音名は' }).innerText() !== question) {
      throw new Error('現在の出題モードを再タップしても問題と回答状態を維持する');
    }
    await testPage.getByRole('button', { name: '終了して結果を見る' }).click();
    await testPage.getByText('チャレンジ結果', { exact: true }).waitFor();
    return { passed: true, checks: ['練習中の設定折りたたみ', '練習中の設定再表示', '未回答終了後の設定復帰', '同じモードの再選択で記録を維持', '回答後の結果表示'] };
  } finally {
    await isolated.close();
  }
}
