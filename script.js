const gate = document.querySelector("#gate");
const musicButton = document.querySelector("#musicButton");

let audioContext;
let masterGain;
let fontPlayer;
let instruments;
let musicTimer;
let nextLoopTime = 0;
let isPlaying = false;

const BAR_SECONDS = 3.6;
const LOOP_SECONDS = BAR_SECONDS * 12;
const chords = [
  [50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52],
  [50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52],
  [47, 50, 54], [43, 47, 50], [45, 49, 52], [50, 54, 57]
];
const melody = [
  [[66,0,1],[69,1,.5],[71,1.5,.5],[69,2,1]],
  [[66,0,1.5],[64,1.5,.5],[62,2,1]],
  [[62,0,.75],[64,.75,.75],[66,1.5,1.5]],
  [[64,0,1],[61,1,1],[64,2,1]],
  [[69,0,1],[71,1,.5],[73,1.5,.5],[74,2,1]],
  [[73,0,1.5],[69,1.5,.75],[66,2.25,.75]],
  [[67,0,1],[69,1,1],[71,2,1]],
  [[69,0,1.5],[66,1.5,.75],[64,2.25,.75]],
  [[66,0,.75],[69,.75,.75],[73,1.5,1.5]],
  [[71,0,1],[69,1,1],[67,2,1]],
  [[64,0,.75],[66,.75,.75],[69,1.5,1.5]],
  [[66,0,.75],[69,.75,.75],[74,1.5,1.35]]
];

async function prepareInstruments() {
  if (typeof WebAudioFontPlayer !== "function") {
    throw new Error("Instrument library did not load");
  }

  fontPlayer = new WebAudioFontPlayer();
  const presetNames = {
    piano: "_tone_0000_Aspirin_sf2_file",
    violin: "_tone_0400_Aspirin_sf2_file",
    cello: "_tone_0420_Aspirin_sf2_file",
    harp: "_tone_0460_Aspirin_sf2_file"
  };

  Object.values(presetNames).forEach(name => {
    fontPlayer.loader.decodeAfterLoading(audioContext, name);
  });

  await new Promise(resolve => fontPlayer.loader.waitLoad(resolve));
  instruments = Object.fromEntries(
    Object.entries(presetNames).map(([kind, name]) => [kind, window[name]])
  );

  if (Object.values(instruments).some(preset => !preset)) {
    throw new Error("Instrument samples did not load");
  }
}

function playInstrument(kind, midi, start, duration, volume) {
  if (!audioContext || !fontPlayer || !instruments?.[kind]) return;
  fontPlayer.queueWaveTable(
    audioContext,
    masterGain,
    instruments[kind],
    start,
    midi,
    duration,
    volume
  );
}

function scheduleLoop(start) {
  const phraseScale = BAR_SECONDS / 3;
  const barFeel = [0, .022, -.014, .012, -.008, .018, -.012, .016, -.01, .02, -.015, 0];
  const melodyDynamics = [.30, .28, .29, .27, .33, .31, .30, .29, .32, .29, .30, .34];

  chords.forEach((chord, barIndex) => {
    const barStart = start + barIndex * BAR_SECONDS + barFeel[barIndex];

    // Long cello bows create a continuous foundation instead of repeated attacks.
    playInstrument("cello", chord[0] - 12, barStart, BAR_SECONDS * .64, .25);
    playInstrument("cello", chord[2] - 12, barStart + BAR_SECONDS * .63, BAR_SECONDS * .34, .20);

    // One restrained harmony line leaves room for the lead violin to breathe.
    const harmonyNote = barIndex % 3 === 1 ? chord[2] + 12 : chord[1] + 12;
    playInstrument("violin", harmonyNote, barStart + .04, BAR_SECONDS - .14, .075);

    // A slower, gently uneven piano pattern feels played rather than quantized.
    const arpeggio = [chord[0], chord[2], chord[1], chord[2]];
    const pianoFeel = [0, .018, -.014, .012];
    const pianoVolumes = [.24, .19, .22, .18];
    arpeggio.forEach((note, step) => {
      const noteStart = barStart + step * (BAR_SECONDS / 4) + pianoFeel[step];
      playInstrument("piano", note + 12, noteStart, BAR_SECONDS * .24, pianoVolumes[step]);
      if (step === 0) playInstrument("piano", chord[0], noteStart, BAR_SECONDS * .38, .15);
    });

    // Harp is now an occasional shimmer, not a constant metronomic accent.
    if (barIndex % 2 === 0) {
      playInstrument("harp", chord[0] + 24, barStart + .07, BAR_SECONDS * .32, .095);
      playInstrument("harp", chord[2] + 24, barStart + BAR_SECONDS * .52, BAR_SECONDS * .28, .075);
    }

    melody[barIndex].forEach(([note, offset, duration], noteIndex) => {
      const expressiveDelay = (noteIndex % 3 - 1) * .014;
      const noteStart = barStart + offset * phraseScale + expressiveDelay;
      const legatoDuration = duration * phraseScale + .14;
      const phraseVolume = melodyDynamics[barIndex] * (noteIndex === 0 ? .96 : 1);
      playInstrument("violin", note, noteStart, legatoDuration, phraseVolume);
    });
  });
}

