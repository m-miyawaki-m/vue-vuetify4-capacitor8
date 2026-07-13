# ルーティングに hash モードを採用している理由

URL が `http://localhost:3000/#/products?code=1` のように `#` を含むのは、
Vue Router の **hash ヒストリーモード**(`createWebHashHistory()`)を採用しているため。
設定箇所は `src/app/router/index.ts`。

`#` は Vue の仕組み上避けられないものではなく、**このプロジェクトが意図して選んだ設定**である。

## 前提: SPA と URL の問題

Vue のような SPA は実体のファイルが `index.html` 1枚しかないが、画面ごとに URL は変えたい
(`/products`、`/products/123` など)。ここで「実在しないパスへのアクセスをどう扱うか」という
問題が生まれ、Vue Router は2つの方式を提供している。

## 2つの方式の比較

### hash モード(採用): `createWebHashHistory()`

```
http://localhost:3000/#/products?code=1
                     ↑ サーバーはここまでしか見ない
```

- ブラウザの仕様として `#` 以降はサーバーに送信されない。サーバーは常に `index.html` を
  返すだけでよく、**追加設定なしで確実に動く**
- `#` 以降のパスとクエリ(`?code=1` → `route.query.code`)は Vue Router がブラウザ内で解釈する

### history モード(不採用): `createWebHistory()`

```
http://localhost:3000/products?code=1
```

- URL はきれいだが、この URL でリロードするとブラウザはサーバーに `/products` という
  ファイルを要求する。実在しないため、**「どんなパスでも index.html を返す」サーバー側の
  リライト(SPA フォールバック)設定が別途必要**

## このプロジェクトで hash モードを選んだ理由

1. **実行環境は Capacitor の Android WebView**。`file://` またはローカル配信の `index.html`
   から動くため、リライト設定を持つ Web サーバーが存在しない。hash モードなら環境を
   問わず動作が保証される
2. **ユーザーに URL が見えない**。WebView にはアドレスバーがなく、history モードの
   メリット(見た目・SEO・OGP)が一切効かない
3. `vite.config.mts` の `base: './'`(相対パス)と整合する。history モードに変えると
   深い URL でのリロード時にアセット解決が壊れるため `base: '/'` への変更が必要になる

## history モードへ移行する場合(参考)

Web 公開などで `#` なし URL が必要になった場合に変更する箇所:

1. `src/app/router/index.ts` — `createWebHashHistory()` → `createWebHistory()`
2. `vite.config.mts` — `base: './'` → `'/'`
3. サーバー側の SPA フォールバック設定
   - Vite 開発サーバー: 標準対応済み
   - Capacitor WebView: ローカルサーバーに index.html フォールバックがあるが要実機検証
     (リロード・プロセスキル後の復帰を含む)
   - Web ホスティング: 各サービスの rewrite 設定が必要

> **補足: Ionic と Capacitor の関係**
> Capacitor と Ionic Framework は同じ Ionic 社製だが別物。Capacitor は Web アプリを
> ネイティブアプリとして包む「ガワ」(WebView + ネイティブ API ブリッジ)、
> Ionic Framework は UI コンポーネント集(このプロジェクトでの Vuetify に相当)。
> 本プロジェクトは「Vue + Vuetify + Capacitor」構成で Ionic Framework は不使用。
> 「Ionic 製アプリは history モードで動いている」という実績は、同じ Capacitor 上で
> history モードが動きうる傍証にはなるが、本構成での動作保証ではない(だから要実機検証)。
4. E2E テスト(`e2e/*.spec.ts`)の `page.goto('/#/...')` 形式の URL 修正

## 関連

- 規約「検索条件は URL クエリで持つ」(README)のクエリは hash 内クエリ
  (`#/products/search?code=1` の `?code=1`)を指す
- ユニットテストではブラウザ URL が不要なため `createMemoryHistory()` を使用しており、
  hash モードとは無関係
