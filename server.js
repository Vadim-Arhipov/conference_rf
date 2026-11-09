import express from 'express';
import {fileURLToPath} from "url";
import {dirname, join} from "path"
import { User, Room, Request } from "./db.js";
import session from 'express-session'

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const rooms = Room.findAll();
const INACTIVITY_LIMIT = 20 * 60 * 1000;
const RULES = [
  { field: 'login',    test: v => /^[A-Za-z0-9]{6,}$/.test(v),             msg: 'Логин: латиница+цифры, минимум 6 символов' },
  { field: 'password', test: v => v && v.length >= 8,                      msg: 'Пароль: минимум 8 символов' },
  { field: 'fio',      test: v => /^[А-Яа-яЁё\s]+$/.test(v),               msg: 'ФИО: только кириллица и пробелы' },
  { field: 'phone',    test: v => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(v), msg: 'Телефон: формат 8(ХХХ)ХХХ-ХХ-ХХ' },
  { field: 'email',    test: v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),    msg: 'Email: некорректный формат' }
];

const validate = data => RULES
  .filter(({ field, test }) => !test((data[field] || '').trim()))
  .map(r => r.msg);


// const newRequest = Request.create({
//     userId: 1,
//     roomId: 2,
//     dateStart: "2027-04-10",
//     payment: "При очном посещении",
// });
// console.log("Созданная заявка:");
// console.log(newRequest);

app.set("view engine", "ejs");
app.set("views", "./views");

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

const requireAuth = (req, res, next) =>
    req.session.userId ? next() : res.redirect('/login');

const requireAdmin = (req, res, next) =>
    req.session.login === 'Conf2027' ? next() : res.redirect('/login');


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

app.get("/", (req, res) => {
    res.redirect("/rooms");
});
app.get("/rooms", (req, res) => {
 const rooms = Room.findAll();   
 res.render("rooms", { rooms });
});
app.get("/rooms/type/:type", (req, res) => {
    const rooms = Room.findByType(req.params.type);
    res.render("rooms", { rooms });
});

app.get('/dashboard', requireAuth, (req, res) => {
    const requests = Request.findByUser(req.session.userId);
    res.render('request_list', {isAdmin: false, requests });
});

app.get('/admin', requireAdmin, (req, res) => {
    const requests = Request.findAllDetailed();
    res.render('request_list', {isAdmin: true, requests });
});

app.post('/admin', requireAdmin, (req, res) => {
    Request.updateStatus(req.params.id, req.body.status);
    res.redirect('/admin');
});

app.post('/review/:id', requireAuth, (req, res) => {
    Request.addReview(req.body.id, req.session.userId, req.body.review);
    res.redirect('/dashboard');
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

app.get('/register', (req, res) => {
    res.render('auth', {
        mode: 'register',
        form: {},
        errors: []
    });
});

app.post('/register', (req, res) => {
    const errors = validate(req,body);

    if (User.exists(req.body.login)) {
        errors.push('Логин уже занят');
    }

    if (errors.length) {
        return res.render('auth', {
            mode: 'register',
            form: req.body,
            errors
        });
    }

    User.create(req.body);

  req.session.flash = {
    type: 'success',
    text: 'Регистрация успешна. Войдите'
  }
  res.redirect('/login')
})

app.get('/login', (req, res) => {
  const flash = req.session.flash || null
  delete req.session.flash

  res.render('auth', {
    mode: 'login',
    error: null,
    flash
  })
})
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

app.all('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});