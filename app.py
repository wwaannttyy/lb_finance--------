from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

# Подключение к базе данных
def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# Инициализация базы данных
def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        budget REAL,
        last_day TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        date TEXT,
        FOREIGN KEY(user_id) REFERENCES users(user_id)
    )''')
    conn.commit()
    conn.close()

# Главная страница
@app.route('/')
def index():
    user_id = request.args.get('user_id')  # Получаем user_id из параметров запроса
    return render_template('index.html', user_id=user_id)

# Добавление пользователя в базу
@app.route('/add_user', methods=['POST'])
def add_user():
    user_id = request.json.get('user_id')  # Получаем user_id
    budget = request.json.get('budget')
    last_day = request.json.get('last_day')
    
    conn = get_db_connection()
    conn.execute('''
        INSERT OR IGNORE INTO users (user_id, budget, last_day)
        VALUES (?, ?, ?)
    ''', (user_id, budget, last_day))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "User added"}), 201

# Остальные маршруты остаются без изменений...

if __name__ == '__main__':
    init_db()
    app.run(port=5000)  # Убедитесь, что сервер работает на порту 5000

