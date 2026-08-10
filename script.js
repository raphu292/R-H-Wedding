const gate = document.querySelector("#gate");
const musicButton = document.querySelector("#musicButton");

let audioContext;
let masterGain;
let musicTimer;
let nextLoopTime = 0;
let isPlaying = false;

const LOOP_SECONDS = 36;
const BAR_SECONDS = 3;
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

function frequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playTone(midi, start, duration, kind, volume) {
  if (!audioContext || !masterGain) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  oscillator.frequency.value = frequency(midi);
  filter.type = "lowpass";

  if (kind === "violin") {
    oscillator.type = "sawtooth";
    filter.frequency.value = 2400;
    filter.Q.value = 1.2;
    const vibrato = audioContext.createOscillator();
    const vibratoDepth = audioContext.createGain();
    vibrato.frequency.value = 5.1;
    vibratoDepth.gain.value = 5.5;
    vibrato.connect(vibratoDepth).connect(oscillator.detune);
    vibrato.start(start);
    vibrato.stop(start + duration + .1);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .16);
    gain.gain.setValueAtTime(volume * .9, Math.max(start + .17, start + duration - .28));
  } else if (kind === "cello") {
    oscillator.type = "sawtooth";
    filter.frequency.value = 680;
    filter.Q.value = .8;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .18);
    gain.gain.setValueAtTime(volume * .88, Math.max(start + .2, start + duration - .32));
  } else if (kind === "pad") {
    oscillator.type = "sine";
    filter.frequency.value = 1200;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .55);
    gain.gain.setValueAtTime(volume, Math.max(start + .56, start + duration - .6));
  } else if (kind === "harp") {
    oscillator.type = "sine";
    filter.frequency.value = 4800;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  } else {
    oscillator.type = "triangle";
    filter.frequency.value = 3200;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  }

  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(filter).connect(gain).connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + .05);
}

function scheduleLoop(start) {
  chords.forEach((chord, barIndex) => {
    const barStart = start + barIndex * BAR_SECONDS;

    chord.forEach(note => playTone(note, barStart, 3.05, "pad", .042));
    playTone(chord[0] - 12, barStart, 1.46, "cello", .07);
    playTone(chord[2] - 12, barStart + 1.5, 1.46, "cello", .06);

    playTone(chord[1] + 12, barStart, 1.44, "violin", .028);
    playTone(chord[2] + 12, barStart + 1.5, 1.44, "violin", .03);

    const arpeggio = [chord[0], chord[1], chord[2], chord[1], chord[2], chord[1]];
    arpeggio.forEach((note, step) => {
      playTone(note + 12, barStart + step * .5, .58, "piano", .078);
      if (step === 0 || step === 3) {
        playTone(chord[0], barStart + step * .5, .7, "piano", .052);
      }
      if (step === 0 || step === 2 || step === 4) {
        playTone(note + 24, barStart + step * .5, .42, "harp", .025);
      }
    });

    melody[barIndex].forEach(([note, offset, duration]) => {
      playTone(note, barStart + offset, duration, "violin", .12);
    });
  });
}

function keepMusicScheduled() {
  if (!audioContext || !isPlaying) return;
  while (nextLoopTime < audioContext.currentTime + 5) {
    scheduleLoop(nextLoopTime);
    nextLoopTime += LOOP_SECONDS;
  }
}

async function startMusic() {
  if (isPlaying) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 1;
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 16;
  compressor.ratio.value = 5;
  compressor.attack.value = .01;
  compressor.release.value = .25;
  masterGain.connect(compressor).connect(audioContext.destination);
  await audioContext.resume();
  isPlaying = true;
  nextLoopTime = audioContext.currentTime + .06;
  keepMusicScheduled();
  musicTimer = window.setInterval(keepMusicScheduled, 1000);
  updateMusic(true);
}

async function stopMusic() {
  isPlaying = false;
  window.clearInterval(musicTimer);
  if (audioContext) await audioContext.close();
  audioContext = undefined;
  masterGain = undefined;
  updateMusic(false);
}

async function openInvitation() {
  gate.classList.add("open");
  document.body.classList.remove("locked");
  try { await startMusic(); } catch (_) { updateMusic(false); }
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
  else await startMusic();
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
