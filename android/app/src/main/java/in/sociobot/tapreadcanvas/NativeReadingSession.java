package in.sociobot.tapreadcanvas;

/** Small deterministic state machine shared by the service and JVM outcome tests. */
final class NativeReadingSession {
    interface Store {
        void save(String text);
        String load();
    }

    interface Speaker {
        void speak(String text);
    }

    private final Store store;
    private final Speaker speaker;

    NativeReadingSession(Store store, Speaker speaker) {
        this.store = store;
        this.speaker = speaker;
    }

    String acceptRecognition(String rawText) {
        String text = rawText == null ? "" : rawText.replaceAll("\\s+", " ").trim();
        if (text.isEmpty()) return "";
        store.save(text);
        speaker.speak(text);
        return text;
    }

    String repeat() {
        String text = store.load();
        if (text == null || text.trim().isEmpty()) return "";
        speaker.speak(text);
        return text;
    }
}
