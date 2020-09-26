var continua = false;
var id;
const hash = document.querySelector("meta[name=hash]").content;
const concorrente1 = document.querySelector("meta[name=concorrente1]").content;
const concorrente2 = document.querySelector("meta[name=concorrente2]").content;
const performance = document.querySelector("meta[name=performance]").content;
const color = [
  "#33a8c7",
  "#52e3e1",
  "#a0e426",
  "#fdf148",
  "#ffab00",
  "#f77976",
  "#f050ae",
  "#d883ff",
  "#9336fd",
];
var tempoRimasto;

function decreaseTimer() {
  document.querySelector(".timer").innerText =
    +document.querySelector(".timer").innerText - 1;
}

function tempoScaduto() {
  tempoRimasto = +document.querySelector(".timer").innerText;
  document.querySelector(".timer").classList.add("hide");
  document.querySelector(".vincitore").classList.remove("hide");
  fitty(document.querySelector("#concorrente1 > span"));
  fitty(document.querySelector("#concorrente2 > span"));
  clearInterval(id);
  document.querySelector("#concorrente1").addEventListener("click", () => {
    dichiaraVincitore(concorrente1, concorrente2);
  });
  document.querySelector("#concorrente2").addEventListener("click", () => {
    dichiaraVincitore(concorrente2, concorrente1);
  });
  document.querySelector("#pareggio").addEventListener("click", () => {
    if (performance) {
      let data = {
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          hash: hash,
          concorrente1: concorrente1,
          concorrente2: concorrente2,
          remainingTime: tempoRimasto,
        }),
        method: "POST",
      };
      fetch("/draw", data)
        .then((res) => res.json())
        .then((res) => {
          if (res.message === "ok") window.location.reload();
        });
    } else {
      alert(
        "In questa modalità, il pareggio non è contemplato, quindi l'incontro si dovrà rifare: i due concorrenti possono prendersi tutto il tempo che gli sarà necessario"
      );
      window.location.reload();
    }
  });
}

function dichiaraVincitore(vincitore, perdente) {
  let data = {
    headers: {
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      hash: hash,
      winner: vincitore,
      remainingTime: tempoRimasto,
    }),
    method: "POST",
  };
  fetch("/winner", data)
    .then((res) => res.json())
    .then((res) => {
      if (res.message === "procedi") {
        data.body = JSON.stringify({
          hash: hash,
          loser: perdente,
          remainingTime: tempoRimasto,
        });
        fetch("/loser", data)
          .then((res2) => res2.json())
          .then((res2) => {
            if (res2.message === "ok") window.location.reload();
          });
      } else if (res.message === "ok") window.location.reload();
    });
}

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.style.setProperty(
    "--player1_color",
    color[Math.ceil(Math.random() * 10000) % color.length]
  );
  document.documentElement.style.setProperty(
    "--player2_color",
    color[Math.ceil(Math.random() * 10000) % color.length]
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
  let data = {
    headers: {
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      hash: hash,
      state: "started",
    }),
    method: "POST",
  };
  fetch("/set", data)
    .then((res) => res.json())
    .then((res) => {
      if (res.message === "ok") console.dir("ok");
      else console.error("failed to update info");
    });
});
