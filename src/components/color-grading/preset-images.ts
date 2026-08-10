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
};
