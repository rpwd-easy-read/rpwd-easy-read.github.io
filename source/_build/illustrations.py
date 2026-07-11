"""Generate Easy-Read illustrations for the RPwD Act guide.

Uses Pillow to draw simple comic-strip style scenes with bright colors,
thick outlines, and friendly cartoon proportions. Each drawing is rendered
at 2x supersample for anti-aliasing then scaled to 800x800 PNG.

Run: python _build/illustrations.py
Output: assets/illustrations/<name>.png
"""

import os
from PIL import Image, ImageDraw

# ============================================================
# colors — bright comic-strip palette
# ============================================================

WHITE       = (255, 255, 255)
CREAM       = (255, 250, 240)
BLACK       = (20, 20, 20)
GREY        = (160, 160, 160)
LIGHT_GREY  = (220, 220, 220)
SKIN        = (255, 222, 184)
SKIN_DARK   = (210, 160, 120)
HAIR_BROWN  = (90, 55, 30)
HAIR_BLACK  = (40, 30, 25)
VS_BLUE     = (0, 176, 240)
VS_PINK     = (240, 128, 176)
GREEN       = (76, 175, 80)
LIME        = (174, 213, 80)
YELLOW      = (255, 200, 50)
ORANGE      = (255, 138, 60)
RED         = (229, 70, 60)
PURPLE      = (156, 95, 207)
TEAL        = (38, 166, 154)
INDIGO      = (94, 100, 200)
BROWN       = (140, 100, 70)
WOOD        = (190, 140, 90)
SKY         = (180, 220, 255)

# ============================================================
# canvas
# ============================================================

W = 1600          # 2x supersample width
LW = 14           # outline width at 2x scale
LW_THIN = 8

OUT_DIR = r"C:\Users\deepa\Projects\rpwd-easy-read\assets\illustrations"
os.makedirs(OUT_DIR, exist_ok=True)


def new_canvas(bg=WHITE):
    return Image.new("RGB", (W, W), bg)


def save(img, name, target=800):
    out = img.resize((target, target), Image.LANCZOS)
    out.save(os.path.join(OUT_DIR, f"{name}.png"), "PNG")


# ============================================================
# primitive helpers
# ============================================================

