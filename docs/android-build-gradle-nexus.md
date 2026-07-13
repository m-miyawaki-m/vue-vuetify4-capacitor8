# Androidビルド環境の知見（Gradle / AGP / Nexus / JDK）

閉域ネットワーク（Nexus経由）でAndroidビルドを行う際にハマったポイントの記録。

## 1. Gradle本体とAGPは別物

名前が紛らわしいが、バージョン体系も配布場所も別々の独立したプロダクト。

| もの | バージョン定義場所 | 配布場所 |
|---|---|---|
| Gradle本体（ビルドツール） | `android/gradle/wrapper/gradle-wrapper.properties` の `distributionUrl` | services.gradle.org（単なるzipのHTTPダウンロード） |
| AGP（Android Gradle Plugin `com.android.tools.build:gradle`） | `android/build.gradle` の `buildscript.dependencies.classpath` | **Google Maven**（Maven Centralには無い） |

- 各AGPバージョンには「必要なGradle最低バージョン」がある（例: AGP 8.13.0 → Gradle 8.13以上）。
- Gradle本体のzipをNexusに置いてwrapperの `distributionUrl` を向けるのと、Mavenリポジトリのプロキシ設定は**完全に別の仕組み**。片方が動いていてももう片方が動くとは限らない。

## 2. NexusでAGPが取得できない問題

### 原因

AGPとandroidx系ライブラリは **Google Maven**（`https://maven.google.com/`、実体は `dl.google.com/dl/android/maven2`）でのみ配布されている。NexusにMaven Centralのプロキシしか無いと、Central由来のライブラリは取れるのにAGPだけ解決できない。

### 対処

1. NexusにGoogle Maven用のproxyリポジトリを追加する
   - Remote URL: `https://maven.google.com/`
   - Layout: maven2
2. groupリポジトリ（`maven-public` など）のメンバーに追加する
3. 切り分け: Nexusのブラウズ画面で `com/android/tools/build/gradle/<version>/` が見えれば設定OK

### 落とし穴: buildscript と allprojects は別解決

`buildscript { repositories {...} }`（プラグイン解決用）と `allprojects { repositories {...} }`（プロジェクト依存用）は**別々に解決される**。プロジェクト依存だけNexusに向けてもAGPには効かない。

さらに `android/capacitor-cordova-android-plugins/build.gradle` にも独立した `buildscript` ブロックがあり、**このファイルは `npx cap update` のたびに再生成される**ため手で書き換えても消える。

再生成に耐える確実な方法は init script（`~/.gradle/init.gradle`）で全リポジトリをNexusに強制置換すること:

```groovy
allprojects {
    buildscript {
        repositories {
            maven { url 'https://<nexus>/repository/maven-public/' }
        }
    }
    repositories {
        maven { url 'https://<nexus>/repository/maven-public/' }
    }
}
```

## 3. init script の基礎知識

### init scriptとは

Gradleが**ビルド開始前（プロジェクトの `build.gradle` を読む前）に実行する**スクリプト。プロジェクトのファイルを一切変更せずに、そのマシン上の全ビルドへ横断的に設定を注入できる。閉域環境でのリポジトリ強制置換の定番手段。

### 配置場所と優先順位

以下はすべて有効で、複数あれば**すべて実行される**（上から順）:

| 方法 | 場所 | 用途 |
|---|---|---|
| コマンドライン指定 | `gradlew -I <path>\my-init.gradle build`（`--init-script` も同じ） | 一時的な検証・CI |
| ユーザー単位（単一ファイル） | `%USERPROFILE%\.gradle\init.gradle` | 個人マシンの恒久設定 |
| ユーザー単位（複数ファイル） | `%USERPROFILE%\.gradle\init.d\*.gradle` | 設定を目的別に分割したい場合 |
| Gradleインストール単位 | `<GRADLE_HOME>\init.d\*.gradle` | 共有ビルドマシン向け（wrapper利用時は展開先が都度変わるため不向き） |

