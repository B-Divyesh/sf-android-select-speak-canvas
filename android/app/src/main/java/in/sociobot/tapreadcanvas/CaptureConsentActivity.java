package in.sociobot.tapreadcanvas;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

/**
 * Owns the platform MediaProjection consent prompt. It contains no capture
 * implementation so Android's permission UI stays the only way pixels enter
 * TapRead.
 */
public final class CaptureConsentActivity extends Activity {
    private static final int REQUEST_CAPTURE = 701;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        MediaProjectionManager manager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        startActivityForResult(manager.createScreenCaptureIntent(), REQUEST_CAPTURE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CAPTURE && resultCode == RESULT_OK && data != null) {
            Intent capture = new Intent(this, TapReadAccessibilityService.class)
                    .setAction(TapReadAccessibilityService.ACTION_CAPTURE)
                    .putExtra(TapReadAccessibilityService.EXTRA_RESULT_CODE, resultCode)
                    .putExtra(TapReadAccessibilityService.EXTRA_RESULT_DATA, data);
            ContextCompat.startForegroundService(this, capture);
        }
        finish();
    }
}