def head(d, cx, cy, r=120, skin=SKIN, hair=HAIR_BROWN, hair_style="round"):
    """Draw a head with hair, eyes and a smile."""
    if hair_style == "round":
        d.ellipse([cx - r - 12, cy - r - 24, cx + r + 12, cy + r // 4],
                  fill=hair, outline=BLACK, width=LW)
    elif hair_style == "long":
        d.ellipse([cx - r - 18, cy - r - 16, cx + r + 18, cy + r + 30],
                  fill=hair, outline=BLACK, width=LW)
    elif hair_style == "bald":
        pass
    # face
    d.ellipse([cx - r, cy - r, cx + r, cy + r],
              fill=skin, outline=BLACK, width=LW)
    # eyes
    eye_off_x = r * 4 // 10
    eye_y = cy - r // 6
    eye_w = max(8, r // 8)
    d.ellipse([cx - eye_off_x - eye_w, eye_y - eye_w, cx - eye_off_x + eye_w, eye_y + eye_w], fill=BLACK)
    d.ellipse([cx + eye_off_x - eye_w, eye_y - eye_w, cx + eye_off_x + eye_w, eye_y + eye_w], fill=BLACK)
    # smile (arc)
    sm_w = r * 6 // 10
    sm_top = cy + r // 6
    d.arc([cx - sm_w, sm_top - sm_w // 2, cx + sm_w, sm_top + sm_w],
          start=20, end=160, fill=BLACK, width=LW)


def body_trapezoid(d, cx, top_y, bot_y, top_w=220, bot_w=300, color=VS_BLUE):
    d.polygon([
        (cx - top_w // 2, top_y),
        (cx + top_w // 2, top_y),
        (cx + bot_w // 2, bot_y),
        (cx - bot_w // 2, bot_y),
    ], fill=color, outline=BLACK, width=LW)


def arm(d, sx, sy, hx, hy, skin=SKIN):
    d.line([(sx, sy), (hx, hy)], fill=BLACK, width=int(LW * 1.6))
    d.ellipse([hx - 30, hy - 30, hx + 30, hy + 30],
              fill=skin, outline=BLACK, width=LW)


def legs_pants(d, cx, top_y, bot_y, span=70, color=BLACK):
    """Two legs as thick lines, with feet."""
    d.line([(cx - span // 2, top_y), (cx - span, bot_y)], fill=color, width=int(LW * 2.2))
    d.line([(cx + span // 2, top_y), (cx + span, bot_y)], fill=color, width=int(LW * 2.2))
    # feet
    d.line([(cx - span - 35, bot_y), (cx - span + 35, bot_y)], fill=BLACK, width=int(LW * 1.8))
    d.line([(cx + span - 35, bot_y), (cx + span + 35, bot_y)], fill=BLACK, width=int(LW * 1.8))


def ground(d, y=1380):
    d.line([(60, y), (W - 60, y)], fill=BLACK, width=LW)
    # little grass tufts
    for x in range(140, W - 60, 220):
        d.line([(x, y), (x - 14, y - 24)], fill=GREEN, width=LW_THIN)
        d.line([(x, y), (x + 14, y - 24)], fill=GREEN, width=LW_THIN)
        d.line([(x + 4, y), (x + 4, y - 28)], fill=GREEN, width=LW_THIN)


def sun_or_star(d, cx, cy, r=90, color=YELLOW):
    """A friendly sun in the corner."""
    d.ellipse([cx - r, cy - r, cx + r, cy + r],
              fill=color, outline=BLACK, width=LW)
    for ang in range(0, 360, 45):
        import math
        x1 = cx + (r + 25) * math.cos(math.radians(ang))
        y1 = cy + (r + 25) * math.sin(math.radians(ang))
        x2 = cx + (r + 80) * math.cos(math.radians(ang))
        y2 = cy + (r + 80) * math.sin(math.radians(ang))
        d.line([(x1, y1), (x2, y2)], fill=BLACK, width=LW)


# ============================================================
# illustrations
# ============================================================

def il_equality():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    sun_or_star(d, 1380, 220, 80, YELLOW)
    # left person — tall, blue shirt
    cx_a = 470
    head(d, cx_a, 360, r=130, hair=HAIR_BROWN)
    body_trapezoid(d, cx_a, 510, 920, top_w=220, bot_w=320, color=VS_BLUE)
    arm(d, cx_a - 110, 540, cx_a - 220, 760)
    arm(d, cx_a + 110, 540, cx_a + 220, 760)
    legs_pants(d, cx_a, 920, 1340, span=90, color=BLACK)
    # right person — wheelchair user, pink shirt
    cx_b = 1130
    head(d, cx_b, 460, r=120, hair=HAIR_BLACK, hair_style="long")
    body_trapezoid(d, cx_b, 600, 850, top_w=210, bot_w=280, color=VS_PINK)
    arm(d, cx_b - 105, 630, cx_b - 200, 800)
    arm(d, cx_b + 105, 630, cx_b + 200, 800)
    # wheelchair frame
    d.rounded_rectangle([cx_b - 160, 850, cx_b + 160, 1050], radius=30,
                        fill=GREY, outline=BLACK, width=LW)
    # wheels
    d.ellipse([cx_b - 220, 1080, cx_b - 60, 1240], fill=WHITE, outline=BLACK, width=int(LW * 1.7))
    d.ellipse([cx_b - 195, 1105, cx_b - 85, 1215], outline=BLACK, width=LW_THIN, fill=LIGHT_GREY)
    d.ellipse([cx_b + 60, 1080, cx_b + 220, 1240], fill=WHITE, outline=BLACK, width=int(LW * 1.7))
    d.ellipse([cx_b + 85, 1105, cx_b + 195, 1215], outline=BLACK, width=LW_THIN, fill=LIGHT_GREY)
    # spokes
    for ang in range(0, 360, 45):
        import math
        for sign, base_x in ((-1, cx_b - 140), (1, cx_b + 140)):
            x = base_x + 70 * math.cos(math.radians(ang))
            y = 1160 + 70 * math.sin(math.radians(ang))
            d.line([(base_x, 1160), (x, y)], fill=BLACK, width=LW_THIN)
    # equals sign in middle
    d.rounded_rectangle([730, 720, 870, 800], radius=20, fill=GREEN, outline=BLACK, width=LW)
    d.rounded_rectangle([730, 850, 870, 930], radius=20, fill=GREEN, outline=BLACK, width=LW)
    ground(d, 1370)
    save(img, "equality")


def il_women_children():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    sun_or_star(d, 1400, 200, 80, ORANGE)
    # mother — left
    cx_a = 500
    head(d, cx_a, 380, r=140, hair=HAIR_BLACK, hair_style="long")
    body_trapezoid(d, cx_a, 540, 940, top_w=240, bot_w=340, color=VS_PINK)
    arm(d, cx_a - 120, 580, cx_a - 220, 800)
    # right arm reaches toward child
    arm(d, cx_a + 120, 580, cx_a + 240, 760)
    legs_pants(d, cx_a, 940, 1340, span=90)
    # girl child — right, smaller
    cx_b = 1050
    head(d, cx_b, 620, r=95, hair=HAIR_BROWN, hair_style="long")
    body_trapezoid(d, cx_b, 740, 980, top_w=170, bot_w=240, color=PURPLE)
    arm(d, cx_b - 80, 770, cx_b - 160, 920)
    # left arm reaches toward mom
    arm(d, cx_b + 80, 770, cx_b + 180, 880)
    legs_pants(d, cx_b, 980, 1340, span=70)
    # heart in the middle (between them)
    hx, hy = 800, 760
    d.polygon([
        (hx, hy + 90),
        (hx - 90, hy - 10),
        (hx - 60, hy - 70),
        (hx, hy - 30),
        (hx + 60, hy - 70),
        (hx + 90, hy - 10),
    ], fill=RED, outline=BLACK, width=LW)
    ground(d, 1370)
    save(img, "women_children")


def il_house_family():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    sun_or_star(d, 1400, 220, 80, YELLOW)
    # house body
    house_x, house_y = 380, 560
    house_w, house_h = 840, 680
    d.rectangle([house_x, house_y, house_x + house_w, house_y + house_h],
                fill=CREAM, outline=BLACK, width=LW)
    # roof
    d.polygon([
        (house_x - 60, house_y),
        (house_x + house_w // 2, house_y - 280),
        (house_x + house_w + 60, house_y),
    ], fill=RED, outline=BLACK, width=LW)
    # door
    door_w, door_h = 200, 320
    door_x = house_x + house_w // 2 - door_w // 2
    door_y = house_y + house_h - door_h
    d.rectangle([door_x, door_y, door_x + door_w, door_y + door_h],
                fill=BROWN, outline=BLACK, width=LW)
    d.ellipse([door_x + door_w - 50, door_y + door_h // 2, door_x + door_w - 30, door_y + door_h // 2 + 20],
              fill=YELLOW, outline=BLACK, width=4)
    # windows
    for wx in (house_x + 80, house_x + house_w - 80 - 160):
        d.rectangle([wx, house_y + 80, wx + 160, house_y + 240],
                    fill=SKY, outline=BLACK, width=LW)
        d.line([(wx + 80, house_y + 80), (wx + 80, house_y + 240)], fill=BLACK, width=LW_THIN)
        d.line([(wx, house_y + 160), (wx + 160, house_y + 160)], fill=BLACK, width=LW_THIN)
    # heart on house
    hx, hy = 800, 1050
    d.polygon([
        (hx, hy + 60),
        (hx - 60, hy),
        (hx - 40, hy - 50),
        (hx, hy - 20),
        (hx + 40, hy - 50),
        (hx + 60, hy),
    ], fill=VS_PINK, outline=BLACK, width=LW)
    ground(d, 1380)
    save(img, "house_family")


def il_shield():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # big shield
    cx = W // 2
    top = 240
    side_y = 700
    bot = 1320
    d.polygon([
        (cx, top),
        (cx + 380, top + 80),
        (cx + 380, side_y),
        (cx, bot),
        (cx - 380, side_y),
        (cx - 380, top + 80),
    ], fill=VS_BLUE, outline=BLACK, width=int(LW * 1.6))
    # check mark inside
    d.line([(cx - 200, 800), (cx - 60, 950)], fill=WHITE, width=int(LW * 3))
    d.line([(cx - 60, 950), (cx + 220, 600)], fill=WHITE, width=int(LW * 3))
    d.line([(cx - 200, 800), (cx - 60, 950)], fill=BLACK, width=int(LW * 1.5))
    d.line([(cx - 60, 950), (cx + 220, 600)], fill=BLACK, width=int(LW * 1.5))
    save(img, "shield")


def il_disaster_safe():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # umbrella protecting a person
    cx = W // 2
    # umbrella canopy
    d.chord([cx - 460, 240, cx + 460, 720], 180, 360, fill=RED, outline=BLACK, width=LW)
    d.line([(cx - 460, 480), (cx + 460, 480)], fill=BLACK, width=LW)
    # umbrella ribs
    for i in range(-3, 4):
        d.line([(cx, 480), (cx + i * 130, 250 + abs(i) * 30)], fill=BLACK, width=LW_THIN)
    # umbrella handle
    d.line([(cx, 480), (cx, 1100)], fill=BROWN, width=int(LW * 2))
    d.arc([cx - 80, 1050, cx + 80, 1200], start=0, end=180, fill=BROWN, width=int(LW * 2))
    # rain drops above
    for x, y in [(300, 200), (500, 140), (700, 180), (900, 130), (1100, 200), (1300, 160), (1500, 200)]:
        d.ellipse([x - 18, y - 30, x + 18, y + 20], fill=VS_BLUE, outline=BLACK, width=LW_THIN)
    # person under umbrella
    head(d, cx + 240, 880, r=100, hair=HAIR_BROWN)
    body_trapezoid(d, cx + 240, 1010, 1320, top_w=180, bot_w=240, color=GREEN)
    save(img, "disaster_safe")


def il_heart():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 + 80
    sz = 480
    d.polygon([
        (cx, cy + sz),
        (cx - sz, cy),
        (cx - sz * 70 // 100, cy - sz * 70 // 100),
        (cx, cy - sz * 30 // 100),
        (cx + sz * 70 // 100, cy - sz * 70 // 100),
        (cx + sz, cy),
    ], fill=VS_PINK, outline=BLACK, width=int(LW * 1.6))
    # highlight
    d.ellipse([cx - 240, cy - 250, cx - 100, cy - 120], fill=(255, 200, 220))
    save(img, "heart")


def il_vote():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # ballot box
    bx, by, bw, bh = 320, 700, 960, 600
    d.rectangle([bx, by, bx + bw, by + bh], fill=VS_BLUE, outline=BLACK, width=LW)
    # slot on top
    d.rounded_rectangle([bx + 250, by - 30, bx + bw - 250, by + 30], radius=15,
                        fill=BLACK)
    # label
    d.rectangle([bx + 150, by + 280, bx + bw - 150, by + 460], fill=WHITE, outline=BLACK, width=LW)
    # cross mark on label
    d.line([(bx + 280, by + 320), (bx + 460, by + 420)], fill=BLACK, width=int(LW * 1.6))
    d.line([(bx + 460, by + 320), (bx + 280, by + 420)], fill=BLACK, width=int(LW * 1.6))
    d.text((bx + 540, by + 340), "VOTE", fill=BLACK)
    # ballot paper being inserted
    d.polygon([
        (730, 240),
        (1050, 240),
        (1100, 700),
        (680, 700),
    ], fill=WHITE, outline=BLACK, width=LW)
    d.line([(770, 320), (980, 320)], fill=BLACK, width=LW_THIN)
    d.line([(770, 380), (980, 380)], fill=BLACK, width=LW_THIN)
    d.line([(770, 440), (980, 440)], fill=BLACK, width=LW_THIN)
    # check on ballot
    d.line([(820, 530), (870, 600)], fill=GREEN, width=int(LW * 2))
    d.line([(870, 600), (980, 470)], fill=GREEN, width=int(LW * 2))
    save(img, "vote")


def il_justice_scales():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx = W // 2
    # vertical post
    d.rectangle([cx - 25, 320, cx + 25, 1180], fill=BROWN, outline=BLACK, width=LW)
    # horizontal beam
    d.rectangle([cx - 460, 290, cx + 460, 350], fill=BROWN, outline=BLACK, width=LW)
    # left chains
    d.line([(cx - 380, 350), (cx - 380, 600)], fill=BLACK, width=LW)
    d.line([(cx - 380, 350), (cx - 260, 600)], fill=BLACK, width=LW)
    # right chains
    d.line([(cx + 380, 350), (cx + 380, 600)], fill=BLACK, width=LW)
    d.line([(cx + 380, 350), (cx + 260, 600)], fill=BLACK, width=LW)
    # left pan (oval)
    d.ellipse([cx - 480, 580, cx - 180, 720], fill=YELLOW, outline=BLACK, width=int(LW * 1.5))
    # right pan
    d.ellipse([cx + 180, 580, cx + 480, 720], fill=YELLOW, outline=BLACK, width=int(LW * 1.5))
    # base
    d.polygon([
        (cx - 240, 1180),
        (cx + 240, 1180),
        (cx + 320, 1320),
        (cx - 320, 1320),
    ], fill=BROWN, outline=BLACK, width=LW)
    # decorative star on top of post
    d.ellipse([cx - 60, 220, cx + 60, 340], fill=ORANGE, outline=BLACK, width=LW)
    save(img, "justice_scales")


def il_school():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    sun_or_star(d, 1400, 220, 80, YELLOW)
    # school building body
    bx, by, bw, bh = 240, 540, 1120, 720
    d.rectangle([bx, by, bx + bw, by + bh], fill=CREAM, outline=BLACK, width=LW)
    # roof
    d.polygon([
        (bx - 80, by),
        (bx + bw // 2, by - 280),
        (bx + bw + 80, by),
    ], fill=ORANGE, outline=BLACK, width=LW)
    # flag pole and flag
    d.line([(bx + bw // 2, by - 280), (bx + bw // 2, by - 480)], fill=BLACK, width=LW)
    d.polygon([
        (bx + bw // 2, by - 480),
        (bx + bw // 2 + 140, by - 460),
        (bx + bw // 2, by - 410),
    ], fill=GREEN, outline=BLACK, width=LW)
    # door
    door_w, door_h = 220, 360
    door_x = bx + bw // 2 - door_w // 2
    door_y = by + bh - door_h
    d.rectangle([door_x, door_y, door_x + door_w, door_y + door_h],
                fill=BROWN, outline=BLACK, width=LW)
    d.ellipse([door_x + door_w - 50, door_y + door_h // 2, door_x + door_w - 30, door_y + door_h // 2 + 20],
              fill=YELLOW, outline=BLACK, width=4)
    # windows (4)
    for wx in (bx + 60, bx + 280, bx + bw - 280 - 160, bx + bw - 60 - 160):
        d.rectangle([wx, by + 100, wx + 160, by + 280],
                    fill=SKY, outline=BLACK, width=LW)
        d.line([(wx + 80, by + 100), (wx + 80, by + 280)], fill=BLACK, width=LW_THIN)
        d.line([(wx, by + 190), (wx + 160, by + 190)], fill=BLACK, width=LW_THIN)
    # ABC sign above door
    sx, sy = bx + bw // 2 - 110, by + 60
    d.rectangle([sx, sy, sx + 220, sy + 90], fill=YELLOW, outline=BLACK, width=LW_THIN)
    d.text((sx + 30, sy + 25), "ABC", fill=BLACK)
    ground(d, 1380)
    save(img, "school")


def il_book_open():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 + 60
    # left page
    d.polygon([
        (cx - 600, cy - 360),
        (cx - 40, cy - 280),
        (cx - 40, cy + 380),
        (cx - 600, cy + 460),
    ], fill=WHITE, outline=BLACK, width=int(LW * 1.5))
    # right page
    d.polygon([
        (cx + 40, cy - 280),
        (cx + 600, cy - 360),
        (cx + 600, cy + 460),
        (cx + 40, cy + 380),
    ], fill=WHITE, outline=BLACK, width=int(LW * 1.5))
    # spine
    d.line([(cx - 40, cy - 280), (cx - 40, cy + 380)], fill=BLACK, width=LW)
    d.line([(cx + 40, cy - 280), (cx + 40, cy + 380)], fill=BLACK, width=LW)
    d.line([(cx, cy - 320), (cx, cy + 420)], fill=BLACK, width=LW)
    # text lines on pages
    for i in range(5):
        ly = cy - 200 + i * 110
        d.line([(cx - 540, ly), (cx - 110, ly)], fill=BLACK, width=LW_THIN)
        d.line([(cx + 110, ly), (cx + 540, ly)], fill=BLACK, width=LW_THIN)
    # bookmark ribbon
    d.polygon([
        (cx + 220, cy - 320),
        (cx + 320, cy - 320),
        (cx + 320, cy + 0),
        (cx + 270, cy - 50),
        (cx + 220, cy + 0),
    ], fill=RED, outline=BLACK, width=LW_THIN)
    save(img, "book_open")


def il_briefcase():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 + 60
    # handle
    d.rounded_rectangle([cx - 200, cy - 540, cx + 200, cy - 380], radius=40,
                        outline=BLACK, width=int(LW * 1.5), fill=None)
    # body
    d.rounded_rectangle([cx - 600, cy - 360, cx + 600, cy + 480], radius=40,
                        fill=BROWN, outline=BLACK, width=int(LW * 1.6))
    # divider line in middle
    d.line([(cx - 600, cy + 60), (cx + 600, cy + 60)], fill=BLACK, width=LW)
    # clasp/lock
    d.rectangle([cx - 60, cy + 30, cx + 60, cy + 120], fill=YELLOW, outline=BLACK, width=LW)
    d.ellipse([cx - 20, cy + 60, cx + 20, cy + 100], fill=BLACK)
    save(img, "briefcase")


def il_medical_cross():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 + 40
    # white circle background
    d.ellipse([cx - 540, cy - 540, cx + 540, cy + 540],
              fill=WHITE, outline=BLACK, width=int(LW * 1.6))
    # red cross
    cross_w = 200
    cross_h = 600
    # vertical bar
    d.rectangle([cx - cross_w, cy - cross_h, cx + cross_w, cy + cross_h],
                fill=RED, outline=BLACK, width=LW)
    # horizontal bar
    d.rectangle([cx - cross_h, cy - cross_w, cx + cross_h, cy + cross_w],
                fill=RED, outline=BLACK, width=LW)
    # re-trace overlap
    d.rectangle([cx - cross_w, cy - cross_w, cx + cross_w, cy + cross_w], fill=RED)
    save(img, "medical_cross")


def il_money_jar():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 + 80
    # jar lid
    d.rounded_rectangle([cx - 380, cy - 540, cx + 380, cy - 400], radius=30,
                        fill=GREY, outline=BLACK, width=LW)
    # jar body (curved)
    d.rounded_rectangle([cx - 420, cy - 420, cx + 420, cy + 540], radius=80,
                        fill=(220, 240, 255), outline=BLACK, width=int(LW * 1.5))
    # rupee symbol big
    d.text((cx - 80, cy - 220), "₹", fill=GREEN)
    # coins inside
    for i, (x, y, c) in enumerate([
        (cx - 200, cy + 200, YELLOW),
        (cx, cy + 240, ORANGE),
        (cx + 200, cy + 200, YELLOW),
        (cx - 80, cy + 350, YELLOW),
        (cx + 80, cy + 350, ORANGE),
    ]):
        d.ellipse([x - 80, y - 30, x + 80, y + 50], fill=c, outline=BLACK, width=LW)
        d.text((x - 16, y - 12), "₹", fill=BLACK)
    save(img, "money_jar")


def il_bus():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    sun_or_star(d, 1400, 220, 80, YELLOW)
    # bus body
    bx, by, bw, bh = 140, 540, 1320, 580
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=80,
                        fill=VS_BLUE, outline=BLACK, width=int(LW * 1.6))
    # front nose
    d.rounded_rectangle([bx + bw - 200, by + 60, bx + bw + 80, by + bh],
                        radius=40, fill=VS_BLUE, outline=BLACK, width=LW)
    # windows (4 with happy faces)
    for i, wx in enumerate((bx + 60, bx + 320, bx + 580, bx + 840)):
        d.rounded_rectangle([wx, by + 60, wx + 220, by + 280], radius=20,
                            fill=SKY, outline=BLACK, width=LW)
        # tiny smiley face inside
        fx, fy = wx + 110, by + 170
        d.ellipse([fx - 50, fy - 50, fx + 50, fy + 50], fill=SKIN, outline=BLACK, width=LW_THIN)
        d.ellipse([fx - 22, fy - 14, fx - 12, fy - 4], fill=BLACK)
        d.ellipse([fx + 12, fy - 14, fx + 22, fy - 4], fill=BLACK)
        d.arc([fx - 25, fy - 5, fx + 25, fy + 30], 20, 160, fill=BLACK, width=LW_THIN)
    # door
    d.rectangle([bx + bw - 180, by + 60, bx + bw - 60, by + bh - 80],
                fill=(80, 110, 130), outline=BLACK, width=LW)
    d.line([(bx + bw - 120, by + 60), (bx + bw - 120, by + bh - 80)], fill=BLACK, width=LW_THIN)
    # accessibility ramp lowering from door
    d.polygon([
        (bx + bw - 180, by + bh - 60),
        (bx + bw - 60, by + bh - 60),
        (bx + bw - 60, by + bh + 60),
        (bx + bw - 360, by + bh + 60),
    ], fill=YELLOW, outline=BLACK, width=LW)
    # accessibility symbol on bus
    d.ellipse([bx + 100, by + 320, bx + 220, by + 440], fill=WHITE, outline=BLACK, width=LW_THIN)
    d.text((bx + 130, by + 340), "♿", fill=VS_BLUE)
    # wheels
    for wx in (bx + 200, bx + bw - 200):
        d.ellipse([wx - 100, by + bh - 60, wx + 100, by + bh + 140],
                  fill=BLACK, outline=BLACK, width=LW)
        d.ellipse([wx - 50, by + bh - 10, wx + 50, by + bh + 90],
                  fill=GREY, outline=BLACK, width=LW_THIN)
    ground(d, 1340)
    save(img, "bus")


def il_computer():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 - 40
    # monitor frame
    d.rounded_rectangle([cx - 540, cy - 380, cx + 540, cy + 320], radius=30,
                        fill=BLACK, outline=BLACK, width=LW)
    # screen
    d.rectangle([cx - 480, cy - 320, cx + 480, cy + 240], fill=SKY, outline=BLACK, width=LW_THIN)
    # screen content — accessibility checklist
    items = [
        ("Big text", GREEN),
        ("Easy words", GREEN),
        ("Pictures", GREEN),
    ]
    for i, (txt, c) in enumerate(items):
        ty = cy - 240 + i * 130
        # tick box
        d.rectangle([cx - 400, ty, cx - 320, ty + 80], fill=WHITE, outline=BLACK, width=LW_THIN)
        d.line([(cx - 390, ty + 40), (cx - 360, ty + 70)], fill=c, width=int(LW * 1.5))
        d.line([(cx - 360, ty + 70), (cx - 320, ty + 20)], fill=c, width=int(LW * 1.5))
    # neck
    d.rectangle([cx - 80, cy + 320, cx + 80, cy + 440], fill=BLACK)
    # base
    d.rounded_rectangle([cx - 280, cy + 440, cx + 280, cy + 500], radius=20,
                        fill=BLACK, outline=BLACK, width=LW)
    save(img, "computer")


def il_clock():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 + 40
    r = 540
    # face
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=YELLOW, outline=BLACK, width=int(LW * 2))
    d.ellipse([cx - r + 40, cy - r + 40, cx + r - 40, cy + r - 40], outline=BLACK, width=LW)
    # numbers / marks
    import math
    for i in range(12):
        ang = math.radians(i * 30 - 90)
        x1 = cx + (r - 50) * math.cos(ang)
        y1 = cy + (r - 50) * math.sin(ang)
        x2 = cx + (r - 110) * math.cos(ang)
        y2 = cy + (r - 110) * math.sin(ang)
        d.line([(x1, y1), (x2, y2)], fill=BLACK, width=int(LW * 1.5))
    # hands — pointing to 10:10 (universally cheerful)
    # hour hand
    ang = math.radians(10 * 30 - 90)  # 10
    hx = cx + 280 * math.cos(ang)
    hy = cy + 280 * math.sin(ang)
    d.line([(cx, cy), (hx, hy)], fill=BLACK, width=int(LW * 2.5))
    # minute hand
    ang = math.radians(2 * 30 - 90)  # 10
    mx = cx + 380 * math.cos(ang)
    my = cy + 380 * math.sin(ang)
    d.line([(cx, cy), (mx, my)], fill=BLACK, width=int(LW * 2))
    # center dot
    d.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], fill=RED, outline=BLACK, width=LW)
    save(img, "clock")


def il_warning():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx = W // 2
    # triangle
    d.polygon([
        (cx, 240),
        (cx + 640, 1280),
        (cx - 640, 1280),
    ], fill=YELLOW, outline=BLACK, width=int(LW * 2))
    # exclamation mark
    d.rounded_rectangle([cx - 60, 580, cx + 60, 990], radius=30,
                        fill=BLACK)
    d.ellipse([cx - 70, 1080, cx + 70, 1200], fill=BLACK)
    save(img, "warning")


def il_megaphone():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # megaphone body — angled cone
    d.polygon([
        (300, 600),
        (300, 1000),
        (900, 1180),
        (900, 420),
    ], fill=ORANGE, outline=BLACK, width=int(LW * 1.6))
    # mouth circle (open end)
    d.ellipse([850, 380, 1000, 1220], fill=YELLOW, outline=BLACK, width=int(LW * 1.5))
    # handle
    d.rectangle([200, 720, 320, 880], fill=GREY, outline=BLACK, width=LW)
    # sound waves
    for i, r in enumerate((80, 160, 240)):
        d.arc([1000 + i * 80, 540 + i * 60, 1300 + i * 100, 1080 - i * 60], 280, 80, fill=VS_BLUE, width=int(LW * 1.5))
    save(img, "megaphone")


def il_document():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2
    # paper
    pw, ph = 880, 1120
    d.polygon([
        (cx - pw // 2, cy - ph // 2),
        (cx + pw // 2 - 160, cy - ph // 2),
        (cx + pw // 2, cy - ph // 2 + 160),
        (cx + pw // 2, cy + ph // 2),
        (cx - pw // 2, cy + ph // 2),
    ], fill=WHITE, outline=BLACK, width=int(LW * 1.6))
    # folded corner
    d.polygon([
        (cx + pw // 2 - 160, cy - ph // 2),
        (cx + pw // 2, cy - ph // 2 + 160),
        (cx + pw // 2 - 160, cy - ph // 2 + 160),
    ], fill=LIGHT_GREY, outline=BLACK, width=LW)
    # text lines
    for i in range(7):
        ly = cy - ph // 2 + 220 + i * 110
        d.line([(cx - pw // 2 + 80, ly), (cx + pw // 2 - 80, ly)], fill=BLACK, width=LW_THIN)
    # stamp circle
    d.ellipse([cx + 60, cy + 250, cx + 320, cy + 480], outline=RED, width=int(LW * 1.5))
    d.text((cx + 110, cy + 320), "SEAL", fill=RED)
    save(img, "document")


def il_certificate_star():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2
    # ribbon background
    d.polygon([
        (cx - 480, cy + 160),
        (cx - 480, cy + 600),
        (cx - 280, cy + 480),
        (cx - 80, cy + 600),
    ], fill=RED, outline=BLACK, width=LW)
    d.polygon([
        (cx + 480, cy + 160),
        (cx + 480, cy + 600),
        (cx + 280, cy + 480),
        (cx + 80, cy + 600),
    ], fill=RED, outline=BLACK, width=LW)
    # star (5-point)
    import math
    star_pts = []
    r_outer = 480
    r_inner = 200
    for i in range(10):
        ang = math.radians(-90 + i * 36)
        r = r_outer if i % 2 == 0 else r_inner
        star_pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    d.polygon(star_pts, fill=YELLOW, outline=BLACK, width=int(LW * 1.6))
    # number 5 in centre
    d.text((cx - 100, cy - 160), "★", fill=ORANGE)
    save(img, "certificate_star")


def il_building_ramp():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    sun_or_star(d, 1420, 220, 80, YELLOW)
    # building
    bx, by, bw, bh = 480, 380, 920, 880
    d.rectangle([bx, by, bx + bw, by + bh], fill=CREAM, outline=BLACK, width=LW)
    # windows grid
    for col in range(3):
        for row in range(3):
            wx = bx + 80 + col * 280
            wy = by + 80 + row * 240
            d.rectangle([wx, wy, wx + 180, wy + 180], fill=SKY, outline=BLACK, width=LW)
            d.line([(wx + 90, wy), (wx + 90, wy + 180)], fill=BLACK, width=LW_THIN)
            d.line([(wx, wy + 90), (wx + 180, wy + 90)], fill=BLACK, width=LW_THIN)
    # door (no door — let's add one)
    # accessibility ramp running diagonally to the left
    d.polygon([
        (bx, by + bh),
        (bx, by + bh - 60),
        (60, by + bh + 200),
        (60, by + bh + 260),
    ], fill=GREEN, outline=BLACK, width=int(LW * 1.5))
    # ramp railing
    d.line([(bx, by + bh - 60), (60, by + bh + 200)], fill=BLACK, width=LW)
    # wheelchair person on ramp
    cx_w = 360
    cy_w = by + bh + 50
    d.ellipse([cx_w - 60, cy_w - 220, cx_w + 60, cy_w - 100], fill=SKIN, outline=BLACK, width=LW)
    d.polygon([
        (cx_w - 80, cy_w - 100),
        (cx_w + 80, cy_w - 100),
        (cx_w + 100, cy_w + 50),
        (cx_w - 100, cy_w + 50),
    ], fill=VS_PINK, outline=BLACK, width=LW)
    d.ellipse([cx_w - 130, cy_w + 60, cx_w + 130, cy_w + 200], fill=GREY, outline=BLACK, width=LW)
    d.ellipse([cx_w - 110, cy_w + 80, cx_w + 110, cy_w + 180], fill=BLACK)
    ground(d, 1380)
    save(img, "building_ramp")


def il_friends_support():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    sun_or_star(d, 1400, 220, 80, YELLOW)
    # two figures with arms around each other
    cx_a = 580
    head(d, cx_a, 380, r=130, hair=HAIR_BROWN)
    body_trapezoid(d, cx_a, 540, 920, top_w=240, bot_w=320, color=GREEN)
    # outer arm down
    arm(d, cx_a - 120, 580, cx_a - 220, 800)
    # inner arm — over to the other person's shoulder
    d.line([(cx_a + 120, 580), (cx_a + 350, 540)], fill=BLACK, width=int(LW * 1.7))
    legs_pants(d, cx_a, 920, 1340, span=85)

    cx_b = 1020
    head(d, cx_b, 380, r=130, hair=HAIR_BLACK, hair_style="long")
    body_trapezoid(d, cx_b, 540, 920, top_w=240, bot_w=320, color=VS_BLUE)
    d.line([(cx_b - 120, 580), (cx_b - 350, 540)], fill=BLACK, width=int(LW * 1.7))
    arm(d, cx_b + 120, 580, cx_b + 220, 800)
    legs_pants(d, cx_b, 920, 1340, span=85)
    # heart above between them
    hx, hy = 800, 240
    d.polygon([
        (hx, hy + 80),
        (hx - 80, hy),
        (hx - 50, hy - 60),
        (hx, hy - 20),
        (hx + 50, hy - 60),
        (hx + 80, hy),
    ], fill=RED, outline=BLACK, width=LW)
    ground(d, 1370)
    save(img, "friends_support")


def il_committee_people():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    # 4 stylised heads in a circle (committee/board)
    centers = [(400, 540), (1200, 540), (400, 1100), (1200, 1100)]
    colors = [VS_BLUE, VS_PINK, GREEN, ORANGE]
    hairs = [HAIR_BROWN, HAIR_BLACK, HAIR_BLACK, HAIR_BROWN]
    styles = ["round", "long", "round", "long"]
    for (cx, cy), col, hr, st in zip(centers, colors, hairs, styles):
        head(d, cx, cy - 80, r=110, hair=hr, hair_style=st)
        body_trapezoid(d, cx, cy + 60, cy + 280, top_w=200, bot_w=260, color=col)
    # central table
    d.ellipse([460, 740, 1140, 1000], fill=WOOD, outline=BLACK, width=LW)
    save(img, "committee_people")


def il_commissioner_badge():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx = W // 2
    # person — head + uniform
    head(d, cx, 460, r=160, hair=HAIR_BLACK)
    body_trapezoid(d, cx, 640, 1320, top_w=300, bot_w=440, color=INDIGO)
    # tie
    d.polygon([
        (cx - 30, 700),
        (cx + 30, 700),
        (cx + 50, 760),
        (cx, 850),
        (cx - 50, 760),
    ], fill=RED, outline=BLACK, width=LW)
    d.polygon([
        (cx - 50, 760),
        (cx + 50, 760),
        (cx + 80, 1080),
        (cx, 1140),
        (cx - 80, 1080),
    ], fill=RED, outline=BLACK, width=LW)
    # badge on chest
    d.ellipse([cx + 100, 880, cx + 240, 1020], fill=YELLOW, outline=BLACK, width=LW)
    d.text((cx + 140, 920), "★", fill=BLACK)
    save(img, "commissioner_badge")


def il_courthouse():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    sun_or_star(d, 1420, 220, 80, YELLOW)
    cx = W // 2
    # base
    d.rectangle([240, 1180, W - 240, 1280], fill=GREY, outline=BLACK, width=LW)
    # steps
    d.rectangle([320, 1100, W - 320, 1180], fill=LIGHT_GREY, outline=BLACK, width=LW)
    # columns (4)
    col_y_top = 580
    col_y_bot = 1100
    col_w = 90
    cols = [400, 640, 960, 1200]
    for col_x in cols:
        d.rectangle([col_x, col_y_top, col_x + col_w, col_y_bot],
                    fill=CREAM, outline=BLACK, width=LW)
        # capital
        d.rectangle([col_x - 20, col_y_top - 30, col_x + col_w + 20, col_y_top + 10],
                    fill=CREAM, outline=BLACK, width=LW_THIN)
        # base
        d.rectangle([col_x - 20, col_y_bot - 10, col_x + col_w + 20, col_y_bot + 30],
                    fill=CREAM, outline=BLACK, width=LW_THIN)
    # roof / pediment (triangle)
    d.polygon([
        (340, 580),
        (cx, 320),
        (W - 340, 580),
    ], fill=ORANGE, outline=BLACK, width=LW)
    # base of pediment
    d.rectangle([340, 540, W - 340, 590], fill=ORANGE, outline=BLACK, width=LW)
    # scales of justice on pediment
    d.line([(cx - 80, 460), (cx + 80, 460)], fill=BLACK, width=LW)
    d.line([(cx, 380), (cx, 480)], fill=BLACK, width=LW)
    d.ellipse([cx - 100, 460, cx - 60, 490], outline=BLACK, width=LW_THIN, fill=YELLOW)
    d.ellipse([cx + 60, 460, cx + 100, 490], outline=BLACK, width=LW_THIN, fill=YELLOW)
    save(img, "courthouse")


def il_globe_world():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2
    r = 540
    # globe
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SKY, outline=BLACK, width=int(LW * 1.6))
    # continents (rough blobs)
    d.polygon([
        (cx - 300, cy - 240),
        (cx - 100, cy - 320),
        (cx + 100, cy - 200),
        (cx + 50, cy - 100),
        (cx - 200, cy - 60),
    ], fill=GREEN, outline=BLACK, width=LW_THIN)
    d.polygon([
        (cx - 100, cy + 40),
        (cx + 200, cy + 80),
        (cx + 300, cy + 280),
        (cx + 100, cy + 360),
        (cx - 200, cy + 240),
    ], fill=GREEN, outline=BLACK, width=LW_THIN)
    d.polygon([
        (cx + 280, cy - 200),
        (cx + 420, cy - 120),
        (cx + 380, cy + 100),
        (cx + 240, cy),
    ], fill=GREEN, outline=BLACK, width=LW_THIN)
    # latitude lines
    d.arc([cx - r, cy - r, cx + r, cy + r], 0, 360, fill=BLACK, width=LW_THIN)
    save(img, "globe_world")


def il_clipboard_check():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 + 40
    # clipboard board
    d.rounded_rectangle([cx - 440, cy - 540, cx + 440, cy + 600], radius=40,
                        fill=BROWN, outline=BLACK, width=int(LW * 1.5))
    # clip on top
    d.rounded_rectangle([cx - 120, cy - 620, cx + 120, cy - 480], radius=20,
                        fill=GREY, outline=BLACK, width=LW)
    # paper
    d.rounded_rectangle([cx - 380, cy - 460, cx + 380, cy + 540], radius=20,
                        fill=WHITE, outline=BLACK, width=LW)
    # checklist items
    items_y = [cy - 320, cy - 140, cy + 40, cy + 220]
    for i, ly in enumerate(items_y):
        # checkbox
        d.rectangle([cx - 320, ly - 50, cx - 220, ly + 50], fill=WHITE, outline=BLACK, width=LW)
        # check
        d.line([(cx - 300, ly), (cx - 270, ly + 30)], fill=GREEN, width=int(LW * 2))
        d.line([(cx - 270, ly + 30), (cx - 220, ly - 30)], fill=GREEN, width=int(LW * 2))
        # text line
        d.line([(cx - 180, ly), (cx + 320, ly)], fill=BLACK, width=int(LW * 1.2))
    save(img, "clipboard_check")


def il_book_learning():
    """A figure reading a book — for adult education."""
    img = new_canvas()
    d = ImageDraw.Draw(img)
    sun_or_star(d, 1420, 220, 70, YELLOW)
    cx = W // 2
    # person sitting
    head(d, cx, 380, r=140, hair=HAIR_BROWN)
    body_trapezoid(d, cx, 560, 980, top_w=280, bot_w=380, color=VS_PINK)
    # arms holding book
    d.line([(cx - 130, 620), (cx - 280, 760)], fill=BLACK, width=int(LW * 1.7))
    d.line([(cx + 130, 620), (cx + 280, 760)], fill=BLACK, width=int(LW * 1.7))
    # book in lap
    d.polygon([
        (cx - 320, 800),
        (cx + 320, 800),
        (cx + 400, 1080),
        (cx - 400, 1080),
    ], fill=VS_BLUE, outline=BLACK, width=int(LW * 1.5))
    # book pages (white inside)
    d.polygon([
        (cx - 280, 820),
        (cx + 280, 820),
        (cx + 340, 1040),
        (cx - 340, 1040),
    ], fill=WHITE, outline=BLACK, width=LW)
    # book spine line
    d.line([(cx, 820), (cx, 1040)], fill=BLACK, width=LW)
    # text lines on book
    for i in range(2):
        ly = 880 + i * 60
        d.line([(cx - 240, ly), (cx - 30, ly)], fill=BLACK, width=LW_THIN)
        d.line([(cx + 30, ly), (cx + 240, ly)], fill=BLACK, width=LW_THIN)
    # legs (sitting — short, crossed)
    d.line([(cx - 100, 1080), (cx - 220, 1280)], fill=BLACK, width=int(LW * 2))
    d.line([(cx + 100, 1080), (cx + 220, 1280)], fill=BLACK, width=int(LW * 2))
    save(img, "book_learning")


def il_pencil_signing():
    """A hand signing a document — for legal capacity / records."""
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2
    # paper
    d.polygon([
        (cx - 600, cy - 360),
        (cx + 600, cy - 360),
        (cx + 600, cy + 360),
        (cx - 600, cy + 360),
    ], fill=WHITE, outline=BLACK, width=int(LW * 1.5))
    # text lines
    for i in range(3):
        ly = cy - 240 + i * 140
        d.line([(cx - 540, ly), (cx + 540, ly)], fill=BLACK, width=LW_THIN)
    # signature line
    d.line([(cx - 540, cy + 240), (cx + 540, cy + 240)], fill=BLACK, width=LW)
    # signature scribble
    d.line([(cx - 400, cy + 200), (cx - 320, cy + 240), (cx - 240, cy + 180), (cx - 160, cy + 240), (cx - 80, cy + 200), (cx, cy + 240)],
           fill=VS_BLUE, joint="curve", width=int(LW * 1.5))
    # pencil over the signature
    pencil_top = (cx + 200, cy + 60)
    pencil_tip = (cx + 80, cy + 240)
    # pencil body
    d.polygon([
        (pencil_top[0] - 30, pencil_top[1]),
        (pencil_top[0] + 30, pencil_top[1] - 60),
        (pencil_tip[0] + 60, pencil_tip[1] - 60),
        (pencil_tip[0], pencil_tip[1]),
    ], fill=YELLOW, outline=BLACK, width=LW)
    # eraser
    d.polygon([
        (pencil_top[0] - 30, pencil_top[1]),
        (pencil_top[0] + 30, pencil_top[1] - 60),
        (pencil_top[0] + 80, pencil_top[1] - 100),
        (pencil_top[0] + 20, pencil_top[1] - 40),
    ], fill=VS_PINK, outline=BLACK, width=LW)
    # tip
    d.polygon([
        (pencil_tip[0], pencil_tip[1]),
        (pencil_tip[0] + 60, pencil_tip[1] - 60),
        (pencil_tip[0] + 30, pencil_tip[1] - 30),
    ], fill=BLACK)
    save(img, "pencil_signing")


def il_chair_reserved():
    """A chair with a 'reserved' sign — for reservation sections."""
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx = W // 2
    # chair seat
    d.rectangle([cx - 280, 740, cx + 280, 880], fill=VS_BLUE, outline=BLACK, width=LW)
    # backrest
    d.rectangle([cx - 280, 380, cx - 160, 740], fill=VS_BLUE, outline=BLACK, width=LW)
    d.rectangle([cx + 160, 380, cx + 280, 740], fill=VS_BLUE, outline=BLACK, width=LW)
    d.rectangle([cx - 280, 380, cx + 280, 480], fill=VS_BLUE, outline=BLACK, width=LW)
    # legs
    d.rectangle([cx - 280, 880, cx - 220, 1240], fill=BROWN, outline=BLACK, width=LW)
    d.rectangle([cx + 220, 880, cx + 280, 1240], fill=BROWN, outline=BLACK, width=LW)
    # reserved sign hanging on back
    d.rectangle([cx - 240, 540, cx + 240, 700], fill=YELLOW, outline=BLACK, width=int(LW * 1.5))
    d.text((cx - 180, 580), "RESERVED", fill=BLACK)
    ground(d, 1280)
    save(img, "chair_reserved")


def il_high_support_hands():
    """Two hands holding/supporting a smaller figure — for high support needs."""
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 + 60
    # supporting hands (two big arcs)
    # left hand
    d.polygon([
        (200, cy + 200),
        (480, cy - 200),
        (cx, cy - 100),
        (cx - 200, cy + 200),
    ], fill=SKIN, outline=BLACK, width=int(LW * 1.5))
    # right hand mirror
    d.polygon([
        (W - 200, cy + 200),
        (W - 480, cy - 200),
        (cx, cy - 100),
        (cx + 200, cy + 200),
    ], fill=SKIN, outline=BLACK, width=int(LW * 1.5))
    # small person being supported in the middle
    head(d, cx, cy - 280, r=120, hair=HAIR_BROWN)
    body_trapezoid(d, cx, cy - 130, cy + 100, top_w=220, bot_w=300, color=VS_PINK)
    save(img, "high_support_hands")


def il_book_simple():
    """Closed book — for definitions / Act."""
    img = new_canvas()
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, W // 2 + 40
    # book cover
    d.rounded_rectangle([cx - 440, cy - 560, cx + 440, cy + 540], radius=20,
                        fill=VS_BLUE, outline=BLACK, width=int(LW * 1.6))
    # spine highlight
    d.rectangle([cx - 440, cy - 560, cx - 360, cy + 540], fill=(0, 130, 200), outline=BLACK, width=LW)
    # title band
    d.rectangle([cx - 320, cy - 280, cx + 380, cy - 100], fill=WHITE, outline=BLACK, width=LW)
    d.text((cx - 200, cy - 220), "RPwD ACT", fill=BLACK)
    # decorative star
    d.text((cx - 80, cy + 60), "★", fill=YELLOW)
    save(img, "book_simple")


# ============================================================
# build all
# ============================================================

ILLUSTRATIONS = [
    il_equality,
    il_women_children,
    il_house_family,
    il_shield,
    il_disaster_safe,
    il_heart,
    il_vote,
    il_justice_scales,
    il_school,
    il_book_open,
    il_briefcase,
    il_medical_cross,
    il_money_jar,
    il_bus,
    il_computer,
    il_clock,
    il_warning,
    il_megaphone,
    il_document,
    il_certificate_star,
    il_building_ramp,
    il_friends_support,
    il_committee_people,
    il_commissioner_badge,
    il_courthouse,
    il_globe_world,
    il_clipboard_check,
    il_book_learning,
    il_pencil_signing,
    il_chair_reserved,
    il_high_support_hands,
    il_book_simple,
]


def build_all():
    for fn in ILLUSTRATIONS:
        fn()
        print(f"  drew {fn.__name__}")
    print(f"OK {len(ILLUSTRATIONS)} illustrations -> {OUT_DIR}")


if __name__ == "__main__":
    build_all()
