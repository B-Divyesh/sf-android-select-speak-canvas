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
  android-benchmark)
    instrumentation='in.sociobot.tapreadcanvas.NativeOcrBenchmarkInstrumentedTest#thirtyRegionsMeetAccuracyAndLatencyTarget'
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

install_if_changed() {
  local package_name="$1"
  local apk="$2"
  local local_checksum remote_path remote_checksum
  local_checksum="$(sha256sum "$apk" | cut -d' ' -f1)"
  remote_path="$("$adb" shell pm path "$package_name" 2>/dev/null | head -n 1 | tr -d '\r' | sed 's/^package://')"
  remote_checksum=""
  if [[ -n "$remote_path" ]]; then
    remote_checksum="$("$adb" shell sha256sum "$remote_path" 2>/dev/null | cut -d' ' -f1 | tr -d '\r')"
  fi
  if [[ "$local_checksum" == "$remote_checksum" ]]; then
    echo "$package_name already has the exact tested APK."
  else
    "$adb" install -r -t "$apk"
  fi
}

install_if_changed in.sociobot.tapreadcanvas android/app/build/outputs/apk/debug/app-debug.apk
install_if_changed in.sociobot.tapreadcanvas.test android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
# Software-emulated API 35 devices can otherwise hit Android's process-start
# watchdog before AndroidJUnitRunner is compiled. This does not bypass tests;
# it compiles the exact installed packages before starting instrumentation.
"$adb" shell cmd package compile -m speed in.sociobot.tapreadcanvas >/dev/null
"$adb" shell cmd package compile -m speed in.sociobot.tapreadcanvas.test >/dev/null
result="$("$adb" shell am instrument -w -r -e class "$instrumentation" in.sociobot.tapreadcanvas.test/androidx.test.runner.AndroidJUnitRunner)"
printf '%s\n' "$result"
if ! grep -Eq '^OK \([1-9][0-9]* tests?\)$' <<<"$result"; then
  echo "@claim:$claim did not complete its Android instrumentation outcome." >&2
  exit 1
fi
echo "@claim:$claim passed on Android API $device_sdk."
