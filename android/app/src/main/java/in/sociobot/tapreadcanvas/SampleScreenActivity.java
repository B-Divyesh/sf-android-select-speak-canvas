package in.sociobot.tapreadcanvas;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.Nullable;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.util.Locale;

/** A bundled, account-free first-run sample of the native recognition and speech path. */
public final class SampleScreenActivity extends Activity {
    static final String SAMPLE_TEXT = "The north gate opens at dawn.";
    static final int LOAD_BUTTON_ID = 0x1f000001;
    static final int HEAR_BUTTON_ID = 0x1f000002;
    static final int REPEAT_BUTTON_ID = 0x1f000003;
    private LinearLayout root;
    private TextView status;
    private TextToSpeech speech;
    private TextRecognizer recognizer;
    private String recognized = "";

    @Override protected void onCreate(@Nullable Bundle state) {
        super.onCreate(state);
        recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        speech = new TextToSpeech(this, result -> {
            if (result == TextToSpeech.SUCCESS) speech.setLanguage(Locale.getDefault());
        });
        showIntro();
    }

    private void showIntro() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setPadding(32, 48, 32, 48);
        root.setBackgroundColor(Color.rgb(242, 231, 206));
        root.addView(text("Try TapRead with sample text", 28, true));
        root.addView(text("This bundled screen uses no capture permission and saves no personal content.", 18, false));
        Button load = button("Load sample screen");
        load.setId(LOAD_BUTTON_ID);
        load.setContentDescription("Load sample screen");
        load.setOnClickListener(view -> loadSample());
        root.addView(load);
        setContentView(root);
    }

    private void loadSample() {
        Bitmap sample = Bitmap.createBitmap(1200, 700, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(sample);
        canvas.drawColor(Color.rgb(37, 76, 69));
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(Color.rgb(255, 248, 232));
        paint.setTextSize(72);
        paint.setFakeBoldText(true);
        canvas.drawText("The north gate", 120, 280, paint);
        canvas.drawText("opens at dawn.", 120, 390, paint);

        root.removeAllViews();
        ImageView image = new ImageView(this);
        image.setImageBitmap(sample);
        image.setAdjustViewBounds(true);
        image.setContentDescription("Sample screen with an orange selection around the words The north gate opens at dawn");
        root.addView(image, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));
        status = text("Recognizing the sample on this device…", 18, true);
        status.setId(android.R.id.message);
        status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        root.addView(status);
        recognizer.process(InputImage.fromBitmap(sample, 0))
                .addOnSuccessListener(result -> {
                    recognized = result.getText().replace('\n', ' ').replaceAll("\\s+", " ").trim();
                    status.setText(recognized.isEmpty() ? "No text found in the sample." : recognized);
                    addSpeechControls();
                })
                .addOnFailureListener(error -> status.setText("The sample could not be recognized. Try again."));
    }

    private void addSpeechControls() {
        Button hear = button("Hear sample");
        hear.setId(HEAR_BUTTON_ID);
        hear.setOnClickListener(view -> speakRecognized());
        Button repeat = button("Repeat last reading");
        repeat.setId(REPEAT_BUTTON_ID);
        repeat.setOnClickListener(view -> speakRecognized());
        root.addView(hear);
        root.addView(repeat);
    }

    private void speakRecognized() {
        if (recognized.isEmpty()) return;
        speech.stop();
        speech.speak(recognized, TextToSpeech.QUEUE_FLUSH, null, "tapread-sample");
        status.setText("Speaking: " + recognized);
    }

    private TextView text(String value, float size, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(Color.rgb(24, 37, 34));
        view.setGravity(Gravity.CENTER);
        view.setPadding(8, 16, 8, 16);
        if (bold) view.setTypeface(view.getTypeface(), android.graphics.Typeface.BOLD);
        return view;
    }

    private Button button(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setMinHeight(56);
        return button;
    }

    @Override protected void onDestroy() {
        if (recognizer != null) recognizer.close();
        if (speech != null) speech.shutdown();
        super.onDestroy();
    }
}
