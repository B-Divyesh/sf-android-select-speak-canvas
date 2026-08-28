package in.sociobot.tapreadcanvas;

import android.graphics.RectF;

/** Persisted normalized frame calculations for repeat-last-region. */
final class RegionMemory {
    private RegionMemory() { }

    static RectF defaultFrame(float width, float height) {
        return new RectF(width * .10f, height * .30f, width * .90f, height * .70f);
    }

    static RectF clamp(RectF frame, float width, float height) {
        float left = Math.max(0, Math.min(frame.left, width - 24));
        float top = Math.max(0, Math.min(frame.top, height - 24));
        float right = Math.max(left + 24, Math.min(frame.right, width));
        float bottom = Math.max(top + 24, Math.min(frame.bottom, height));
        return new RectF(left, top, right, bottom);
    }

    static RectF restore(float left, float top, float right, float bottom, float width, float height) {
        return clamp(new RectF(left * width, top * height, right * width, bottom * height), width, height);
    }
}