Kotlin DSL（`init.gradle.kts`）も使える。ファイル名は `.gradle` / `.gradle.kts` の拡張子であれば `init.d` 内では任意。

### このプロジェクトでの実用例（Nexus強制置換 + 認証）

`%USERPROFILE%\.gradle\init.gradle`:

```groovy
def nexusUrl = 'https://<nexus>/repository/maven-public/'

allprojects {
    buildscript {
        repositories {
            // 既存定義(google()/mavenCentral())を消してNexusのみにする
            all { repo ->
                if (!(repo instanceof MavenArtifactRepository) || repo.url.toString() != nexusUrl) {
                    remove repo
                }
            }
            maven {
                url nexusUrl
                credentials {
                    username System.getenv('NEXUS_USER')
                    password System.getenv('NEXUS_PASSWORD')
                }
            }
        }
    }
    repositories {
        all { repo ->
            if (!(repo instanceof MavenArtifactRepository) || repo.url.toString() != nexusUrl) {
                remove repo
            }
        }
        maven {
            url nexusUrl
            credentials {
                username System.getenv('NEXUS_USER')
                password System.getenv('NEXUS_PASSWORD')
            }
        }
    }
}

// settings.gradle の pluginManagement 経由で解決されるプラグインにも効かせる
settingsEvaluated { settings ->
    settings.pluginManagement {
        repositories {
            maven { url nexusUrl }
        }
    }
}
```

ポイント:

- 単にNexusを**追加**するだけだと、先に定義された `google()` への接続試行（とタイムアウト待ち）が発生する。閉域環境では既存リポジトリを `remove` して置換するのが確実。
- 認証情報は init script に直書きせず環境変数か `%USERPROFILE%\.gradle\gradle.properties` から読む。
- `settingsEvaluated` ブロックは `plugins {}` DSL（pluginManagement）経由の解決用。本プロジェクトのAndroidビルドは旧来の `buildscript.classpath` 方式なので必須ではないが、入れておくと他プロジェクトにも効く。

### 注意点

- **そのマシンの全Gradleビルドに適用される。** 社外ネットワークで動くプロジェクトにも効いてしまうので、閉域マシン専用の設定として使うこと。一時的に外したい場合はファイルをリネームするか、`-I` 方式で必要なときだけ渡す運用にする。
- init script自体が外部プラグインに依存すると本末転倒（その取得にもリポジトリが要る）。素のGroovyだけで書く。
- デバッグは `gradlew --info` でどのリポジトリに問い合わせているかログ確認できる。

## 4. ローカルのGradleキャッシュは活用できる

一度オンライン（またはNexus経由）でビルドが通れば、依存はすべてローカルにキャッシュされ、以降のビルドは再ダウンロードしない。

