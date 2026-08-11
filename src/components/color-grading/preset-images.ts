/** Fixed demo photo per preset — never the user's upload, never swapped. */
import natural from "@/assets/presets/natural.jpg";
import splitTone from "@/assets/presets/split-tone.jpg";
import softSkin from "@/assets/presets/soft-skin.jpg";
import oldLens from "@/assets/presets/old-lens.jpg";
import sixteenMm from "@/assets/presets/16mm.jpg";
import warmFilm from "@/assets/presets/warm-film.jpg";
import coolCinema from "@/assets/presets/cool-cinema.jpg";
import tealOrange from "@/assets/presets/teal-orange.jpg";
import fadedFilm from "@/assets/presets/faded-film.jpg";
import highContrast from "@/assets/presets/high-contrast.jpg";
import goldenHour from "@/assets/presets/golden-hour.jpg";
import bleachBypass from "@/assets/presets/bleach-bypass.jpg";
import filmNoir from "@/assets/presets/film-noir.jpg";
import kodakPortrait from "@/assets/presets/kodak-portrait.jpg";
import fujiFilm from "@/assets/presets/fuji-film.jpg";
import vintageFade from "@/assets/presets/vintage-fade.jpg";
import cyberpunk from "@/assets/presets/cyberpunk.jpg";
import moodyGreen from "@/assets/presets/moody-green.jpg";
import desertHeat from "@/assets/presets/desert-heat.jpg";
import pastel from "@/assets/presets/pastel.jpg";
import matte from "@/assets/presets/matte.jpg";
import deepBlue from "@/assets/presets/deep-blue.jpg";
import sunset from "@/assets/presets/sunset.jpg";
import cleanEditorial from "@/assets/presets/clean-editorial.jpg";

export const PRESET_IMAGES: Record<string, string> = {
  natural,
  "split-tone": splitTone,
  "soft-skin": softSkin,
  "old-lens": oldLens,
  "16mm": sixteenMm,
  "warm-film": warmFilm,
  "cool-cinema": coolCinema,
  "teal-orange": tealOrange,
  "faded-film": fadedFilm,
  "high-contrast": highContrast,
  "golden-hour": goldenHour,
  "bleach-bypass": bleachBypass,
  "film-noir": filmNoir,
  "kodak-portrait": kodakPortrait,
  "fuji-film": fujiFilm,
  "vintage-fade": vintageFade,
  cyberpunk,
  "moody-green": moodyGreen,
  "desert-heat": desertHeat,
  pastel,
  matte,
  "deep-blue": deepBlue,
  sunset,
  "clean-editorial": cleanEditorial,
};
