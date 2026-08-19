const gate = document.querySelector("#gate");
const music = document.querySelector("#music");
const musicButton = document.querySelector("#musicButton");

async function openInvitation() {
  gate.classList.add("open");
  document.body.classList.remove("locked");

  try {
    await music.play();
    updateMusic(true);
  } catch (error) {
    console.error("Music could not start:", error);
    updateMusic(false);
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
  if (music.paused) {
    await music.play();
    updateMusic(true);
  } else {
    music.pause();
    updateMusic(false);
  }
});

music.addEventListener("play", () => updateMusic(true));
music.addEventListener("pause", () => updateMusic(false));
