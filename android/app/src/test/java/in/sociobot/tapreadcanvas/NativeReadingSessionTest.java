package in.sociobot.tapreadcanvas;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

public final class NativeReadingSessionTest {
    @Test public void recognizedFixtureIsSavedSpokenAndRepeatedExactly() {
        final String[] saved = {""};
        List<String> spoken = new ArrayList<>();
        NativeReadingSession session = new NativeReadingSession(new NativeReadingSession.Store() {
            @Override public void save(String text) { saved[0] = text; }
            @Override public String load() { return saved[0]; }
        }, spoken::add);

        assertEquals("The north gate opens at dawn.", session.acceptRecognition(" The north gate\nopens at dawn. "));
        assertEquals("The north gate opens at dawn.", saved[0]);
        assertEquals("The north gate opens at dawn.", session.repeat());
        assertEquals(List.of("The north gate opens at dawn.", "The north gate opens at dawn."), spoken);
    }

    @Test public void blankRecognitionIsNotSavedOrSpoken() {
        List<String> spoken = new ArrayList<>();
        NativeReadingSession session = new NativeReadingSession(new NativeReadingSession.Store() {
            @Override public void save(String text) { throw new AssertionError("blank text was saved"); }
            @Override public String load() { return ""; }
        }, spoken::add);

        assertEquals("", session.acceptRecognition("  \n  "));
        assertEquals(List.of(), spoken);
    }
}
