import express from 'express';
import {fileURLToPath} from "url";
import {dirname, join} from "path"
import { User, Room, Request } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express ();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/auth", (req, res) => {
 res.render("auth");
});

app.post("/auth", (req, res) => {
 res.send("auth");
});

app.get("/create_request", (req, res) => {
 res.render("create_request");
});

app.post("/create_request", (req, res) => {
 res.send("create_request");
});

app.get("/footer", (req, res) => {
 res.render("footer");
});

app.post("/footer", (req, res) => {
 res.send("footer");
});

app.get("/header", (req, res) => {
 res.render("header");
});

app.post("/header", (req, res) => {
 res.send("header");
});

app.get("/requests_list", (req, res) => {
 res.render("requests_list");
});

app.post("/requests_list", (req, res) => {
 res.send("requests_list");
});

app.get("/create_request", (req, res) => {
 res.render("create_request");
});

app.post("/create_request", (req, res) => {
 res.send("create_request");
});

app.get("/request_detail", (req, res) => {
 res.render("request_detail");
});

app.post("/request_detail", (req, res) => {
 res.send("request_detail");
});

app.listen (PORT, () => {
    console.log (`Сервер: http://localhost:${PORT}`);
});

