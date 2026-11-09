import express from 'express';
import {fileURLToPath} from "url";
import {dirname, join} from "path"
import { User, Room, Request } from "./db.js";
import { error } from 'console';
import session from 'express-session'

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express ();
const PORT = 3000;
const rooms = Room.findAll();
// const newRequest = Request.create({
//     userId: 1,
//     roomId: 2,
//     dateStart: "2027-04-10",
//     payment: "При очном посещении",
// });
// console.log("Созданная заявка:");
// console.log(newRequest);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));
app.use(session({
    secret: 'conf2027-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

const INACTIVITY_LIMIT = 20 * 60 * 1000;

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.use((req, res, next) => {
    if (req.session && req.session.userId) {
        const now = Date.now();

if (req.session.lastActivity && (now - req.session.lastActivity > INACTIVITY_LIMIT)) {
    return req.session.destroy(() => {
        res.redirect('/login');
    });
}

    req.session.lastActivity = now
}
next();
});

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

app.post('/login', (req, res) => {
    const user = User.findByLogin(req.body.login);

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
        req.session.userId = user.id;
        req.session.fio = user.fio;
        req.session.login = user.login
        req.session.lastActivity = Date.now();
        
        return res.redirect(user.login === 'Conf2027' ? '/admin' : '/dashboard');
    }

    res.render('auth', {
        mode: 'login',
        error: 'Неверный логин или пароль',
        flash: null
    });
});

app.get("/create", (req, res) => {
 res.render("create_request", { rooms, error: [] });
});