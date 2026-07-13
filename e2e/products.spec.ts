import { expect, test } from '@playwright/test'

test('検索 → 一覧 → 詳細 → 在庫登録が一連で動作する', async ({ page }) => {
  // 検索(hash ルーティング)
  await page.goto('/#/products/search')
  await page.getByRole('textbox', { name: '品名キーワード' }).fill('ボルト')
  await page.getByRole('button', { name: '検索' }).click()

  // 一覧: Prism の example が表示される
  await expect(page.getByText('ボルト M6')).toBeVisible()
  await expect(page.getByText('ナット M6')).toBeVisible()

  // 詳細
  await page.getByText('ボルト M6').click()
  await expect(page.getByText('在庫数: 120')).toBeVisible()

  // 在庫登録 → 成功スナックバー
  await page.getByRole('button', { name: '登録' }).click()
  await expect(page.getByText('登録しました')).toBeVisible()
})
