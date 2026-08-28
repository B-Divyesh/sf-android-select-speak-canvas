package in.sociobot.tapreadcanvas;

import android.accessibilityservice.AccessibilityService;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.RectF;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.nio.ByteBuffer;
import java.util.Locale;

/**
 * The native companion path. It observes no accessibility node/content events;
 * its only input is a person-triggered Android MediaProjection frame.
 */
public final class TapReadAccessibilityService extends AccessibilityService {
    static final String ACTION_CAPTURE = "in.sociobot.tapreadcanvas.CAPTURE";
    static final String EXTRA_RESULT_CODE = "result_code";
    static final String EXTRA_RESULT_DATA = "result_data";
    private static final String CHANNEL_ID = "tapread_capture";
    private static final int NOTIFICATION_ID = 417;

    private WindowManager windows;
    private TextView trigger;
    private FrameLayout selectionRoot;
    private SelectionOverlayView selectionView;
    private Bitmap capturedScreen;
    private TextToSpeech tts;
    private TextRecognizer recognizer;
    private final Handler main = new Handler(Looper.getMainLooper());
    private SharedPreferences saved;

    @Override public void onServiceConnected() {
        super.onServiceConnected();
        saved = getSharedPreferences("tapread_native", MODE_PRIVATE);
        windows = (WindowManager) getSystemService(WINDOW_SERVICE);
        recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        tts = new TextToSpeech(this, status -> { if (status == TextToSpeech.SUCCESS) tts.setLanguage(Locale.getDefault()); });
        createCaptureChannel();
        showTrigger();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_CAPTURE.equals(intent.getAction())) {
            int resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0);
            Intent resultData = intent.getParcelableExtra(EXTRA_RESULT_DATA);
            if (resultCode != 0 && resultData != null) captureOnce(resultCode, resultData);
        }
        return START_NOT_STICKY;
    }

    private void showTrigger() {
        if (trigger != null) return;
        trigger = new TextView(this);
        trigger.setText("TapRead\nRead screen");
        trigger.setTextColor(0xff182522);
        trigger.setTextSize(14);
        trigger.setGravity(Gravity.CENTER);
        trigger.setContentDescription("TapRead: choose a screen region to read aloud");
        trigger.setBackgroundColor(0xffE47743);
        trigger.setPadding(16, 12, 16, 12);
        trigger.setOnClickListener(v -> requestCaptureConsent());
        WindowManager.LayoutParams params = overlayParams(132, 72);
        params.gravity = Gravity.END | Gravity.CENTER_VERTICAL;
        params.x = 16;
        windows.addView(trigger, params);
    }

    private WindowManager.LayoutParams overlayParams(int width, int height) {
        return new WindowManager.LayoutParams(width, height,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
    }

    private void requestCaptureConsent() {
        Intent consent = new Intent(this, CaptureConsentActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(consent);
    }

    private void captureOnce(int resultCode, @NonNull Intent resultData) {
        startForeground(NOTIFICATION_ID, captureNotification());
        MediaProjection projection = ((android.media.projection.MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE))
                .getMediaProjection(resultCode, resultData);
        if (projection == null) { announce("Android did not provide a screen to read."); stopForeground(true); return; }
        android.util.DisplayMetrics metrics = getResources().getDisplayMetrics();
        int width = metrics.widthPixels;
        int height = metrics.heightPixels;
        ImageReader reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2);
        VirtualDisplay display = projection.createVirtualDisplay("TapRead selected screen", width, height, metrics.densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader.getSurface(), null, main);
        reader.setOnImageAvailableListener(source -> {
            Image image = source.acquireLatestImage();
            if (image == null) return;
            Bitmap bitmap = bitmapFrom(image, width, height);
            image.close();
            source.setOnImageAvailableListener(null, null);
            source.close();
            display.release();
            projection.stop();
            stopForeground(true);
            if (ScreenSafety.isLikelyProtectedBlank(bitmap)) {
                announce("This screen is protected or blank. TapRead will not bypass Android or DRM capture protections.");
                return;
            }
            capturedScreen = bitmap;
            main.post(this::showSelection);
        }, main);
    }

    private Bitmap bitmapFrom(Image image, int width, int height) {
        Image.Plane plane = image.getPlanes()[0];
        ByteBuffer buffer = plane.getBuffer();
        int paddedWidth = width + (plane.getRowStride() - plane.getPixelStride() * width) / plane.getPixelStride();
        Bitmap padded = Bitmap.createBitmap(paddedWidth, height, Bitmap.Config.ARGB_8888);
        padded.copyPixelsFromBuffer(buffer);
        return Bitmap.createBitmap(padded, 0, 0, width, height);
    }

    private void showSelection() {
        removeSelection();
        int screenWidth = getResources().getDisplayMetrics().widthPixels;
        int screenHeight = getResources().getDisplayMetrics().heightPixels;
        RectF initial = saved.contains("left")
                ? RegionMemory.restore(saved.getFloat("left", .1f), saved.getFloat("top", .3f), saved.getFloat("right", .9f), saved.getFloat("bottom", .7f), screenWidth, screenHeight)
                : RegionMemory.defaultFrame(screenWidth, screenHeight);
        selectionRoot = new FrameLayout(this);
        selectionView = new SelectionOverlayView(this, initial);
        selectionRoot.addView(selectionView, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        LinearLayout actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        actions.setPadding(16, 16, 16, 32);
        actions.setBackgroundColor(0xee192421);
        Button cancel = actionButton("Cancel", v -> removeSelection());
        Button read = actionButton("Read selection", v -> readSelection());
        Button repeat = actionButton("Repeat last", v -> repeatLast());
        actions.addView(cancel, new LinearLayout.LayoutParams(0, 56, 1));
        actions.addView(read, new LinearLayout.LayoutParams(0, 56, 2));
        actions.addView(repeat, new LinearLayout.LayoutParams(0, 56, 1));
        FrameLayout.LayoutParams actionsLayout = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM);
        selectionRoot.addView(actions, actionsLayout);
        windows.addView(selectionRoot, overlayParams(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT));
        announce("Draw a rectangle around text, then choose Read selection.");
    }

    private Button actionButton(String label, android.view.View.OnClickListener listener) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(14);
        button.setAllCaps(false);
        button.setOnClickListener(listener);
        return button;
    }

    private void readSelection() {
        if (capturedScreen == null || selectionView == null) return;
        RectF frame = RegionMemory.clamp(selectionView.frame(), selectionView.getWidth(), selectionView.getHeight());
        saved.edit()
                .putFloat("left", frame.left / selectionView.getWidth()).putFloat("top", frame.top / selectionView.getHeight())
                .putFloat("right", frame.right / selectionView.getWidth()).putFloat("bottom", frame.bottom / selectionView.getHeight()).apply();
        float scaleX = (float) capturedScreen.getWidth() / selectionView.getWidth();
        float scaleY = (float) capturedScreen.getHeight() / selectionView.getHeight();
        Rect crop = new Rect(Math.round(frame.left * scaleX), Math.round(frame.top * scaleY), Math.round(frame.right * scaleX), Math.round(frame.bottom * scaleY));
        crop.intersect(0, 0, capturedScreen.getWidth(), capturedScreen.getHeight());
        if (crop.width() < 24 || crop.height() < 24) { announce("Make the selection larger, then try again."); return; }
        removeSelection();
        Bitmap region = Bitmap.createBitmap(capturedScreen, crop.left, crop.top, crop.width(), crop.height());
        announce("Reading selected text locally.");
        recognizer.process(InputImage.fromBitmap(region, 0))
                .addOnSuccessListener(result -> {
                    String text = result.getText().trim();
                    if (text.isEmpty()) { announce("No text was found. Draw a tighter frame and try again."); return; }
                    saved.edit().putString("last_text", text).apply();
                    speak(text);
                })
                .addOnFailureListener(error -> announce("TapRead could not read that region. Try a clearer frame."));
    }

    private void repeatLast() {
        String text = saved.getString("last_text", "");
        if (text.isEmpty()) announce("There is no previous reading yet."); else { removeSelection(); speak(text); }
    }

    private void speak(String text) {
        if (tts == null) { announce("Text to speech is not ready. Try again in a moment."); return; }
        tts.stop();
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tapread-last-region");
        announce("Speaking selected text. Use the TapRead button to frame another region.");
    }

    private void removeSelection() {
        if (selectionRoot != null) {
            try { windows.removeView(selectionRoot); } catch (IllegalArgumentException ignored) { }
            selectionRoot = null;
            selectionView = null;
        }
    }

    private void announce(String message) { main.post(() -> android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_LONG).show()); }

    private void createCaptureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "TapRead screen capture", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Shown only while TapRead is framing a screen you chose.");
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(channel);
        }
    }

    private Notification captureNotification() {
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID) : new Notification.Builder(this);
        return builder
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentTitle(getString(R.string.capture_notification_title))
                .setContentText(getString(R.string.capture_notification_text))
                .setOngoing(true)
                .build();
    }

    @Override public void onInterrupt() { if (tts != null) tts.stop(); }

    @Override public void onDestroy() {
        removeSelection();
        if (trigger != null) { try { windows.removeView(trigger); } catch (IllegalArgumentException ignored) { } trigger = null; }
        if (tts != null) { tts.shutdown(); tts = null; }
        if (recognizer != null) { recognizer.close(); recognizer = null; }
        super.onDestroy();
    }
}
