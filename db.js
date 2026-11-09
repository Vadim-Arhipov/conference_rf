import Database from "better-sqlite3";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'
import { console } from "inspector";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'conf.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fio TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    created_ TEXT DEFAULT (datetime('now'))
      );
    `)

    const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;

    if (count === 0) {
      const stmt = db.prepare(`
        INSERT INTO users (login, password, fio, phone, email)
        VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run('ivan', 'demo', 'Иванов Иван', '8(999)123-45-67', 'ivan@example.com');
        stmt.run('petr', 'demo', 'Петров Пётр', '8(999)123-45-68', 'petr@example.com');
        stmt.run('anna', 'demo', 'Анна Сидорова', '8(999)123-45-69', 'anna@example.com');
        console.log('Тестовые пользователи добавлены');
    }
    
db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL
      );
    `)

    const countroom = db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c;

    if (countroom === 0) {
      const stmt = db.prepare(`
        INSERT INTO rooms (name, type, capacity)
        VALUES (?, ?, ?)
        `);
        stmt.run('Кабинет 404', 'переговорная', '10');
        stmt.run('Зал', 'ораторская', '100');
        stmt.run('Спортзал', 'спорт', '50');
        console.log('Тестовые пользователи добавлены');
    }

db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    date_start TEXT NOT NULL,
    payment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Новая',
    review TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
      );
    `)

    const requestsCount = db.prepare('SELECT COUNT(*) AS c FROM requests').get().c;

    if (requestsCount === 0) {
      const stmtRequest = db.prepare(`
        INSERT INTO requests (user_id, room_id, date_start, payment)
        VALUES (?, ?, ?, ?)
        `);
        stmtRequest.run(1, 1, "2027-03-15", "При очном посещении");
        stmtRequest.run(1, 3, "2027-03-20", "Перевод по СБП");
        stmtRequest.run(2, 3, "2027-04-01", "При очном посещении");
        console.log('Тестовые заявки добавлены');
    }

    class UserClass  {
      constructor() {
        this.table = "users";
      }

      findById(id){
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
      }

      findByLogin(login){
        return db.prepare(`SELECT * FROM ${this.table} WHERE login = ?`).get(login);
      }
      findAll() {
        return db.prepare(`SELECT * FROM ${this.table}`).all();
      }

      count() {
        const row = db.prepare(`SELECT COUNT(*) AS total FROM ${this.table}`).get();
        return row ? row.total : 0;
      }

      exists(login) {
        const row = db.prepare(`SELECT id FROM ${this.table} WHERE login = ?`).get(login);
        return !!row;
      }
    }

    class RoomClass {
      constructor() {
        this.table = "rooms";
      }
      findAll() {
        return db.prepare(`SELECT * FROM ${this.table}`).all();
      }
      findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
      }
      findByType(type) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE type = ? COLLATE NOCASE`).all(type);
      }
      count() {
        const result = db.prepare(`SELECT COUNT(*) AS total FROM ${this.table}`).get();
        return result ? result.total : 0;
      }
    }

    class RequestClass {
      constructor() {
        this.table = "Requests";
      }

      findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
      }
      findByUser(userId) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE user_id = ?`).all(userId);
      }

      rooms(type) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE type = ? COLLATE NOCASE`).all(type);
      }
      count() {
        const result = db.prepare(`SELECT COUNT(*) AS total FROM ${this.table}`).get();
        return result ? result.total : 0;
      }
      updateStatus(id, status) {
        const result = db.prepare(`UPDATE ${this.table} SET status = ? WHERE id = ?`).run(status, id);
        return result.changes > 0;
      }
      findAllDetailed() {
        return db.prepare(`SELECT * FROM ${this.table}`).all(); 
      }
    }

    export const User = new UserClass ();
    export const Room = new RoomClass();
    export const Request = new RequestClass();

    export default db;