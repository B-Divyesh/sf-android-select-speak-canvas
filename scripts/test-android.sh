#!/usr/bin/env bash
set -euo pipefail

claim="${1:-all}"
case "$claim" in
  android-private-capture)
    instrumentation='in.sociobot.tapreadcanvas.NativeWorkflowInstrumentedTest#captureContractUsesSystemConsentAndProtectedService,in.sociobot.tapreadcanvas.NativeWorkflowInstrumentedTest#bundledNativeSampleRecognizesAndRequestsExactSpeech'
    ;;
  android-selection-memory)
    instrumentation='in.sociobot.tapreadcanvas.NativeWorkflowInstrumentedTest#selectionAndReadingSurviveStoreRecreation'
    ;;
  protected-captures)
    instrumentation='in.sociobot.tapreadcanvas.NativeWorkflowInstrumentedTest#protectedBlankBufferIsRefusedButVisiblePixelsAreNot'
    ;;
  android-device-privacy)
    instrumentation='in.sociobot.tapreadcanvas.NativeWorkflowInstrumentedTest#backupAndNetworkCapabilitiesAreDisabled'
    ;;
  all)
    instrumentation='in.sociobot.tapreadcanvas.NativeWorkflowInstrumentedTest'
    ;;
  *)
    echo "Unknown Android claim: $1" >&2
    exit 2
    ;;
esac

export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
adb="$ANDROID_HOME/platform-tools/adb"

if [[ ! -x "$adb" ]]; then
  echo "Android platform-tools are required at $adb." >&2
  exit 1
fi
if [[ "$("$adb" get-state 2>/dev/null || true)" != "device" ]]; then
  echo "@claim:$claim requires one connected Android device; no device test ran." >&2
  exit 1
fi
device_sdk="$("$adb" shell getprop ro.build.version.sdk | tr -d '\r')"
if [[ ! "$device_sdk" =~ ^[0-9]+$ ]] || (( device_sdk < 35 )); then
  echo "@claim:$claim requires Android API 35 or newer; connected device is API $device_sdk." >&2
  exit 1
fi

npm run build
npx cap sync android
android/gradlew -p android --no-daemon :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest

"$adb" install -r -t android/app/build/outputs/apk/debug/app-debug.apk
"$adb" install -r -t android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
result="$("$adb" shell am instrument -w -r -e class "$instrumentation" in.sociobot.tapreadcanvas.test/androidx.test.runner.AndroidJUnitRunner)"
printf '%s\n' "$result"
if ! grep -Eq '^OK \([1-9][0-9]* tests?\)$' <<<"$result"; then
  echo "@claim:$claim did not complete its Android instrumentation outcome." >&2
  exit 1
fi
echo "@claim:$claim passed on Android API $device_sdk."
