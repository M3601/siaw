var express = require("express");
const lowdb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const crypto = require("crypto");
const path = require("path");

var app = express();
var adapter = new FileSync("./db.json");
var db = lowdb(adapter);

db.defaults({
  contests: [],
}).write();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.set("view engine", "ejs");
app.listen(process.env.PORT || 80);

app.get("/favicon.ico", (_req, res) => {
  res.sendFile(path.join(__dirname, "/public/arm.svg"));
});

app.get("/", (_req, res) => {
  res.render("home");
});

app.post("/create", (req, res) => {
  let data = req.body;
  console.dir(data);
  let hash = crypto.randomBytes(32).toString("hex");
  console.dir(hash);
  data.hash = hash;
  data.state = "idle";
  if (data.performance) {
    data.componenti.sort(() => Math.random() - 0.5);
    data.ordine = [];
    for (let i = 0; i < data.componenti.length - 1; i++)
      for (let j = i + 1; j < data.componenti.length; j++)
        data.ordine.push([data.componenti[i], data.componenti[j]]);
    data.ordine.sort(() => Math.random() - 0.5);
    data.points = {};
    data.componenti.forEach((element) => {
      data.points[element] = 0;
    });
    try {
      data.vincitore = data.vincitore[0] / data.vincitore[1];
      data.perdente = data.perdente[0] / data.perdente[1];
      data.pareggio = data.pareggio[0] / data.pareggio[1];
    } catch (error) {}
  } else {
    data.ordine = data.componenti.slice();
    data.ordine.sort(() => Math.random() - 0.5);
  }
  data.disputati = 0;
  db.get("contests").push(data).write();
  res.json({ url: hash });
});

app.get("/404", (_req, res) => {
  res.sendFile(path.join(__dirname, "/public/404.css"));
});

app.get("/css/manage", (_req, res) => {
  res.sendFile(path.join(__dirname, "/public/manage.css"));
});

app.get("/js/manage", (_req, res) => {
  res.sendFile(path.join(__dirname, "/public/manage.js"));
});

app.get("/fitty", (_req, res) => {
  res.sendFile(path.join(__dirname, "/node_modules/fitty/dist/fitty.min.js"));
});

app.get("/manage/[0123456789abcdef]{64}", (req, res) => {
  let hash = req.path.substr(8);
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  let contest = db.get("contests").find({ hash: hash });
  if (!contest.value().performance) {
    //eliminazione diretta
    let ordine = contest.value().ordine;
    let disputati = contest.value().disputati;
    if (ordine.length == 2 * disputati + 1) {
      db.get("contests")
        .find({ hash: hash })
        .assign({ state: "finished" })
        .write();
      res.redirect("/view/" + hash);
    } else {
      let partecipanti = [ordine[disputati * 2], ordine[disputati * 2 + 1]];
      res.render("manage", {
        concorrente1: partecipanti[0],
        concorrente2: partecipanti[1],
        hash: hash,
        tempoMax: contest.value().tempoMassimo,
        performance: false,
      });
    }
  } else if (contest.value().valoriVariabili) {
    let disputati = contest.value().disputati;
    let p = (n) => {
      return Math.floor((n * (n - 1)) / 2);
    };
    if (disputati >= p(contest.value().componenti.length)) {
      db.get("contests")
        .find({ hash: hash })
        .assign({ state: "finished" })
        .write();
      res.redirect("/view/" + hash);
    } else {
      res.render("manage", {
        concorrente1: contest.value().ordine[disputati][0],
        concorrente2: contest.value().ordine[disputati][1],
        hash: hash,
        tempoMax: contest.value().tempoMassimo,
        performance: true,
      });
    }
  }
});

app.post("/winner", (req, res) => {
  let hash = req.body.hash;
  let winner = req.body.winner;
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  if (db.get("contests").find({ hash: hash }).value().performance) {
    let contest = db.get("contests").find({ hash: hash });
    let data = {};
    if (contest.value().valoriVariabili) {
      let tempoTrascorso =
        contest.value().tempoMassimo - req.body.remainingTime;
      if (contest.value().vincitore < 0)
        data[winner] =
          contest.get("points").value()[winner] +
          Math.abs(contest.value().tempoMassimo * contest.value().vincitore) +
          contest.value().vincitore * tempoTrascorso;
      else
        data[winner] =
          contest.get("points").value()[winner] +
          tempoTrascorso * contest.value().vincitore;
    } else {
      data[winner] =
        contest.get("points").value()[winner] + contest.value().vincitore;
    }
    contest.get("points").assign(data).write();
    db.get("contests")
      .find({ hash: hash })
      .assign({
        disputati:
          db.get("contests").find({ hash: hash }).value().disputati + 1,
      })
      .write();
    res.json({ message: "procedi" });
  } else {
    db.get("contests").find({ hash: hash }).get("ordine").push(winner).write();
    db.get("contests")
      .find({ hash: hash })
      .assign({
        disputati:
          db.get("contests").find({ hash: hash }).value().disputati + 1,
      })
      .write();
    res.json({ message: "ok" });
  }
});

