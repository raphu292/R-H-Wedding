const gate = document.querySelector("#gate");
const music = document.querySelector("#music");
const musicButton = document.querySelector("#musicButton");

async function openInvitation() {
  gate?.classList.add("open");
  document.body.classList.remove("locked");

  try {
    if (music) {
      await music.play();
      updateMusic(true);
    }
  } catch (error) {
    console.error("Music could not start:", error);
    updateMusic(false);
  }
}

function updateMusic(playing) {
  if (!musicButton) return;
  musicButton.classList.toggle("playing", playing);
  musicButton.querySelector("b").textContent = playing ? "Pause" : "Play";
  musicButton.setAttribute("aria-label", playing ? "Pause background music" : "Play background music");
}

document.querySelector("#openInvitation")?.addEventListener("click", openInvitation);
document.querySelector("#openCopy")?.addEventListener("click", openInvitation);

musicButton?.addEventListener("click", async () => {
  if (!music) return;

  if (music.paused) {
    try {
      await music.play();
      updateMusic(true);
    } catch (error) {
      console.error("Music could not start:", error);
      updateMusic(false);
    }
  } else {
    music.pause();
    updateMusic(false);
  }
});

music?.addEventListener("play", () => updateMusic(true));
music?.addEventListener("pause", () => updateMusic(false));

// Countdown: the start of September 18, 2027, Philippines time.
const target = new Date("2027-09-18T00:00:00+08:00").getTime();

function updateCountdown() {
  const remaining = Math.max(0, target - Date.now());
  const values = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor(remaining / 3600000) % 24,
    minutes: Math.floor(remaining / 60000) % 60,
    seconds: Math.floor(remaining / 1000) % 60
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.querySelector(`#${id}`);
    if (element) {
      element.textContent = String(value).padStart(id === "days" ? 3 : 2, "0");
    }
  });
}

updateCountdown();
window.setInterval(updateCountdown, 1000);
