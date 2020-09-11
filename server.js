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
  data.started = false;
  data.ordine = data.componenti.slice();
  data.ordine.sort(() => Math.random() - 0.5);
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
    if (ordine.length == 2 * disputati + 1) res.redirect("/view/" + hash);
    else {
      let partecipanti = [ordine[disputati * 2], ordine[disputati * 2 + 1]];
      res.render("manage", {
        concorrente1: partecipanti[0],
        concorrente2: partecipanti[1],
        hash: hash,
        tempoMax: contest.value().tempoMassimo,
      });
    }
  } else {
    res.send("risorsa non ancora implementata");
  }
});

app.post("/winner", (req, res) => {
  //TODO: aggiungi controllo
  let hash = req.body.hash;
  let winner = req.body.winner;
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  db.get("contests").find({ hash: hash }).get("ordine").push(winner).write();
  db.get("contests")
    .find({ hash: hash })
    .assign({
      disputati: db.get("contests").find({ hash: hash }).value().disputati + 1,
    })
    .write();
  res.json({ message: "ok" });
});

app.post("/start", (req, res) => {
  let hash = req.body.hash;
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  db.get("contests").find({ hash: hash }).assign({ started: true }).write();
  console.dir("Contest " + hash + " has started");
  res.json({ message: "ok" });
});

app.get("/view/[0123456789abcdef]{64}", (req, res) => {
  let hash = req.path.substr(6);
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  let contest = db.get("contests").find({ hash: hash }).value();
  if (contest.state === "idle")
    res.send("Il torneo non è stato ancora avviato dal gestore");
  else {
    res.send(
      "Questo è il tuo hash: " +
        hash +
        "<br>" +
        "Il vincitore è: " +
        contest.ordine[contest.ordine.length - 1]
    );
  }
});

app.get("*", (_req, res) => {
  res.render("404");
});
