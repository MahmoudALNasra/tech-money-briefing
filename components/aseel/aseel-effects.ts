export const ASEEL_VISIT_KEY = "aseel-last-visit";
export const ASEEL_INTRO_COOLDOWN_MS = 5 * 60 * 1000;

export type AseelSurpriseEffect =
  | "shake"
  | "wobble"
  | "emoji-rain"
  | "flash"
  | "spin"
  | "bounce"
  | "sound-pop"
  | "sound-boop"
  | "sound-slide";

export function shouldPlayAseelIntro(lastVisitMs: number | null, now = Date.now()) {
  if (!lastVisitMs) {
    return true;
  }

  return now - lastVisitMs > ASEEL_INTRO_COOLDOWN_MS;
}

export function readLastVisit(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(ASEEL_VISIT_KEY);
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function writeLastVisit(now = Date.now()) {
  window.localStorage.setItem(ASEEL_VISIT_KEY, String(now));
}

export function pickSurpriseEffect(): AseelSurpriseEffect {
  const effects: AseelSurpriseEffect[] = [
    "shake",
    "wobble",
    "emoji-rain",
    "flash",
    "spin",
    "bounce",
    "sound-pop",
    "sound-boop",
    "sound-slide"
  ];

  return effects[Math.floor(Math.random() * effects.length)]!;
}

let audioContext: AudioContext | null = null;

export function unlockAseelAudio() {
  if (typeof window === "undefined") {
    return;
  }

  const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!Context) {
    return;
  }

  if (!audioContext) {
    audioContext = new Context();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
}

function playTone({
  frequency,
  duration,
  type = "sine",
  volume = 0.08,
  slideTo
}: {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  slideTo?: number;
}) {
  if (!audioContext) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(
      slideTo,
      audioContext.currentTime + duration
    );
  }

  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

export function playSurpriseSound(effect: AseelSurpriseEffect) {
  unlockAseelAudio();

  if (!audioContext) {
    return;
  }

  if (effect === "sound-pop") {
    playTone({ frequency: 520, duration: 0.12, type: "triangle", volume: 0.1 });
    window.setTimeout(() => {
      playTone({ frequency: 880, duration: 0.08, type: "sine", volume: 0.07 });
    }, 70);
    return;
  }

  if (effect === "sound-boop") {
    playTone({ frequency: 180, duration: 0.18, type: "square", volume: 0.05 });
    return;
  }

  if (effect === "sound-slide") {
    playTone({
      frequency: 420,
      duration: 0.28,
      type: "sawtooth",
      volume: 0.05,
      slideTo: 120
    });
  }
}

export function isVisualSurprise(effect: AseelSurpriseEffect) {
  return effect !== "sound-pop" && effect !== "sound-boop" && effect !== "sound-slide";
}

export const SURPRISE_EMOJIS = ["✨", "💜", "😂", "🫣", "💅", "🎀", "⭐", "🔥"];
