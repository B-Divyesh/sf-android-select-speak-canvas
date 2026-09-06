package in.sociobot.tapreadcanvas;

import static org.junit.Assert.assertTrue;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Bundle;
import android.os.SystemClock;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.google.android.gms.tasks.Tasks;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Locale;
import java.util.concurrent.TimeUnit;

/** Repeatable device benchmark for the researched 30-region success measure. */
@RunWith(AndroidJUnit4.class)
public final class NativeOcrBenchmarkInstrumentedTest {
    private static final String[] PHRASES = {
            "Open the inventory", "Checkpoint reached", "Resume saved game",
            "The bridge is closed", "Press start to continue", "Remote desktop connected",
            "New message received", "Turn left at the gate", "Battery level is low",
            "Settings saved locally"
    };

    @Test public void thirtyRegionsMeetAccuracyAndLatencyTarget() throws Exception {
        int correct = 0;
        int correctWithinTwoSeconds = 0;
        long slowestMs = 0;
        try (TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)) {
            // Exclude one-time model initialization from the repeated-region measure.
            Tasks.await(recognizer.process(InputImage.fromBitmap(region(PHRASES[0]), 0)), 30, TimeUnit.SECONDS);
            for (int index = 0; index < 30; index += 1) {
                String expected = PHRASES[index % PHRASES.length];
                long started = SystemClock.elapsedRealtime();
                String actual = Tasks.await(
                        recognizer.process(InputImage.fromBitmap(region(expected), 0)),
                        15, TimeUnit.SECONDS).getText();
                long elapsedMs = SystemClock.elapsedRealtime() - started;
                slowestMs = Math.max(slowestMs, elapsedMs);
                if (normalize(expected).equals(normalize(actual))) {
                    correct += 1;
                    if (elapsedMs <= 2_000) correctWithinTwoSeconds += 1;
                }
            }
        }
        Bundle evidence = new Bundle();
        evidence.putString("stream", String.format(Locale.ROOT,
                "TapRead 30-region benchmark: correct=%d/30, correctWithin2s=%d/30, slowestMs=%d\n",
                correct, correctWithinTwoSeconds, slowestMs));
        InstrumentationRegistry.getInstrumentation().sendStatus(2, evidence);
        assertTrue("At least 24 of 30 regions must be recognized correctly; got " + correct, correct >= 24);
        assertTrue("At least 24 of 30 regions must be correct within two seconds; got "
                + correctWithinTwoSeconds + ", slowestMs=" + slowestMs, correctWithinTwoSeconds >= 24);
    }

    private static Bitmap region(String text) {
        Bitmap bitmap = Bitmap.createBitmap(1280, 320, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.rgb(37, 76, 69));
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(Color.rgb(255, 248, 232));
        paint.setTextSize(64);
        paint.setFakeBoldText(true);
        canvas.drawText(text, 48, 185, paint);
        return bitmap;
    }

    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }
}
