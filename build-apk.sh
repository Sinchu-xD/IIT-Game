#!/bin/bash
set -e

PROJECT="/home/ubuntu/indian-idle-tycoon"
ANDROID="$PROJECT/android"
GRADLE="/home/ubuntu/gradle/gradle-8.11.1"
OUTPUT="$PROJECT/output"
ASSETS_SRC="$PROJECT/android/app/src/main/assets"

echo "========================================"
echo "  Indian Idle Tycoon - APK Builder"
echo "========================================"
echo ""

# Step 1: Sync assets
echo "[1/5] Syncing web assets..."
mkdir -p "$ASSETS_SRC"
cp "$PROJECT/index.html" "$ASSETS_SRC/"
cp -r "$PROJECT/css" "$ASSETS_SRC/"
cp -r "$PROJECT/js" "$ASSETS_SRC/"
cp -r "$PROJECT/lib" "$ASSETS_SRC/"
echo "  Assets synced."

# Step 2: Generate launcher icons (colored square PNGs)
echo "[2/5] Generating launcher icons..."
ICON_DIR="$ANDROID/app/src/main/res"
python3 -c "
import struct, zlib

def make_png(filename, size, r, g, b):
    width, height = size, size
    raw = b''
    for y in range(height):
        raw += b'\\x00'  # filter none
        for x in range(width):
            # Draw a simple circle icon
            cx, cy = width // 2, height // 2
            dx, dy = x - cx, y - cy
            dist = (dx*dx + dy*dy) ** 0.5
            radius = width * 0.4

            if dist < radius * 0.3:
                # Inner circle - yellow (₹ coin)
                pr, pg, pb = 0xFF, 0xD7, 0x00
            elif dist < radius:
                # Outer circle - green (Indian flag)
                pr, pg, pb = 0x00, 0x66, 0x33
            else:
                # Background - transparent
                pr, pg, pb = 0, 0, 0
                raw += b'\\x00\\x00\\x00\\x00'
                continue
            raw += bytes([pr, pg, pb, 0xFF])

    def make_chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack('>I', len(data)) + c + crc

    sig = b'\\x89PNG\\r\\n\\x1a\\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw)
    with open(filename, 'wb') as f:
        f.write(sig + make_chunk(b'IHDR', ihdr) + make_chunk(b'IDAT', idat) + make_chunk(b'IEND', b''))

sizes = {'hdpi': 72, 'mdpi': 48, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for name, size in sizes.items():
    make_png(f'$ICON_DIR/mipmap-{name}/ic_launcher.png', size, 0, 102, 51)
    make_png(f'$ICON_DIR/mipmap-{name}/ic_launcher_round.png', size, 0, 102, 51)
print('  Icons generated.')
" 2>/dev/null || echo "  Icon generation skipped (Python PNG tool may need adjustment)"

# Fallback: create simple colored PNGs
python3 -c "
import struct, zlib, os

def create_simple_png(path, size, r, g, b):
    width = height = size
    raw = b''
    cx, cy = width // 2, height // 2
    for y in range(height):
        raw += b'\\x00'
        for x in range(width):
            dx, dy = x - cx, y - cy
            dist = (dx*dx + dy*dy) ** 0.5
            radius = width * 0.42
            if dist <= radius:
                raw += bytes([r, g, b, 255])
            else:
                raw += bytes([0, 0, 0, 0])

    sig = b'\\x89PNG\\r\\n\\x1a\\n'
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw)
    with open(path, 'wb') as f:
        f.write(sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b''))

sizes = {'hdpi': 72, 'mdpi': 48, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for name, size in sizes.items():
    create_simple_png(f'$ICON_DIR/mipmap-{name}/ic_launcher.png', size, 0, 150, 60)
    create_simple_png(f'$ICON_DIR/mipmap-{name}/ic_launcher_round.png', size, 0, 150, 60)
print('  Icons generated successfully.')
"

# Step 3: Build APK
echo "[3/5] Building APK with Gradle..."
cd "$ANDROID"
"$GRADLE/bin/gradle" --no-daemon assembleRelease 2>&1 | tail -30

# Step 4: Find and copy APK
echo "[4/5] Locating APK..."
APK=$(find "$ANDROID" -name "*.apk" -path "*/build/outputs/apk/*" 2>/dev/null | head -1)
if [ -n "$APK" ]; then
    mkdir -p "$OUTPUT"
    cp "$APK" "$OUTPUT/indian-idle-tycoon-v1.1.0.apk"
    /home/ubuntu/android-sdk/build-tools/34.0.0/apksigner sign --ks "$ANDROID/debug.keystore" --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android --v4-signing-enabled true "$OUTPUT/indian-idle-tycoon-v1.1.0.apk" 2>/dev/null || true
    SIZE=$(du -h "$OUTPUT/indian-idle-tycoon-v1.1.0.apk" | cut -f1)
    echo ""
    echo "========================================"
    echo "  ✅ APK BUILD SUCCESSFUL!"
    echo "========================================"
    echo "  Path: $OUTPUT/indian-idle-tycoon-v1.1.0.apk"
    echo "  Size: $SIZE"
    echo "  Version: 1.1.0"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "  ⚠️  APK not found - checking for build output..."
    echo "========================================"
    find "$ANDROID" -name "*.apk" 2>/dev/null
    find "$ANDROID" -path "*/build/*" -name "*.apk" 2>/dev/null
    ls -la "$ANDROID/app/build/outputs/" 2>/dev/null || echo "No build outputs found"
fi

echo "[5/5] Done."
