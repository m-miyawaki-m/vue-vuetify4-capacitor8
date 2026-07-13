import type { CapacitorConfig } from '@capacitor/cli'

// CAP_SERVER_URL があるときだけ WebView の読み込み元を開発サーバーへ向ける(ライブリロード)。
// 通常の sync/run では未設定のため webDir(dist) 読み込みに戻る。
const serverUrl = process.env.CAP_SERVER_URL

const config: CapacitorConfig = {
  appId: 'jp.example.warehousescan',
  appName: 'WarehouseScan',
  webDir: 'dist',
  ...(serverUrl ? { server: { url: serverUrl, cleartext: true } } : {}),
}

export default config
