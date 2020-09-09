var express = require("express");
const ejs = require("ejs");
const lowdb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const crypto = require("crypto");
const fs = require("fs");
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

app.get("/manage/[0123456789abcdef]{64}", (req, res) => {
  let hash = req.path.substr(8);
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  let contest = db.get("contests").find({ hash: hash });
  if (!contest.performance) {
    //eliminazione diretta
    let ordine = contest.value().ordine;
    let disputati = contest.value().disputati;
    if (
      ordine.length ==
      (1 << Math.ceil(Math.log2(contest.value().componenti.length + 1))) - 1
    )
      res.send("Vincitore: " + ordine[ordine.length - 1]);
    else {
      let partecipanti = [ordine[disputati * 2], ordine[disputati * 2 + 1]];
      res.send(partecipanti[0] + " " + partecipanti[1]);
    }
  }
});

app.post("/winner", (req, res) => {
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
  // res.redirect("/manage/" + hash);
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
  else res.send("Questo è il tuo hash: " + hash);
});

app.get("*", (_req, res) => {
  res.render("404");
});
