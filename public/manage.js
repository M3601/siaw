var continua = false;
var id;
const hash = document.querySelector("meta[name=hash]").content;
const concorrente1 = document.querySelector("meta[name=concorrente1]").content;
const concorrente2 = document.querySelector("meta[name=concorrente2]").content;
const color = [
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
];

function decreaseTimer() {
  document.querySelector(".timer").innerText =
    +document.querySelector(".timer").innerText - 1;
}

function tempoScaduto() {
  document.querySelector(".timer").classList.add("hide");
  document.querySelector(".vincitore").classList.remove("hide");
  fitty(document.querySelector("#concorrente1 > span"));
  fitty(document.querySelector("#concorrente2 > span"));
  clearInterval(id);
  document.querySelector("#concorrente1").addEventListener("click", () => {
    dichiaraVincitore(concorrente1);
  });
  document.querySelector("#concorrente2").addEventListener("click", () => {
    dichiaraVincitore(concorrente2);
  });
  document.querySelector("#pareggio").addEventListener("click", () => {
    alert(
      "In questa modalità, il pareggio non è contemplato, quindi l'incontro si dovrà rifare: i due concorrenti possono prendersi tutto il tempo che gli sarà necessario"
    );
    window.location.reload();
  });
}

function dichiaraVincitore(vincitore) {
  let data = {
    headers: {
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      hash: hash,
      winner: vincitore,
    }),
    method: "POST",
  };
  fetch("/winner", data)
    .then((res) => res.json())
    .then((res) => {
      if (res.message === "ok") window.location.reload();
    });
}

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.style.setProperty(
    "--player1_color",
    color[Math.ceil(Math.random() * 10000) % 16]
  );
  document.documentElement.style.setProperty(
    "--player2_color",
    color[Math.ceil(Math.random() * 10000) % 16]
  );
  fitty(
    document.querySelector(
      "body > div.concorrenti > div > div.card.concorrente1 > span"
    )
  );
  fitty(
    document.querySelector(
      "body > div.concorrenti > div > div.card.concorrente2 > span"
    )
  );

  id = setInterval(() => {
    if (continua && +document.querySelector(".timer").innerText > 0) {
      decreaseTimer();
      if (+document.querySelector(".timer").innerText <= 0) tempoScaduto();
    }
  }, 1000);
});

document.querySelector(".timer").addEventListener("click", () => {
  continua = !continua;
  if (continua == false) tempoScaduto();
});

document.querySelector("#inizia").addEventListener("click", () => {
  document.querySelector(".concorrenti").classList.add("hide");
  document.querySelector(".timer").classList.remove("hide");
});
