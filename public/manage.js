var started = false;
var id;

function decreaseTimer() {
  document.querySelector(".timer").innerText =
    +document.querySelector(".timer").innerText - 1;
}

function startTimer() {
  id = setInterval(() => {
    if (+document.querySelector(".timer").innerText <= 0) {
      clearInterval(id);
      started = false;
    }
    decreaseTimer();
  }, 1000);
}

document.querySelector(".timer").addEventListener("click", () => {
  if (started) {
    clearInterval(id);
  } else {
    startTimer();
  }
  started = !started;
});
