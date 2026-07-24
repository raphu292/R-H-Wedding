const gate = document.querySelector("#gate");
const music = document.querySelector("#music");
const musicButton = document.querySelector("#musicButton");

async function openInvitation() {
  gate.classList.add("open");
  document.body.classList.remove("locked");
  try { await music.play(); updateMusic(true); } catch (_) { updateMusic(false); }
}

function updateMusic(playing) {
  musicButton.classList.toggle("playing", playing);
  musicButton.querySelector("b").textContent = playing ? "Pause" : "Play";
  musicButton.setAttribute("aria-label", playing ? "Pause background music" : "Play background music");
}

document.querySelector("#openInvitation").addEventListener("click", openInvitation);
document.querySelector("#openCopy").addEventListener("click", openInvitation);
musicButton.addEventListener("click", async () => {
  if (music.paused) { await music.play(); updateMusic(true); }
  else { music.pause(); updateMusic(false); }
});
music.addEventListener("play", () => updateMusic(true));
music.addEventListener("pause", () => updateMusic(false));

const target = new Date("2027-05-22T16:00:00+08:00").getTime();
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

document.querySelector("#rsvpForm").addEventListener("submit", event => {
  event.preventDefault();
  document.querySelector("#success").classList.add("show");
  event.currentTarget.reset();
});
