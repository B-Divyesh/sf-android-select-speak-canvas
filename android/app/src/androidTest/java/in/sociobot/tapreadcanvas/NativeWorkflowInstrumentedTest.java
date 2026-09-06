package in.sociobot.tapreadcanvas;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.RectF;
import android.Manifest;
import android.content.pm.ApplicationInfo;
import android.content.pm.ActivityInfo;
import android.media.projection.MediaProjectionManager;
import android.view.View;
import android.widget.TextView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.ArrayList;
import java.util.List;

/** Device regression coverage for the native pieces behind the TapRead overlay. */
@RunWith(AndroidJUnit4.class)
public final class NativeWorkflowInstrumentedTest {
    // @claim:android-private-capture
    @Test public void captureContractUsesSystemConsentAndProtectedService() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        ServiceInfo info = context.getPackageManager().getServiceInfo(
                new ComponentName(context, TapReadAccessibilityService.class), PackageManager.GET_META_DATA);
        assertEquals("android.permission.BIND_ACCESSIBILITY_SERVICE", info.permission);
        assertTrue(info.metaData.containsKey("android.accessibilityservice"));
        assertTrue(info.exported);
        assertEquals(ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION, info.getForegroundServiceType());

        ActivityInfo consentActivity = context.getPackageManager().getActivityInfo(
                new ComponentName(context, CaptureConsentActivity.class), 0);
        assertFalse(consentActivity.exported);
        MediaProjectionManager manager = (MediaProjectionManager) context.getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        Intent consent = manager.createScreenCaptureIntent();
        assertTrue("Android must provide the screen-share consent activity",
                consent.resolveActivity(context.getPackageManager()) != null);
    }

    // @claim:android-selection-memory
    @Test public void selectionAndReadingSurviveStoreRecreation() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        SharedPreferences preferences = context.getSharedPreferences("claim_selection_memory", Context.MODE_PRIVATE);
        preferences.edit().clear().commit();
        List<String> firstSpeech = new ArrayList<>();
        NativeReadingSession first = new NativeReadingSession(new NativeReadingSession.Store() {
            @Override public void save(String text) { preferences.edit().putString("last_text", text).commit(); }
            @Override public String load() { return preferences.getString("last_text", ""); }
        }, firstSpeech::add);
        assertEquals("The north gate opens at dawn.", first.acceptRecognition(" The north gate\nopens at dawn. "));
        preferences.edit().putFloat("left", .1f).putFloat("top", .3f)
                .putFloat("right", .9f).putFloat("bottom", .7f).commit();

        List<String> repeatedSpeech = new ArrayList<>();
        NativeReadingSession recreated = new NativeReadingSession(new NativeReadingSession.Store() {
            @Override public void save(String text) { preferences.edit().putString("last_text", text).commit(); }
            @Override public String load() { return preferences.getString("last_text", ""); }
        }, repeatedSpeech::add);
        assertEquals("The north gate opens at dawn.", recreated.repeat());
        assertEquals(List.of("The north gate opens at dawn."), repeatedSpeech);
        RectF restored = RegionMemory.restore(preferences.getFloat("left", 0), preferences.getFloat("top", 0),
                preferences.getFloat("right", 0), preferences.getFloat("bottom", 0), 1080, 2400);
        assertEquals(108f, restored.left, .01f);
        assertEquals(720f, restored.top, .01f);
        assertEquals(972f, restored.right, .01f);
        assertEquals(1680f, restored.bottom, .01f);
        preferences.edit().clear().commit();
    }

    // @claim:protected-captures
    @Test public void protectedBlankBufferIsRefusedButVisiblePixelsAreNot() {
        Bitmap blank = Bitmap.createBitmap(20, 20, Bitmap.Config.ARGB_8888);
        Bitmap visible = Bitmap.createBitmap(20, 20, Bitmap.Config.ARGB_8888);
        visible.eraseColor(Color.WHITE);
        assertTrue(ScreenSafety.isLikelyProtectedBlank(blank));
        assertFalse(ScreenSafety.isLikelyProtectedBlank(visible));
    }

    // @claim:android-device-privacy
    @Test public void backupAndNetworkCapabilitiesAreDisabled() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        ApplicationInfo info = context.getPackageManager().getApplicationInfo(context.getPackageName(), 0);
        assertEquals(0, info.flags & ApplicationInfo.FLAG_ALLOW_BACKUP);
        assertEquals(PackageManager.PERMISSION_DENIED,
                context.getPackageManager().checkPermission(Manifest.permission.INTERNET, context.getPackageName()));
    }

    @Test public void bundledNativeSampleRecognizesAndRequestsExactSpeech() throws Exception {
        try (ActivityScenario<SampleScreenActivity> scenario = ActivityScenario.launch(SampleScreenActivity.class)) {
            scenario.onActivity(activity -> activity.findViewById(SampleScreenActivity.LOAD_BUTTON_ID).performClick());
            long deadline = System.currentTimeMillis() + 20_000;
            String value = "";
            while (System.currentTimeMillis() < deadline) {
                final String[] current = {""};
                scenario.onActivity(activity -> {
                    View status = activity.findViewById(android.R.id.message);
                    if (status instanceof android.widget.TextView) current[0] = ((android.widget.TextView) status).getText().toString();
                });
                value = current[0];
                if (value.toLowerCase().contains("north gate") && value.toLowerCase().contains("opens at dawn")) break;
                Thread.sleep(200);
            }
            assertTrue("Recognized exact sample words: " + value,
                    value.toLowerCase().contains("north gate") && value.toLowerCase().contains("opens at dawn"));
            scenario.onActivity(activity -> {
                assertTrue(activity.findViewById(SampleScreenActivity.HEAR_BUTTON_ID).performClick());
                assertTrue(((TextView) activity.findViewById(android.R.id.message)).getText().toString().contains("Speaking:"));
                assertTrue(activity.findViewById(SampleScreenActivity.REPEAT_BUTTON_ID).performClick());
                assertTrue(((TextView) activity.findViewById(android.R.id.message)).getText().toString().contains("The north gate"));
            });
        }
    }
}
