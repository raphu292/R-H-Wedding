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