app.post("/loser", (req, res) => {
  let hash = req.body.hash;
  let loser = req.body.loser;
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  let contest = db.get("contests").find({ hash: hash });
  let data = {};
  if (contest.value().valoriVariabili) {
    let tempoTrascorso = contest.value().tempoMassimo - req.body.remainingTime;
    if (contest.value().perdente < 0)
      data[loser] =
        contest.get("points").value()[loser] +
        Math.abs(contest.value().tempoMassimo * contest.value().perdente) +
        contest.value().perdente * tempoTrascorso;
    else
      data[loser] =
        contest.get("points").value()[loser] +
        tempoTrascorso * contest.value().perdente;
  } else {
    data[loser] =
      contest.get("points").value()[loser] + contest.value().perdente;
  }
  contest.get("points").assign(data).write();
  res.json({ message: "ok" });
});

app.post("/draw", (req, res) => {
  let hash = req.body.hash;
  let concorrente1 = req.body.concorrente1;
  let concorrente2 = req.body.concorrente2;
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  let contest = db.get("contests").find({ hash: hash });
  let data = {};
  if (contest.value().valoriVariabili) {
    let tempoTrascorso = contest.value().tempoMassimo - req.body.remainingTime;
    if (contest.value().pareggio < 0) {
      data[concorrente1] =
        contest.get("points").value()[concorrente1] +
        Math.abs(contest.value().tempoMassimo * contest.value().pareggio) +
        contest.value().pareggio * tempoTrascorso;
      data[concorrente2] =
        contest.get("points").value()[concorrente2] +
        Math.abs(contest.value().tempoMassimo * contest.value().pareggio) +
        contest.value().pareggio * tempoTrascorso;
    } else {
      data[concorrente1] =
        contest.get("points").value()[concorrente1] +
        tempoTrascorso * contest.value().pareggio;
      data[concorrente2] =
        contest.get("points").value()[concorrente2] +
        tempoTrascorso * contest.value().pareggio;
    }
  } else {
    data[concorrente1] =
      contest.get("points").value()[concorrente1] + contest.value().pareggio;
    data[concorrente2] =
      contest.get("points").value()[concorrente2] + contest.value().pareggio;
  }
  contest.get("points").assign(data).write();
  contest
    .assign({
      disputati: db.get("contests").find({ hash: hash }).value().disputati + 1,
    })
    .write();
  res.json({ message: "ok" });
});

app.post("/set", (req, res) => {
  let hash = req.body.hash;
  let state = req.body.state;
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  db.get("contests").find({ hash: hash }).assign({ state: state }).write();
  console.dir(`Contest ${hash} changed state in ${state}`);
  res.json({ message: "ok" });
});

app.get("/view/[0123456789abcdef]{64}", (req, res) => {
  let hash = req.path.substr(6);
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  let contest = db.get("contests").find({ hash: hash }).value();
  if (contest.state === "idle") {
    res.send("Il torneo non è stato ancora avviato dal gestore");
  } else {
    if (contest.performance) {
      let classifica = Object.entries(contest.points).sort((e1, e2) => {
        if (e1[1] > e2[1]) return -1;
        else if (e1[1] < e2[1]) return 1;
        else return 0;
      });
      console.dir(classifica);
      res.render("classificapunti", {
        classifica: classifica,
        hash: hash,
        messaggio:
          contest.state === "started"
            ? "Il torneo è ancora in corso di svolgimento"
            : "",
      });
    } else {
      let classifica = [];
      contest.ordine
        .slice()
        .reverse()
        .forEach((el) => {
          if (!classifica.includes(el)) classifica.push(el);
        });
      console.dir(classifica);
      res.render("classifica", {
        classifica: classifica,
        hash: hash,
        messaggio:
          contest.state === "started"
            ? "Il torneo è ancora in corso di svolgimento"
            : "",
      });
    }
  }
});

app.get("*", (_req, res) => {
  res.render("404");
});
