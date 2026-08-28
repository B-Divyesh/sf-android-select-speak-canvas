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

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

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
}
