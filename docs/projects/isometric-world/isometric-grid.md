Ah, you're right - the artifact viewer can't render R3F components since they require npm dependencies. Let me create a **self-contained HTML version** that will actually run:This version should work! It's a self-contained HTML file with Three.js loaded via CDN.

**What you should see:**

- A 32×32 chessboard grid (1024 tiles)
- ~30 colorful floating blocks scattered across + a 5-block tower
- **Drag** to orbit the camera around
- **Scroll** to zoom in/out
- **Hover** tiles and blocks to see them highlight
- **Click** blocks to select them (turns gold)

The info panel in the top-left shows real-time state of what's being hovered and selected.

If it's still blank, try opening the HTML file directly in your browser by downloading it. Sometimes the iframe sandbox can block WebGL. Let me know what you see!
