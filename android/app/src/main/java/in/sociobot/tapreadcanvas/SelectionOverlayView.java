package in.sociobot.tapreadcanvas;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.MotionEvent;
import android.view.View;

/** A transparent, touch-first rectangle drawer placed over the currently shared screen. */
final class SelectionOverlayView extends View {
    private final Paint shade = new Paint();
    private final Paint edge = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF frame = new RectF();
    private float startX;
    private float startY;

    SelectionOverlayView(Context context, RectF initial) {
        super(context);
        frame.set(initial);
        shade.setColor(0x66000000);
        edge.setColor(Color.rgb(228, 119, 67));
        edge.setStyle(Paint.Style.STROKE);
        edge.setStrokeWidth(6f);
        setContentDescription("Draw a rectangle around the text to read");
    }

    RectF frame() { return new RectF(frame); }

    @Override protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        // Shade the four outside bands instead of using a CLEAR blend mode;
        // this stays reliable on hardware-accelerated accessibility overlays.
        canvas.drawRect(0, 0, getWidth(), frame.top, shade);
        canvas.drawRect(0, frame.bottom, getWidth(), getHeight(), shade);
        canvas.drawRect(0, frame.top, frame.left, frame.bottom, shade);
        canvas.drawRect(frame.right, frame.top, getWidth(), frame.bottom, shade);
        canvas.drawRect(frame, edge);
    }

    @Override public boolean onTouchEvent(MotionEvent event) {
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                startX = event.getX(); startY = event.getY();
                frame.set(startX, startY, startX + 1, startY + 1);
                invalidate();
                return true;
            case MotionEvent.ACTION_MOVE:
            case MotionEvent.ACTION_UP:
                frame.set(Math.min(startX, event.getX()), Math.min(startY, event.getY()), Math.max(startX, event.getX()), Math.max(startY, event.getY()));
                RectF fixed = RegionMemory.clamp(frame, getWidth(), getHeight());
                frame.set(fixed);
                invalidate();
                return true;
            default:
                return true;
        }
    }
}
