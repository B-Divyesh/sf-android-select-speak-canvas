#!/usr/bin/env bash
set -euo pipefail

case "${1:-all}" in
  android-private-capture|android-selection-memory)
    unit_filter='in.sociobot.tapreadcanvas.NativeReadingSessionTest'
    ;;
  protected-captures)
    unit_filter='in.sociobot.tapreadcanvas.NativeReadingSessionTest.blankRecognitionIsNotSavedOrSpoken'
    ;;
  android-device-privacy)
    unit_filter='in.sociobot.tapreadcanvas.NativeReadingSessionTest'
    ;;
  all)
    unit_filter='in.sociobot.tapreadcanvas.*'
    ;;
  *)
    echo "Unknown Android claim: $1" >&2
    exit 2
    ;;
esac

export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"

npm run build
npx cap sync android
android/gradlew -p android testDebugUnitTest --tests "$unit_filter" assembleDebug assembleDebugAndroidTest

if "$ANDROID_HOME/platform-tools/adb" get-state >/dev/null 2>&1; then
  android/gradlew -p android connectedDebugAndroidTest
else
  echo "Android instrumentation was compiled but no device is connected." >&2
fi
