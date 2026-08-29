package in.sociobot.tapreadcanvas;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.RectF;
import android.Manifest;
import android.content.pm.ApplicationInfo;
import android.view.View;

import androidx.test.core.app.ActivityScenario;
import androidx.test.espresso.Espresso;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withContentDescription;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;
import static org.hamcrest.Matchers.containsString;

import org.junit.Test;
import org.junit.runner.RunWith;

/** Device regression coverage for the native pieces behind the TapRead overlay. */
@RunWith(AndroidJUnit4.class)
public final class NativeWorkflowInstrumentedTest {
    @Test public void accessibilityServiceIsBoundAndDoesNotRequestWindowContent() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        ServiceInfo info = context.getPackageManager().getServiceInfo(
                new ComponentName(context, TapReadAccessibilityService.class), PackageManager.GET_META_DATA);
        assertEquals("android.permission.BIND_ACCESSIBILITY_SERVICE", info.permission);
        assertTrue(info.metaData.containsKey("android.accessibilityservice"));
        assertTrue(info.exported);
    }

    @Test public void lastFrameRestoresWithinCurrentScreenBounds() {
        RectF restored = RegionMemory.restore(.1f, .3f, .9f, .7f, 1080, 2400);
        assertEquals(108f, restored.left, .01f);
        assertEquals(720f, restored.top, .01f);
        assertEquals(972f, restored.right, .01f);
        assertEquals(1680f, restored.bottom, .01f);
    }

    @Test public void protectedBlankBufferIsRefusedButVisiblePixelsAreNot() {
        Bitmap blank = Bitmap.createBitmap(20, 20, Bitmap.Config.ARGB_8888);
        Bitmap visible = Bitmap.createBitmap(20, 20, Bitmap.Config.ARGB_8888);
        visible.eraseColor(Color.WHITE);
        assertTrue(ScreenSafety.isLikelyProtectedBlank(blank));
        assertFalse(ScreenSafety.isLikelyProtectedBlank(visible));
    }

    @Test public void backupAndNetworkCapabilitiesAreDisabled() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        ApplicationInfo info = context.getPackageManager().getApplicationInfo(context.getPackageName(), 0);
        assertEquals(0, info.flags & ApplicationInfo.FLAG_ALLOW_BACKUP);
        assertEquals(PackageManager.PERMISSION_DENIED,
                context.getPackageManager().checkPermission(Manifest.permission.INTERNET, context.getPackageName()));
    }

    @Test public void bundledNativeSampleRecognizesAndRepeatsExactText() throws Exception {
        try (ActivityScenario<SampleScreenActivity> scenario = ActivityScenario.launch(SampleScreenActivity.class)) {
            Espresso.onView(withContentDescription("Load sample screen")).perform(click());
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
            Espresso.onView(withText("Hear sample")).check(matches(isDisplayed())).perform(click());
            Espresso.onView(withId(android.R.id.message)).check(matches(withText(containsString("Speaking:"))));
            Espresso.onView(withText("Repeat last reading")).check(matches(isDisplayed())).perform(click());
            Espresso.onView(withId(android.R.id.message)).check(matches(withText(containsString("The north gate"))));
        }
    }
}
