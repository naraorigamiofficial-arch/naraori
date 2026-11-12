# Nara Origami Originals · Origami Design · Episode 03: *What Exactly Is a Flap?*

A vertical Instagram Reel (1080 × 1920, 9:16, 30 fps, 115 s) built in Manim Community Edition.

| File | What it is |
|---|---|
| `reel03_flaps.py` | Full Manim source, one continuous scene (`Reel03Flaps`) with 12 scene methods |
| `reel03_flaps.mp4` | Rendered video, silent, with subtitles burned in |
| `reel03_captions.srt` | Subtitles, made from the same cue table as the burned-in captions |
| `reel03_narration.txt` | Exact voiceover lines with each scene's time window |
| `reel03_storyboard.jpg` | Contact sheet, one frame from the middle of each scene |
| `requirements.txt` | Python dependencies |

The hook uses the Sun Wukong figure from the site (`../../imgs/wkkk.webp`). If that file is missing, the script falls back to an original vector figure. Set `NARA_HERO_IMAGE=/path/to/photo.png` to use a different photo.

## 1. Setup

System packages (Debian/Ubuntu). No LaTeX is needed, because all text uses `Text` and none uses `MathTex`:

```bash
sudo apt-get install -y ffmpeg libcairo2-dev libpango1.0-dev pkg-config fonts-inter
```

Python 3.10+ in a virtual environment:

```bash
python3 -m venv .venv
```

```bash
.venv/bin/pip install --upgrade pip setuptools wheel
```

```bash
.venv/bin/pip install -r requirements.txt
```

## 2. Render

Quick low-quality preview (480 × 854, 15 fps, about 1–2 minutes). The script swaps landscape quality presets to portrait automatically:

```bash
.venv/bin/manim -ql --disable_caching reel03_flaps.py Reel03Flaps
```

Final render (1080 × 1920, 30 fps):

```bash
.venv/bin/manim -r 1080,1920 --fps 30 --disable_caching reel03_flaps.py Reel03Flaps
```

```bash
cp media/videos/reel03_flaps/1920p30/Reel03Flaps.mp4 reel03_flaps.mp4
```

Use `--disable_caching`. The captions and the camera follow time-based tracks, so cached partial movies can go stale.

Regenerate the SRT and narration files. This also runs the QC checks: captions must match the voiceover word for word, and the crease pattern is checked for flat-foldability:

```bash
.venv/bin/python reel03_flaps.py --export-text
```

## 3. Voiceover and audio mixing

No voiceover or music came with the brief, so the MP4 is silent. Record the lines in `reel03_narration.txt`, using each scene's time window. `reel03_captions.srt` gives the exact timing for each phrase.

Add one narration track recorded to picture (`narration.wav`):

```bash
ffmpeg -i reel03_flaps.mp4 -i narration.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest reel03_flaps_vo.mp4
```

Add narration plus licensed background music, with the music lowered about 20 dB, ducked under the voice, and faded out at the end:

```bash
ffmpeg -i reel03_flaps.mp4 -i narration.wav -i music.mp3 -filter_complex "[2:a]volume=0.1,afade=t=out:st=112:d=3[m];[m][1:a]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=400[duck];[1:a][duck]amix=inputs=2:duration=first:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t 115 reel03_flaps_mix.mp4
```

If you recorded each scene as its own clip (`s01.wav` … `s12.wav`), place each clip at its scene start time with `adelay` (milliseconds), then mix. Two scenes are shown here; add the rest the same way:

```bash
ffmpeg -i reel03_flaps.mp4 -i s01.wav -i s02.wav -filter_complex "[1:a]adelay=400:all=1[a1];[2:a]adelay=5300:all=1[a2];[a1][a2]amix=inputs=2:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac reel03_flaps_vo.mp4
```

Scene start offsets in ms: 400, 5300, 16300, 26300, 37300, 48300, 62300, 73300, 83300, 91300, 100300, 110300.

A version without burned-in subtitles isn't built in. To get one, change `CUES` so the caption track draws nothing, then upload the `.srt` to the platform instead.

## 4. How the reel was built, and what it does and doesn't claim

- **Timeline:** `Reel03Flaps.at(t0, t1, ...)` starts and ends each animation at the brief's keyframe times, measured on absolute time, so timing errors don't add up. The preview render reports any keyframe that falls behind schedule; the final build has none.
- **Colour meanings never change:** cyan is structure (tree, creases, constructions), gold is the active flap, ivory is paper, slate is inactive structure.
- **Branch → flap → arm:** the tree, the schematic base and the shaped figure share one coordinate set. In scene 6, each flap literally widens out of its zero-width tree branch, then reshapes into the stylized figure.
- **Crease pattern:** the only pattern presented as foldable is the traditional **bird base**. Before rendering, the script checks Kawasaki's theorem (alternate angles sum to 180°) and even degree at all 9 interior vertices. The folded bird base drawn next to it uses proportions derived from that pattern (length 2, half-width tan 22.5°). No collapse is animated.
- **Schematic content is labelled:** the humanoid folded base, the pivot, and the narrow/bend/spread moves are labelled or presented as schematic changes of representation, not as physical folding simulations. The 22.5° construction guides are labelled "not a complete crease pattern". Box-pleating grid lines are kept visually separate from actual crease segments.
- **Exact angles:** 45° segments join grid intersections (slope ±1, asserted in code). The 22.5° ray uses `tan(22.5°) = √2 − 1` and is asserted to within 1e-9.
- **Safe areas:** diagrams stay inside x = ±4.0 and y = −5.3…+6.1. Captions sit below that, at y ≈ −6.15, and are narrow enough to clear Instagram's right-hand buttons.
