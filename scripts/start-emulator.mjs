// Android エミュレータを起動し、ブート完了で "EMULATOR READY" を出力する
// (VS Code タスクの endsPattern / dependsOn がこの文字列を待つ)
// 使い方: node scripts/start-emulator.mjs [AVD名]  ※省略時は最初の AVD
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

function resolveSdkDir() {
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME
  if (process.env.ANDROID_SDK_ROOT) return process.env.ANDROID_SDK_ROOT
  try {
    // Java properties 形式のためエスケープ(\: \\)を解除する
    const m = readFileSync('android/local.properties', 'utf8').match(/^sdk\.dir=(.+)$/m)
    if (m) return m[1].trim().replace(/\\(.)/g, '$1')
  } catch {
    // local.properties 未作成なら OS 既定の場所へフォールバック
  }
  return process.platform === 'win32'
    ? join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk')
    : join(process.env.HOME ?? '', 'Library', 'Android', 'sdk')
}

const exeSuffix = process.platform === 'win32' ? '.exe' : ''
const sdkDir = resolveSdkDir()
const emulatorBin = join(sdkDir, 'emulator', `emulator${exeSuffix}`)
const adbBin = join(sdkDir, 'platform-tools', `adb${exeSuffix}`)

const runningDevices = execFileSync(adbBin, ['devices'], { encoding: 'utf8' })
if (/^emulator-\d+\s+device$/m.test(runningDevices)) {
  console.log('起動済みのエミュレータを検出。そのまま使用します')
  console.log('EMULATOR READY')
  process.exit(0)
}

const avds = execFileSync(emulatorBin, ['-list-avds'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter((line) => line.trim() && !line.startsWith('INFO'))
const avdName = process.argv[2] ?? avds[0]
if (!avdName) {
  console.error('AVD がありません。Android Studio の Device Manager で作成してください')
  process.exit(1)
}

console.log(`AVD "${avdName}" を起動します(このプロセスを終了するとエミュレータも終了)`)
const child = spawn(emulatorBin, ['-avd', avdName], { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 0))

const poll = setInterval(() => {
  try {
    const booted = execFileSync(adbBin, ['-e', 'shell', 'getprop', 'sys.boot_completed'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (booted === '1') {
      clearInterval(poll)
      console.log('EMULATOR READY')
    }
  } catch {
    // ブート途中は adb が失敗するので次のポーリングまで待つ
  }
}, 3000)
