import express from 'express';
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db, { User, Room, Request } from './db.js';
import session from 'express-session';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const INACTIVITY_LIMIT = 20 * 60 * 1000;
const ADMIN_LOGIN = 'conf2027';

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

const requireAuth = (req, res, next) =>
  req.session.userId ? next() : res.redirect('/login');
const requireAdmin = (req, res, next) =>
  req.session.login === ADMIN_LOGIN ? next() : res.redirect('/login');

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));
app.use(session({
  secret: 'conf2027-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // 2 часа
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
      return req.session.destroy(() => res.redirect('/login'));
    }
    req.session.lastActivity = now;
  }
  next();
});

app.get('/register', (req, res) => {
  res.render('auth', { mode: 'register', form: {}, errors: [] });
});

app.post('/register', (req, res) => {
  const errors = validate(req.body);
  if (User.exists(req.body.login)) errors.push('Этот логин уже занят');

  if (errors.length) {
    return res.render('auth', { mode: 'register', form: req.body, errors });
  }

  const { login, password, fio, phone, email } = req.body;
  db.prepare(`INSERT INTO users (login, password, fio, phone, email) VALUES (?, ?, ?, ?, ?)`)
    .run(login.trim(), password, fio.trim(), phone.trim(), email.trim());

  req.session.flash = { type: 'success', text: 'Регистрация успешна. Войдите' };
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  const flash = req.session.flash || null;
  delete req.session.flash;
  res.render('auth', { mode: 'login', error: null, flash });
});

app.post('/login', (req, res) => {
  const user = User.findByLogin(req.body.login);

  if (user && user.password === req.body.password) {
    req.session.userId = user.id;
    req.session.fio = user.fio;
    req.session.login = user.login;
    req.session.lastActivity = Date.now();
    return res.redirect(user.login === ADMIN_LOGIN ? '/admin' : '/dashboard');
  }

  res.render('auth', { mode: 'login', error: 'Неверный логин или пароль', flash: null });
});



app.all('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get("/", (req, res) => res.redirect("/rooms"));

app.get("/rooms", (req, res) => {
  res.render("rooms", { rooms: Room.findAll() });
});

app.get("/rooms/type/:type", (req, res) => {
  res.render("rooms", { rooms: Room.findByType(req.params.type) });
});

app.get('/dashboard', requireAuth, (req, res) => {
  const requests = Request.findByUser(req.session.userId);
  console.log(requests)
  res.render('requests_list', { isAdmin: false, requests });
});

app.get('/admin', requireAdmin, (req, res) => {
  const requests = Request.findAllDetailed();
  res.render('requests_list', { isAdmin: true, requests });
});

app.post('/admin', requireAdmin, (req, res) => {
  Request.updateStatus(req.body.id, req.body.status);
  res.redirect('/admin');
});

app.get("/create", requireAuth, (req, res) => {
  res.render("create_request", { rooms: Room.findAll(), errors: [] });
});

app.post('/create', requireAuth, (req, res) => {
  Request.create({
    userId: req.session.userId,
    roomId: req.body.room_id,
    dateStart: req.body.date_start,
    payment: req.body.payment
  })
  res.redirect('/dashboard')
})

// app.post("/create", requireAuth, (req, res) => {
//   res.render("create_request", { rooms: Room.findAll(), errors: [] });
// });

app.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});