| キャッシュ対象 | 場所（Windows） |
|---|---|
| Maven依存（AGP・ライブラリ類） | `%USERPROFILE%\.gradle\caches\modules-2\` |
| Gradle本体（wrapperが展開したもの） | `%USERPROFILE%\.gradle\wrapper\dists\` |

- `gradlew --offline` を付ければネットワークに一切出ずキャッシュのみでビルドできる（キャッシュに無い依存があれば即失敗するので切り分けにも使える）。
- 固定バージョン指定なら通常ビルドでもキャッシュヒット時は再ダウンロードしない。動的バージョン（`1.+`）やSNAPSHOTは定期的にリモート確認が走る点に注意。
- キャッシュは**共有リポジトリとしては使えない**（Nexusのストレージに流用したり、リポジトリとして公開する形式ではない）。別マシンへ `%USERPROFILE%\.gradle` を丸ごとコピーして持ち込むことは可能だが、正攻法はNexusプロキシを整備して各マシンが初回ビルドでキャッシュを温める運用。

## 5. CLIビルドにはJDK 21が必要（Capacitor 8）

Capacitor 8は `compileOptions` で Java 21 を要求する。GradleがJDK 17で動いていると `:capacitor-android:compileDebugJavaWithJavac` が「エラー: 21は無効なソース・リリースです」で失敗する。

- Android Studioからのビルドは同梱のJBR（JDK 21）が使われるため気づきにくい。CLI（`gradlew`）ではPATH/JAVA_HOMEのJDKが使われる。
- 本プロジェクトでは `android/gradle.properties` に `org.gradle.java.home=C:\\Program Files\\Java\\jdk-21` を指定して解決済み。
- 確認コマンド: `gradlew --version` の「Daemon JVM」欄を見る。

## 6. gradle.properties でのJDK参照（org.gradle.java.home）の詳細

### 何を指定しているのか

`org.gradle.java.home` は **Gradleデーモン（ビルド本体）を動かすJVM** の指定。ここで指定したJDKの javac / keytool / 証明書ストアがビルドで使われる。

### 解決の優先順位

GradleがどのJDKで動くかは上から順に決まる:

1. コマンドライン: `gradlew -Dorg.gradle.java.home=<path>`
2. ユーザー単位: `%USERPROFILE%\.gradle\gradle.properties` の `org.gradle.java.home`
3. プロジェクト単位: `android/gradle.properties` の `org.gradle.java.home` ← 本プロジェクトはここ
4. 環境変数 `JAVA_HOME`
5. PATH上の `java`

**ユーザー単位の gradle.properties はプロジェクト側より優先される**点に注意。「プロジェクトに書いたのに効かない」ときは `%USERPROFILE%\.gradle\gradle.properties` に同じキーが無いか確認する。

### 記法と注意点

- Windowsパスはバックスラッシュをエスケープする: `C:\\Program Files\\Java\\jdk-21`（スラッシュ区切り `C:/Program Files/Java/jdk-21` でも可）。
- 指すのはJDKのルート（`bin` の親）。`bin` まで書くと起動に失敗する。
- JVMが変わるとデーモンは共用できないため、切り替え直後のビルドで「incompatible Daemons could not be reused」と出て新デーモンが起動する（正常な挙動）。
- Android StudioのIDEビルドは Settings > Build Tools > Gradle の「Gradle JDK」設定が使われる。プロジェクトの `gradle.properties` 指定と食い違うとIDEとCLIで挙動が変わるので、Studio側も同じJDKに合わせておくのが安全。

### 補足: launcher JVM との違い

`gradlew` コマンド自体（wrapperのランチャー）は **PATH/JAVA_HOMEのJVM** で起動し、その後 `org.gradle.java.home` のJVMでデーモンが立ち上がる二段構え。`gradlew --version` の表示では:

- `Launcher JVM:` = gradlewを起動したJVM（PATH/JAVA_HOME）
- `Daemon JVM:` = 実際にビルドするJVM（org.gradle.java.home が反映される）

**Gradle本体zipのダウンロードや初回展開は launcher JVM が行う**ため、証明書設定（後述）はlauncher側のJDKにも必要になる場合がある。

### 補足: toolchain 方式との関係

Gradleには「デーモンとは別のJDKでコンパイルする」toolchain機能もあるが、未設定のJDKを**ネットワークから自動ダウンロードしようとする**（Foojay resolver）ため閉域環境では逆に事故のもと。閉域では以下で自動ダウンロードを止め、ローカルのJDKを明示する:

```properties
org.gradle.java.installations.auto-download=false
org.gradle.java.installations.paths=C:\\Program Files\\Java\\jdk-21
```

本プロジェクトのAGP構成（`compileOptions` のみ、toolchain未使用）ではデーモンJVM＝コンパイルJVMなので `org.gradle.java.home` だけで足りる。

## 7. プロキシ（SSLインスペクション）証明書のキーストア登録

### 症状

社内プロキシがSSLインスペクション（HTTPS復号）を行う環境では、GradleのHTTPS通信（Nexus・Google Maven等への接続）が以下のエラーで失敗する:

```
PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
unable to find valid certification path to requested target
```

原因はプロキシが差し替えたサーバー証明書の発行元（社内CA証明書）をJDKが信頼していないため。

### 前提: 証明書ファイルの入手

社内CAのルート証明書（`.cer` / `.crt`、PEMまたはDER形式）を情シスから入手するか、ブラウザで対象サイトを開き証明書チェーンのルートをエクスポートする。

### 方法A: JDKの cacerts に直接登録（推奨・シンプル）

JDK 9以降は `-cacerts` オプションでデフォルトストア（`<JDK>\lib\security\cacerts`）を直接指定できる。デフォルトパスワードは `changeit`。

```powershell
# 管理者権限のターミナルで（Program Files配下への書き込みのため）
& "C:\Program Files\Java\jdk-21\bin\keytool.exe" -importcert -cacerts `
    -storepass changeit -alias corp-proxy-ca -file C:\certs\corp-proxy-ca.cer -noprompt

# 登録確認
& "C:\Program Files\Java\jdk-21\bin\keytool.exe" -list -cacerts `
    -storepass changeit -alias corp-proxy-ca
