document.querySelector(
  "body > div.form > div:nth-child(1) > div.componenti > input[type=text]:nth-child(1)"
).value = "abc";
document.querySelector(
  "body > div.form > div:nth-child(1) > div.componenti > input[type=text]:nth-child(2)"
).value = "def";
document.querySelector("#aggiungi").addEventListener("click", () => {
  let list = document.querySelector(".componenti").children;
  let necessario = true;
  for (let index = 0; index < list.length; index++) {
    const element = list[index];
    if (element.value == "") {
      element.focus();
      necessario = false;
      break;
    }
  }
  if (necessario) {
    let inputBox = document.createElement("input");
    inputBox.setAttribute("type", "text");
    inputBox.setAttribute(
      "placeholder",
      "Componente " +
        (document.querySelector(".componenti").childElementCount + 1)
    );
    document.querySelector(".componenti").appendChild(inputBox);
    inputBox.focus();
  }
});

document.querySelector(".componenti").addEventListener("keydown", (event) => {
  if (event.keyCode === 13) {
    let list = event.target.parentNode.children;
    let necessario = true;
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      if (element.value == "") {
        element.focus();
        necessario = false;
        break;
      }
    }
    if (necessario) {
      let inputBox = document.createElement("input");
      inputBox.setAttribute("type", "text");
      inputBox.setAttribute(
        "placeholder",
        "Componente " +
          (document.querySelector(".componenti").childElementCount + 1)
      );
      document.querySelector(".componenti").appendChild(inputBox);
      inputBox.focus();
    }
  }
});

document.querySelector("#performance").addEventListener("click", (event) => {
  setTimeout(() => {
    if (event.target.checked === true) {
      document
        .querySelector("#tempo")
        .parentElement.parentElement.classList.remove("hide");
      if (document.querySelector("#tempo").checked === true) {
        document.querySelector(".valori-fissi").classList.add("hide");
        document.querySelector(".valori-variabili").classList.remove("hide");
      } else {
        document.querySelector(".valori-fissi").classList.remove("hide");
        document.querySelector(".valori-variabili").classList.add("hide");
      }
    } else {
      document
        .querySelector("#tempo")
        .parentElement.parentElement.classList.add("hide");
      document.querySelector(".valori-fissi").classList.add("hide");
      document.querySelector(".valori-variabili").classList.add("hide");
    }
  }, 500);
});

document.querySelector("#tempo").addEventListener("click", (event) => {
  setTimeout(() => {
    if (event.target.checked === true) {
      document.querySelector(".valori-fissi").classList.add("hide");
      document.querySelector(".valori-variabili").classList.remove("hide");
    } else {
      document.querySelector(".valori-fissi").classList.remove("hide");
      document.querySelector(".valori-variabili").classList.add("hide");
    }
  }, 500);
});

function potenza2(n) {
  let tmp = n,
    log2 = -1;
  while (tmp) {
    tmp >>= 1;
    log2++;
  }
  return !Boolean(n ^ (1 << log2));
}

document.querySelector("#inizia").addEventListener("click", (event) => {
  var componenti = new Set();
  Array.prototype.forEach.call(
    document.querySelector(".componenti").children,
    (el) => {
      if (el.value != "") componenti.add(el.value);
    }
  );
  let tempoMassimo = +document.querySelector("#tempo-massimo").value;
  let performance = document.querySelector("#performance").checked;
  let tempo = document.querySelector("#tempo").checked;
  let valoreFissoVincitore = +document.querySelector("#valore-fisso-vincitore")
    .value;
  let valoreFissoPerdente = +document.querySelector("#valore-fisso-perdente")
    .value;
  let valoreFissoPareggio = +document.querySelector("#valore-fisso-pareggio")
    .value;

  let valoreVariabileVincitore = [
    +document.querySelector("#valore-variabile-vincitore-n").value,
    +document.querySelector("#valore-variabile-vincitore-d").value,
  ];
  let valoreVariabilePerdente = [
    +document.querySelector("#valore-variabile-perdente-n").value,
    +document.querySelector("#valore-variabile-perdente-d").value,
  ];
  let valoreVariabilePareggio = [
    +document.querySelector("#valore-variabile-pareggio-n").value,
    +document.querySelector("#valore-variabile-pareggio-d").value,
  ];
  if (componenti.size < 2)
    return alert("Devono competere almeno 2 concorrenti");
  if (tempoMassimo < 1)
    return alert(
      "Il tempo disponibile per ogni incontro deve essere superiore a 0"
    );

  if (performance) {
    if (tempo) {
      if (
        valoreVariabileVincitore[0] == 0 ||
        valoreVariabilePerdente[0] == 0 ||
        valoreVariabilePareggio[0] == 0
      )
        return alert("Il valore variabile non può essere 0");
      if (
        valoreVariabileVincitore[1] == 0 ||
        valoreVariabilePerdente[1] == 0 ||
        valoreVariabilePareggio[1] == 0
      )
        return alert("La costante temporale di avanzamento non può essere 0");
    } else {
      if (
        valoreFissoVincitore < 0 ||
        valoreFissoPerdente < 0 ||
        valoreFissoPareggio < 0
      )
        return alert("Un valore fisso deve essere positivo");
    }
  } else {
    if (!potenza2(componenti.size))
      return alert(
        "Per creare un torneo a eliminazione, il numero di concorrenti deve essere una potenza di 2 con esponente intero maggiore di 0"
      );
  }
  let raw_data = {
    componenti: Array.from(componenti),
    tempoMassimo: tempoMassimo,
    performance: performance,
  };
  if (performance) {
    raw_data.valoriVariabili = tempo;
    if (tempo) {
      raw_data.vincitore = valoreVariabileVincitore;
      raw_data.perdente = valoreVariabilePerdente;
      raw_data.pareggio = valoreVariabilePareggio;
    } else {
      raw_data.vincitore = valoreFissoVincitore;
      raw_data.perdente = valoreFissoPerdente;
      raw_data.pareggio = valoreFissoPareggio;
    }
  }
  let data = {
    headers: {
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(raw_data),
    method: "POST",
  };
  fetch("/create", data)
    .then((res) => res.json())
    .then((res) => {
      window.location = "/manage/" + res.url;
    });
});
