package in.sociobot.tapreadcanvas;

import android.graphics.Bitmap;

/** Pure screen-safety checks, kept separate so they have JVM regression tests. */
final class ScreenSafety {
    private ScreenSafety() { }

    /**
     * FLAG_SECURE / protected surfaces normally arrive through MediaProjection
     * as a fully black buffer. Refuse it rather than trying to enhance or
     * reconstruct anything.
     */
    static boolean isLikelyProtectedBlank(Bitmap bitmap) {
        if (bitmap == null || bitmap.getWidth() == 0 || bitmap.getHeight() == 0) return true;
        int samples = 0;
        int nonBlack = 0;
        int stepX = Math.max(1, bitmap.getWidth() / 24);
        int stepY = Math.max(1, bitmap.getHeight() / 24);
        for (int y = 0; y < bitmap.getHeight(); y += stepY) {
            for (int x = 0; x < bitmap.getWidth(); x += stepX) {
                int color = bitmap.getPixel(x, y);
                if (((color >> 16) & 0xff) > 8 || ((color >> 8) & 0xff) > 8 || (color & 0xff) > 8) nonBlack++;
                samples++;
            }
        }
        return samples > 0 && nonBlack == 0;
    }
}