```

**重要: 登録先はGradleデーモンが使うJDK**（= `org.gradle.java.home` のJDK）。別のJDKのcacertsに入れても効かない。関係するJVMは最大3つあり、それぞれ独立したcacertsを持つ:

| JVM | 影響範囲 | cacertsの場所 |
|---|---|---|
| デーモンJVM（org.gradle.java.home） | 依存取得（AGP・ライブラリ） | `C:\Program Files\Java\jdk-21\lib\security\cacerts` |
| launcher JVM（PATH/JAVA_HOME） | wrapperのGradle本体zipダウンロード | 該当JDKの `lib\security\cacerts` |
| Android Studio JBR | IDEからのビルド・SDKダウンロード | `C:\Program Files\Android\Android Studio\jbr\lib\security\cacerts` |

デーモンとlauncherが同じJDKなら1回で済む。異なる場合は両方に登録する。

### 方法B: カスタムtruststoreを gradle.properties で指定（JDKを汚さない）

JDK本体を書き換えたくない場合（権限が無い、JDK更新で消えるのが嫌）は、cacertsのコピーに証明書を足し、システムプロパティで差し替える:

```powershell
# 1. 既存cacertsをコピー（空から作らないこと — 公開CAの信頼も必要）
Copy-Item "C:\Program Files\Java\jdk-21\lib\security\cacerts" C:\certs\cacerts

# 2. コピーに社内CAを追加
& "C:\Program Files\Java\jdk-21\bin\keytool.exe" -importcert `
    -keystore C:\certs\cacerts -storepass changeit `
    -alias corp-proxy-ca -file C:\certs\corp-proxy-ca.cer -noprompt
```

`gradle.properties`（ユーザー単位推奨。プロジェクトに書くとパスがマシン依存になる）:

```properties
systemProp.javax.net.ssl.trustStore=C:\\certs\\cacerts
systemProp.javax.net.ssl.trustStorePassword=changeit
```

注意: `trustStore` 指定は**デフォルトストアの置き換え**であって追加ではない。必ず既存cacertsのコピーをベースにする。

### あわせて必要になりがちな設定

- **プロキシ自体の設定**（認証プロキシの場合）— `gradle.properties`:
  ```properties
  systemProp.https.proxyHost=proxy.example.co.jp
  systemProp.https.proxyPort=8080
  systemProp.https.nonProxyHosts=localhost|*.example.co.jp
  ```
- **JDK更新時の再登録** — 方法AはJDKを入れ替えるとcacertsごと初期化される。JDK更新手順に証明書再登録を含めておく。
- **npm側は別管理** — Node.jsはJDKのcacertsを見ない。本プロジェクトの `npm install` には環境変数 `NODE_EXTRA_CA_CERTS=C:\certs\corp-proxy-ca.pem`（PEM形式）を別途設定する。
