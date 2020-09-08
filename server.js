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

app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");
app.listen(process.env.port || 80);

app.get("/", (req, res) => {
  res.render("home");
});

app.post("/create", (req, res) => {
  let data = req.body;
  console.dir(data);
  let hash = crypto.randomBytes(32).toString("hex");
  console.dir(hash);
  data.hash = hash;
  db.get("contests").push(data).write();
  res.json({ url: hash });
});

app.get("/404", (req, res) => {
  // res.send(fs.readSync("./public/404.css"));
  res.sendFile(path.join(__dirname, "/public/404.css"));
});
app.get("/manage/[0123456789abcdef]{64}", (req, res) => {
  let hash = req.path.substr(8);
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  res.send(hash);
});

app.get("/view/[0123456789abcdef]{64}", (req, res) => {
  let hash = req.path.substr(6);
  if (db.get("contests").find({ hash: hash }).value() == undefined)
    return res.render("404");
  res.send("Questo è il tuo hash: " + hash);
});

app.get("*", (req, res) => {
  res.render("404");
});
