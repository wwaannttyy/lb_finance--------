from flask import Flask, request, jsonify
import sqlite3
import requests

app = Flask(__name__)

# Подключение к базе данных
def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# Отправка сообщения в Telegram
def send_text_message(chat_id, text):
    bot_token = '5407387141:AAFE-BDFeNRta4xoJJCmDOo7oOSjXHWogNI'  # Замените на ваш токен бота
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': text
    }
    requests.post(url, json=payload)

# Обработка вебхука
@app.route('/webhook', methods=['POST'])
def webhook():
    update = request.json
    user_id = update['message']['from']['id']  # Получаем user_id
    message_text = update['message']['text']  # Получаем текст сообщения

    if message_text == '/start':
        welcome_message = f"Hello! Your user ID is {user_id}. You can now set your budget."
        send_text_message(user_id, welcome_message)
        create_user(user_id)  # Создаем пользователя в базе данных

    return jsonify({"status": "ok"}), 200

# Создание пользователя в базе данных
def create_user(user_id):
    conn = get_db_connection()
    conn.execute('''
        INSERT OR IGNORE INTO users (user_id, budget, last_day)
        VALUES (?, 0, '2024-12-31')  # Установите бюджет и дату по умолчанию
    ''', (user_id,))
    conn.commit()
    conn.close()

if __name__ == '__main__':
    app.run(port=5001)  # Запускаем на другом порту