function keepMusicScheduled() {
  if (!audioContext || !isPlaying || !instruments) return;
  while (nextLoopTime < audioContext.currentTime + 5) {
    scheduleLoop(nextLoopTime);
    nextLoopTime += LOOP_SECONDS;
  }
}

async function startMusic() {
  if (isPlaying) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioContextClass();
  masterGain = audioContext.createGain();
  masterGain.gain.value = .72;

  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = .012;
  compressor.release.value = .3;
  masterGain.connect(compressor).connect(audioContext.destination);

  await audioContext.resume();
  await prepareInstruments();

  isPlaying = true;
  nextLoopTime = audioContext.currentTime + .06;
  keepMusicScheduled();
  musicTimer = window.setInterval(keepMusicScheduled, 1000);
  updateMusic(true);
}

async function stopMusic() {
  isPlaying = false;
  window.clearInterval(musicTimer);
  if (fontPlayer && audioContext) fontPlayer.cancelQueue(audioContext);
  if (audioContext) await audioContext.close();
  audioContext = undefined;
  masterGain = undefined;
  fontPlayer = undefined;
  instruments = undefined;
  updateMusic(false);
}

async function openInvitation() {
  gate.classList.add("open");
  document.body.classList.remove("locked");
  try {
    await startMusic();
  } catch (error) {
    console.error("Wedding music could not start:", error);
    await stopMusic();
  }
}

function updateMusic(playing) {
  musicButton.classList.toggle("playing", playing);
  musicButton.querySelector("b").textContent = playing ? "Pause" : "Play";
  musicButton.setAttribute("aria-label", playing ? "Pause background music" : "Play background music");
}

document.querySelector("#openInvitation").addEventListener("click", openInvitation);
document.querySelector("#openCopy").addEventListener("click", openInvitation);
musicButton.addEventListener("click", async () => {
  if (isPlaying) await stopMusic();
  else {
    try { await startMusic(); }
    catch (error) {
      console.error("Wedding music could not start:", error);
      await stopMusic();
    }
  }
});

const target = new Date("2027-06-09T17:00:00+08:00").getTime();
function updateCountdown() {
  const d = Math.max(0, target - Date.now());
  const values = {
    days: Math.floor(d / 86400000),
    hours: Math.floor(d / 3600000) % 24,
    minutes: Math.floor(d / 60000) % 60,
    seconds: Math.floor(d / 1000) % 60
  };
  Object.entries(values).forEach(([id, value]) => {
    document.querySelector(`#${id}`).textContent = String(value).padStart(id === "days" ? 3 : 2, "0");
  });
}
updateCountdown();
setInterval(updateCountdown, 1000);

const rsvpForm = document.querySelector("#rsvpForm");
const success = document.querySelector("#success");
const rsvpError = document.querySelector("#rsvpError");

if (rsvpForm) {
  rsvpForm.addEventListener("submit", event => {
    success?.classList.remove("show");
    rsvpError?.classList.remove("show");

    const action = rsvpForm.getAttribute("action") || "";
    const isPlaceholder = !action || action.includes("PASTE_APPS_SCRIPT_WEB_APP_URL_HERE");

    if (isPlaceholder) {
      event.preventDefault();
      if (rsvpError) rsvpError.classList.add("show");
      return;
    }

    window.setTimeout(() => {
      if (success) success.classList.add("show");
      rsvpForm.reset();
    }, 900);
  });
}
