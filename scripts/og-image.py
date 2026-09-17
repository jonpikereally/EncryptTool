#!/usr/bin/env python3
"""Render public/og.png without any image library.

The social card is drawn from a 5x7 bitmap font and written out as a raw PNG,
so the build has no dependency beyond a stock Python.
"""
import struct
import zlib
from pathlib import Path

WIDTH, HEIGHT = 1200, 630
BG = (0x0B, 0x0F, 0x14)
GRID = (0x16, 0x20, 0x2B)
ACCENT = (0x6F, 0xD3, 0xC7)
TEXT = (0xE6, 0xED, 0xF3)
DIM = (0x9F, 0xB0, 0xC0)

FONT = {
    "A": "01110 10001 10001 11111 10001 10001 10001",
    "B": "11110 10001 10001 11110 10001 10001 11110",
    "C": "01110 10001 10000 10000 10000 10001 01110",
    "D": "11100 10010 10001 10001 10001 10010 11100",
    "E": "11111 10000 10000 11110 10000 10000 11111",
    "F": "11111 10000 10000 11110 10000 10000 10000",
    "G": "01110 10001 10000 10111 10001 10001 01111",
    "H": "10001 10001 10001 11111 10001 10001 10001",
    "I": "11111 00100 00100 00100 00100 00100 11111",
    "J": "00111 00010 00010 00010 00010 10010 01100",
    "K": "10001 10010 10100 11000 10100 10010 10001",
    "L": "10000 10000 10000 10000 10000 10000 11111",
    "M": "10001 11011 10101 10101 10001 10001 10001",
    "N": "10001 11001 10101 10011 10001 10001 10001",
    "O": "01110 10001 10001 10001 10001 10001 01110",
    "P": "11110 10001 10001 11110 10000 10000 10000",
    "Q": "01110 10001 10001 10001 10101 10010 01101",
    "R": "11110 10001 10001 11110 10100 10010 10001",
    "S": "01111 10000 10000 01110 00001 00001 11110",
    "T": "11111 00100 00100 00100 00100 00100 00100",
    "U": "10001 10001 10001 10001 10001 10001 01110",
    "V": "10001 10001 10001 10001 10001 01010 00100",
    "W": "10001 10001 10001 10101 10101 11011 10001",
    "X": "10001 10001 01010 00100 01010 10001 10001",
    "Y": "10001 10001 01010 00100 00100 00100 00100",
    "Z": "11111 00001 00010 00100 01000 10000 11111",
    " ": "00000 00000 00000 00000 00000 00000 00000",
    "-": "00000 00000 00000 11111 00000 00000 00000",
    ".": "00000 00000 00000 00000 00000 00000 00100",
}

canvas = bytearray()
for _ in range(WIDTH * HEIGHT):
    canvas += bytes(BG)


def put(x, y, colour):
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        offset = (y * WIDTH + x) * 3
        canvas[offset : offset + 3] = bytes(colour)


def rect(x, y, w, h, colour):
    for row in range(y, y + h):
        for column in range(x, x + w):
            put(column, row, colour)


def text_width(value, scale, tracking=1):
    return len(value) * (5 + tracking) * scale - tracking * scale


def draw_text(value, x, y, scale, colour, tracking=1):
    cursor = x
    for char in value.upper():
        glyph = FONT.get(char, FONT[" "]).split()
        for row_index, row in enumerate(glyph):
            for column_index, bit in enumerate(row):
                if bit == "1":
                    rect(cursor + column_index * scale, y + row_index * scale, scale, scale, colour)
        cursor += (5 + tracking) * scale


def centre(value, y, scale, colour, tracking=1):
    draw_text(value, (WIDTH - text_width(value, scale, tracking)) // 2, y, scale, colour, tracking)


# Faint grid, as a nod to the worksheets.
for x in range(0, WIDTH, 40):
    rect(x, 0, 1, HEIGHT, GRID)
for y in range(0, HEIGHT, 40):
    rect(0, y, WIDTH, 1, GRID)

rect(0, 0, WIDTH, 8, ACCENT)
rect(0, HEIGHT - 8, WIDTH, 8, ACCENT)

centre("ENCRYPT YOUR LIFE", 205, 11, TEXT, tracking=1)
centre("ENCRYPTION TOOLS AND PASSWORDS", 345, 6, ACCENT, tracking=1)
centre("WRITTEN DOWN - NEVER STORED ON A COMPUTER", 440, 4, DIM, tracking=1)

raw = bytearray()
for y in range(HEIGHT):
    raw.append(0)
    start = y * WIDTH * 3
    raw += canvas[start : start + WIDTH * 3]


def chunk(kind, data):
    body = kind + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
png += chunk(b"IEND", b"")

out = Path(__file__).resolve().parent.parent / "public" / "og.png"
out.write_bytes(png)
print(f"wrote {out} ({len(png)} bytes)")
