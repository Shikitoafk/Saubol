/**
 * ============================================================================
 *               MVP «ОНЛАЙН-БИБЛИОТЕКА ШКОЛЫ» (SMARTLIB)
 * ============================================================================
 * 
 * ПОЛНОФУНКЦИОНАЛЬНОЕ ВЕБ-ПРИЛОЖЕНИЕ В ОДНОМ ФАЙЛЕ (Express + SQLite3 + Glassmorphic UI)
 * 
 * Данный файл является готовым серверным Node.js кодом, который:
 *  1. Создает и инициализирует базу данных SQLite (создает таблицы и наполняет демо-данными).
 *  2. Реализует REST API для авторизации учеников/админов, выдачи, утери и возврата книг.
 *  3. Содержит встроенные HTML/CSS/JS шаблоны страниц для Ученика и Библиотекаря.
 *  4. Включает полностью настроенный веб-сканер штрихкодов через камеру на базе `html5-qrcode`.
 * 
 * ИНСТРУКЦИЯ ПО ЗАПУСКУ ЗА 2 МИНУТЫ:
 *  1. Установите зависимости: npm install express sqlite3 cors
 *  2. Сохраните этот файл как `server.js`
 *  3. Запустите сервер: node server.js
 *  4. Откройте в браузере: http://localhost:3000
 * 
 * Тестовые данные для входа:
 *  - Ученик (ИИН/Код): 2026001 (Александр), 2026002 (Мария), 2026003 (Алихан)
 *  - Библиотекарь: логин "admin", пароль "admin123"
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ИНИЦИАЛИЗАЦИЯ И НАСТРОЙКА БАЗЫ ДАННЫХ ---
const dbPath = path.join(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к SQLite:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // 1. Таблица Учеников (Students)
        db.run(`CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            grade TEXT NOT NULL,
            student_code TEXT UNIQUE NOT NULL
        )`);

        // 2. Таблица Книг (Books)
        db.run(`CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inventory_number TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            publish_year INTEGER NOT NULL
        )`);

        // 3. Таблица Выдач/Транзакций (Loans)
        db.run(`CREATE TABLE IF NOT EXISTS loans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active', -- 'active', 'returned', 'lost'
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (book_id) REFERENCES books(id)
        )`);

        // Наполняем базу тестовыми данными, если она пуста
        db.get("SELECT COUNT(*) as count FROM students", [], (err, row) => {
            if (row && row.count === 0) {
                console.log('База пуста. Наполнение демо-данными...');
                
                // Добавление учеников
                const stmtStud = db.prepare("INSERT INTO students (full_name, grade, student_code) VALUES (?, ?, ?)");
                stmtStud.run("Иванов Александр Сергеевич", "10-А", "2026001");
                stmtStud.run("Смирнова Мария Дмитриевна", "11-Б", "2026002");
                stmtStud.run("Кожахметов Алихан Ерланович", "9-В", "2026003");
                stmtStud.finalize();

                // Добавление книг
                const stmtBook = db.prepare("INSERT INTO books (inventory_number, title, author, publish_year) VALUES (?, ?, ?, ?)");
                stmtBook.run("INV-001001", "Алгебра и начала анализа", "Алимов Ш.А.", 2022);
                stmtBook.run("INV-001002", "Физика. 10 класс", "Мякишев Г.Я.", 2021);
                stmtBook.run("INV-001003", "Литература. Том 1", "Коровина В.Я.", 2023);
                stmtBook.run("INV-001004", "История Казахстана", "Аяган Б.Г.", 2020);
                stmtBook.run("INV-001005", "Геометрия. 7-9 класс", "Атанасян Л.С.", 2019);
                stmtBook.finalize();

                // Добавление выдач (Loans)
                // Александр (ID 1) взял Алгебру (ID 1) и Физику (ID 2)
                db.run("INSERT INTO loans (student_id, book_id, status) VALUES (1, 1, 'active')");
                db.run("INSERT INTO loans (student_id, book_id, status) VALUES (1, 2, 'active')");
                // Мария (ID 2) взяла Историю (ID 4)
                db.run("INSERT INTO loans (student_id, book_id, status) VALUES (2, 4, 'active')");
                
                console.log('Демо-данные успешно импортированы.');
            }
        });
    });
}

// ============================================================================
//                                REST API ЭНДПОИНТЫ
// ============================================================================

// 1. Авторизация Ученика (по student_code / ИИН)
app.post('/api/student/login', (req, res) => {
    const { student_code } = req.body;
    if (!student_code) {
        return res.status(400).json({ error: 'Пожалуйста, введите код ученика или ИИН' });
    }

    db.get("SELECT * FROM students WHERE student_code = ?", [student_code.trim()], (err, student) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сервера при авторизации' });
        }
        if (!student) {
            return res.status(404).json({ error: 'Ученик с таким кодом не найден. Проверьте правильность ввода.' });
        }
        res.json({ success: true, student });
    });
});

// 2. Список выданных книг ученика (активные долги)
app.get('/api/student/books/:student_id', (req, res) => {
    const { student_id } = req.params;
    
    const query = `
        SELECT loans.id as loan_id, loans.status as loan_status, loans.issued_at, 
               books.title, books.author, books.publish_year, books.inventory_number
        FROM loans
        JOIN books ON loans.book_id = books.id
        WHERE loans.student_id = ? AND loans.status IN ('active', 'lost')
    `;

    db.all(query, [student_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сервера при получении списка книг' });
        }
        res.json({ books: rows });
    });
});

// 3. Отметка книги как утерянной со стороны Ученика
app.post('/api/student/lost', (req, res) => {
    const { loan_id } = req.body;
    if (!loan_id) {
        return res.status(400).json({ error: 'Не указан ID выдачи' });
    }

    // Проверяем существование записи и обновляем статус
    db.get("SELECT loans.*, books.title, books.author, books.publish_year FROM loans JOIN books ON loans.book_id = books.id WHERE loans.id = ?", [loan_id], (err, loan) => {
        if (err || !loan) {
            return res.status(404).json({ error: 'Запись о выдаче не найдена' });
        }

        if (loan.status === 'lost') {
            return res.status(400).json({ error: 'Книга уже отмечена как утерянная' });
        }

        db.run("UPDATE loans SET status = 'lost' WHERE id = ?", [loan_id], (err2) => {
            if (err2) {
                return res.status(500).json({ error: 'Ошибка БД при смене статуса' });
            }
            res.json({
                success: true,
                message: 'Книга переведена в статус «Утеряна»',
                instruction: `Книга утеряна. Вам необходимо купить на замену: ${loan.author}, "${loan.title}", год издания от ${loan.publish_year} г. (или новее).`
            });
        });
    });
});

// 4. Авторизация библиотекаря
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // В MVP используем жестко зашитые креды для скорости запуска
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, token: 'session_token_admin_mock' });
    } else {
        res.status(401).json({ error: 'Неверный логин или пароль библиотекаря!' });
    }
});

// 5. Статистика и списки должников/потеряшек для дашборда библиотекаря
app.get('/api/admin/dashboard', (req, res) => {
    // Собираем агрегированные данные
    const statsQuery = `
        SELECT 
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
            COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_count,
            COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_count
        FROM loans
    `;

    db.get(statsQuery, [], (err, stats) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка получения статистики' });
        }

        // Список всех активных долгов (Должники)
        const debtorsQuery = `
            SELECT loans.id as loan_id, loans.issued_at, 
                   students.full_name as student_name, students.grade, students.student_code,
                   books.title as book_title, books.inventory_number
            FROM loans
            JOIN students ON loans.student_id = students.id
            JOIN books ON loans.book_id = books.id
            WHERE loans.status = 'active'
            ORDER BY students.grade, students.full_name
        `;

        db.all(debtorsQuery, [], (errDebtors, debtors) => {
            if (errDebtors) {
                return res.status(500).json({ error: 'Ошибка получения списка должников' });
            }

            // Список утерянных книг (Потеряшки, кто должен замену)
            const lostQuery = `
                SELECT loans.id as loan_id, loans.issued_at, 
                       students.full_name as student_name, students.grade, students.student_code,
                       books.title as book_title, books.author as book_author, books.publish_year as book_year, books.inventory_number
                FROM loans
                JOIN students ON loans.student_id = students.id
                JOIN books ON loans.book_id = books.id
                WHERE loans.status = 'lost'
                ORDER BY loans.issued_at DESC
            `;

            db.all(lostQuery, [], (errLost, lostList) => {
                if (errLost) {
                    return res.status(500).json({ error: 'Ошибка получения списка утерянных книг' });
                }

                res.json({
                    stats: {
                        issued: stats.active_count || 0,
                        returned: stats.returned_count || 0,
                        lost: stats.lost_count || 0
                    },
                    debtors,
                    lostList
                });
            });
        });
    });
});

// 6. Возврат книги (по инвентарному номеру из сканера или ручного ввода)
app.post('/api/admin/return', (req, res) => {
    const { inventory_number } = req.body;
    if (!inventory_number) {
        return res.status(400).json({ error: 'Инвентарный номер книги не указан' });
    }

    // 1. Найти книгу по инвентарному номеру
    db.get("SELECT * FROM books WHERE inventory_number = ?", [inventory_number.trim()], (err, book) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка поиска книги в базе данных' });
        }
        if (!book) {
            return res.status(404).json({ error: `Книга с инвентарным номером «${inventory_number}» не зарегистрирована в каталоге!` });
        }

        // 2. Найти активную или утерянную выдачу для этой книги
        db.get(
            "SELECT loans.*, students.full_name, students.grade FROM loans JOIN students ON loans.student_id = students.id WHERE book_id = ? AND status IN ('active', 'lost') ORDER BY id DESC LIMIT 1",
            [book.id],
            (err2, loan) => {
                if (err2) {
                    return res.status(500).json({ error: 'Ошибка поиска активных выдач' });
                }
                
                if (!loan) {
                    return res.status(400).json({ 
                        error: `Книга «${book.title}» числится в библиотеке (нет активных долгов по ней).` 
                    });
                }

                // 3. Обновить статус выдачи на 'returned'
                db.run("UPDATE loans SET status = 'returned' WHERE id = ?", [loan.id], (err3) => {
                    if (err3) {
                        return res.status(500).json({ error: 'Ошибка при проведении возврата в БД' });
                    }
                    res.json({
                        success: true,
                        message: `Книга «${book.title}» успешно сдана!`,
                        details: `Сдал ученик: ${loan.full_name} (${loan.grade})`
                    });
                });
            }
        );
    });
});


// ============================================================================
//                         FRONTEND PAGES (ИНТЕГРИРОВАННЫЕ ШАБЛОНЫ)
// ============================================================================

// Общий HTML макет для красивого вывода стилей (Glassmorphism + Dark Mode)
const getCommonStyles = () => `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    
    :root {
        --bg-grad: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%);
        --glass-bg: rgba(30, 41, 59, 0.45);
        --glass-border: rgba(255, 255, 255, 0.08);
        --glow-primary: rgba(99, 102, 241, 0.15);
        
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        
        --accent-emerald: #10b981;
        --accent-rose: #f43f5e;
        --accent-amber: #f59e0b;
        --accent-indigo: #6366f1;
    }

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Outfit', sans-serif;
        -webkit-tap-highlight-color: transparent;
    }

    body {
        background: var(--bg-grad);
        background-attachment: fixed;
        color: var(--text-main);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-x: hidden;
    }

    .container {
        width: 100%;
        max-width: 1200px;
        padding: 20px;
    }

    /* Glass Card Style */
    .card {
        background: var(--glass-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--glass-border);
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .card:hover {
        box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.1);
    }

    /* Buttons */
    .btn {
        background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%);
        border: none;
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }

    .btn:active {
        transform: translateY(0);
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--glass-border);
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
        box-shadow: none;
    }

    .btn-rose {
        background: linear-gradient(90deg, #f43f5e 0%, #e11d48 100%);
    }

    .btn-rose:hover {
        box-shadow: 0 4px 15px rgba(244, 63, 94, 0.4);
    }

    /* Input Field */
    .input-field {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid var(--glass-border);
        color: white;
        padding: 14px 18px;
        border-radius: 12px;
        width: 100%;
        font-size: 16px;
        outline: none;
        transition: all 0.3s ease;
    }

    .input-field:focus {
        border-color: var(--accent-indigo);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    }

    /* Dynamic Badges */
    .badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 30px;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .badge-active {
        background: rgba(99, 102, 241, 0.15);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .badge-returned {
        background: rgba(16, 185, 129, 0.15);
        color: #6ee7b7;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-lost {
        background: rgba(244, 63, 94, 0.15);
        color: #fca5a5;
        border: 1px solid rgba(244, 63, 94, 0.3);
        animation: pulse-red 2s infinite;
    }

    @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
        70% { box-shadow: 0 0 0 8px rgba(244, 63, 94, 0); }
        100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
    }

    /* Toast Notification */
    .toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        border-radius: 12px;
        background: #1e293b;
        border-left: 5px solid var(--accent-indigo);
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        z-index: 1000;
        transform: translateY(200px);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .toast.show {
        transform: translateY(0);
    }

    /* Header Nav */
    .header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    .logo-container {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .logo-icon {
        font-size: 28px;
        background: linear-gradient(135deg, #818cf8, #6366f1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .logo-text {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.5px;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
</style>
`;

// 1. СТРАНИЦА ВХОДА (Портал)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SmartLib — Портал школы</title>
        ${getCommonStyles()}
        <style>
            .auth-wrapper {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 85vh;
                width: 100%;
            }
            .auth-card {
                width: 100%;
                max-width: 420px;
            }
            .tab-container {
                display: flex;
                border-bottom: 2px solid rgba(255, 255, 255, 0.05);
                margin-bottom: 24px;
            }
            .tab {
                flex: 1;
                text-align: center;
                padding: 12px;
                cursor: pointer;
                color: var(--text-muted);
                font-weight: 500;
                transition: all 0.3s;
                border-bottom: 2px solid transparent;
                margin-bottom: -2px;
            }
            .tab.active {
                color: var(--text-main);
                border-color: var(--accent-indigo);
            }
            .form-group {
                margin-bottom: 20px;
            }
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                color: var(--text-muted);
            }
            .welcome-header {
                text-align: center;
                margin-bottom: 30px;
            }
            .welcome-header h2 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .welcome-header p {
                color: var(--text-muted);
                font-size: 15px;
            }
        </style>
    </head>
    <body>
        <div class="container auth-wrapper">
            <div class="auth-card card">
                <div class="welcome-header">
                    <h2>📚 SmartLib</h2>
                    <p>Онлайн-учет школьных учебников</p>
                </div>
                
                <div class="tab-container">
                    <div class="tab active" onclick="switchTab('student')">Ученик</div>
                    <div class="tab" onclick="switchTab('admin')">Библиотекарь</div>
                </div>

                <!-- Форма Ученика -->
                <form id="studentForm" onsubmit="handleStudentLogin(event)">
                    <div class="form-group">
                        <label for="studentCode">Номер ученического билета или ИИН</label>
                        <input type="text" id="studentCode" class="input-field" placeholder="Например: 2026001" required>
                    </div>
                    <button type="submit" class="btn" style="width: 100%;">Войти без пароля</button>
                </form>

                <!-- Форма Администратора -->
                <form id="adminForm" onsubmit="handleAdminLogin(event)" style="display: none;">
                    <div class="form-group">
                        <label for="adminUser">Логин</label>
                        <input type="text" id="adminUser" class="input-field" placeholder="Логин (admin)" required>
                    </div>
                    <div class="form-group">
                        <label for="adminPass">Пароль</label>
                        <input type="password" id="adminPass" class="input-field" placeholder="Пароль (admin123)" required>
                    </div>
                    <button type="submit" class="btn" style="width: 100%;">Вход в Админ-панель</button>
                </form>
                
                <div id="errorBox" style="color: var(--accent-rose); margin-top: 15px; text-align: center; font-size: 14px; font-weight: 500; display: none;"></div>
            </div>
        </div>

        <script>
            // Переадресация, если сессия уже активна
            if (localStorage.getItem('student_id')) {
                window.location.href = '/student';
            } else if (localStorage.getItem('admin_token')) {
                window.location.href = '/admin';
            }

            function switchTab(role) {
                const tabs = document.querySelectorAll('.tab');
                const studentForm = document.getElementById('studentForm');
                const adminForm = document.getElementById('adminForm');
                const errorBox = document.getElementById('errorBox');
                errorBox.style.display = 'none';

                if (role === 'student') {
                    tabs[0].classList.add('active');
                    tabs[1].classList.remove('active');
                    studentForm.style.display = 'block';
                    adminForm.style.display = 'none';
                } else {
                    tabs[0].classList.remove('active');
                    tabs[1].classList.add('active');
                    studentForm.style.display = 'none';
                    adminForm.style.display = 'block';
                }
            }

            async function handleStudentLogin(e) {
                e.preventDefault();
                const code = document.getElementById('studentCode').value;
                const errorBox = document.getElementById('errorBox');
                errorBox.style.display = 'none';

                try {
                    const response = await fetch('/api/student/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student_code: code })
                    });
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || 'Ошибка входа');
                    }

                    // Сохраняем сессию
                    localStorage.setItem('student_id', data.student.id);
                    localStorage.setItem('student_name', data.student.full_name);
                    localStorage.setItem('student_grade', data.student.grade);
                    localStorage.setItem('student_code', data.student.student_code);

                    window.location.href = '/student';
                } catch (err) {
                    errorBox.textContent = err.message;
                    errorBox.style.display = 'block';
                }
            }

            async function handleAdminLogin(e) {
                e.preventDefault();
                const user = document.getElementById('adminUser').value;
                const pass = document.getElementById('adminPass').value;
                const errorBox = document.getElementById('errorBox');
                errorBox.style.display = 'none';

                try {
                    const response = await fetch('/api/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: user, password: pass })
                    });
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Ошибка входа');
                    }

                    localStorage.setItem('admin_token', data.token);
                    window.location.href = '/admin';
                } catch (err) {
                    errorBox.textContent = err.message;
                    errorBox.style.display = 'block';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// 2. КАБИНЕТ УЧЕНИКА (Mobile-First)
app.get('/student', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Кабинет Ученика | SmartLib</title>
        ${getCommonStyles()}
        <style>
            .header-student {
                padding: 16px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                margin-bottom: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
            }
            .student-info-block {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .student-info-block h3 {
                font-size: 20px;
                font-weight: 700;
            }
            .student-info-block p {
                font-size: 14px;
                color: var(--text-muted);
            }
            .book-card {
                margin-bottom: 16px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .book-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
            }
            .book-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-main);
            }
            .book-meta {
                font-size: 14px;
                color: var(--text-muted);
                margin-top: 4px;
            }
            .no-books {
                text-align: center;
                padding: 40px 20px;
                color: var(--text-muted);
            }
            .no-books-icon {
                font-size: 48px;
                margin-bottom: 16px;
                color: var(--accent-indigo);
            }
            /* Modal overlay */
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                z-index: 100;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .modal.show {
                opacity: 1;
                pointer-events: auto;
            }
            .modal-content {
                background: #1e293b;
                border: 1px solid var(--glass-border);
                border-radius: 20px;
                padding: 24px;
                max-width: 480px;
                width: 100%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                transform: translateY(-20px);
                transition: transform 0.3s ease;
            }
            .modal.show .modal-content {
                transform: translateY(0);
            }
        </style>
    </head>
    <body>
        <div class="container" style="max-width: 600px;">
            <div class="header-student">
                <div class="student-info-block">
                    <h3 id="studentName">Ученик</h3>
                    <p id="studentMeta">Загрузка данных...</p>
                </div>
                <button class="btn btn-secondary" onclick="handleLogout()" style="padding: 8px 14px; font-size: 14px;">Выйти</button>
            </div>

            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <span>📖</span> Закрепленные книги
            </h2>

            <div id="booksContainer">
                <!-- Сюда вставляются книги динамически -->
                <p style="text-align: center; color: var(--text-muted); margin-top: 40px;">Загрузка списка книг...</p>
            </div>
        </div>

        <!-- Модалка инструкции по утере -->
        <div id="lostModal" class="modal">
            <div class="modal-content">
                <h3 style="font-size: 22px; font-weight: 700; color: var(--accent-rose); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    ⚠️ Замена книги
                </h3>
                <p id="lostInstructionText" style="line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; font-size: 16px;"></p>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn" onclick="closeLostModal()">Понятно</button>
                </div>
            </div>
        </div>

        <div id="toast" class="toast">Сообщение</div>

        <script>
            // Проверка авторизации
            const studentId = localStorage.getItem('student_id');
            const studentName = localStorage.getItem('student_name');
            const studentGrade = localStorage.getItem('student_grade');
            const studentCode = localStorage.getItem('student_code');

            if (!studentId) {
                window.location.href = '/';
            }

            document.getElementById('studentName').textContent = studentName;
            document.getElementById('studentMeta').textContent = 'Класс: ' + studentGrade + ' | Код: ' + studentCode;

            function handleLogout() {
                localStorage.clear();
                window.location.href = '/';
            }

            function showToast(message, isSuccess = true) {
                const toast = document.getElementById('toast');
                toast.textContent = message;
                toast.style.borderLeftColor = isSuccess ? 'var(--accent-emerald)' : 'var(--accent-rose)';
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 4000);
            }

            async function fetchBooks() {
                try {
                    const response = await fetch('/api/student/books/' + studentId);
                    const data = await response.json();
                    
                    const container = document.getElementById('booksContainer');
                    container.innerHTML = '';

                    if (!data.books || data.books.length === 0) {
                        container.innerHTML = \`
                            <div class="card no-books">
                                <div class="no-books-icon">🎉</div>
                                <h3>У вас нет долгов!</h3>
                                <p style="margin-top: 8px;">Все школьные учебники вовремя сданы в библиотеку.</p>
                            </div>
                        \`;
                        return;
                    }

                    data.books.forEach(book => {
                        const card = document.createElement('div');
                        card.className = 'card book-card';
                        
                        let badgeHTML = '';
                        let actionButtonHTML = '';

                        if (book.loan_status === 'active') {
                            badgeHTML = '<span class="badge badge-active">На руках</span>';
                            actionButtonHTML = \`<button class="btn btn-rose" style="width: 100%;" onclick="reportLost(\${book.loan_id})">❌ Я потерял эту книгу</button>\`;
                        } else if (book.loan_status === 'lost') {
                            badgeHTML = '<span class="badge badge-lost">Утеряна</span>';
                            actionButtonHTML = \`<button class="btn btn-secondary" style="width: 100%;" onclick="showInstructionModal('\${book.author}', '\${book.title}', \${book.publish_year})">🔍 Инструкция замены</button>\`;
                        }

                        card.innerHTML = \`
                            <div>
                                <div class="book-header">
                                    <div class="book-title">\${book.title}</div>
                                    \${badgeHTML}
                                </div>
                                <div class="book-meta">Автор: \${book.author}</div>
                                <div class="book-meta">Год издания: \${book.publish_year} г.</div>
                                <div class="book-meta" style="font-weight: 500; margin-top: 8px; color: var(--accent-amber);">Инвентарный №: \${book.inventory_number}</div>
                            </div>
                            \${actionButtonHTML}
                        \`;
                        container.appendChild(card);
                    });

                } catch (err) {
                    showToast('Не удалось загрузить список книг', false);
                }
            }

            async function reportLost(loanId) {
                if (!confirm('Вы уверены, что хотите отметить данную книгу как Утерянную? В системе школы зафиксируется необходимость принести замену.')) {
                    return;
                }

                try {
                    const response = await fetch('/api/student/lost', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ loan_id: loanId })
                    });
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error);
                    }

                    showToast('Статус книги изменен на «Утеряна»');
                    fetchBooks();

                    // Показываем инструкцию
                    setTimeout(() => {
                        const modal = document.getElementById('lostModal');
                        document.getElementById('lostInstructionText').innerHTML = data.instruction.replace('замену:', 'замену:<br><br><strong>') + '</strong>';
                        modal.classList.add('show');
                    }, 500);

                } catch (err) {
                    showToast(err.message, false);
                }
            }

            function showInstructionModal(author, title, year) {
                const modal = document.getElementById('lostModal');
                document.getElementById('lostInstructionText').innerHTML = 
                    'Книга утеряна. Вам необходимо купить на замену в библиотеку:<br><br>' + 
                    '<strong>' + author + ', "' + title + '", год издания от ' + year + ' г. (или новее).</strong>';
                modal.classList.add('show');
            }

            function closeLostModal() {
                document.getElementById('lostModal').classList.remove('show');
            }

            // Запуск при старте
            fetchBooks();
        </script>
    </body>
    </html>
    `);
});

// 3. АДМИН-ПАНЕЛЬ БИБЛИОТЕКАРЯ (Desktop/Tablet)
app.get('/admin', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Панель библиотекаря | SmartLib</title>
        ${getCommonStyles()}
        <!-- Подключаем библиотеку сканера из браузера html5-qrcode -->
        <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
        <style>
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
                width: 100%;
            }
            .stat-card {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            .stat-icon {
                font-size: 32px;
                width: 60px;
                height: 60px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .stat-info h4 {
                font-size: 14px;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .stat-info p {
                font-size: 28px;
                font-weight: 700;
                margin-top: 4px;
            }
            .main-layout {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 30px;
                width: 100%;
            }
            @media (max-width: 900px) {
                .main-layout {
                    grid-template-columns: 1fr;
                }
            }
            /* Lists and tables */
            .table-container {
                overflow-x: auto;
                margin-top: 15px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
            }
            th, td {
                padding: 14px 16px;
                font-size: 15px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            th {
                color: var(--text-muted);
                font-weight: 500;
                text-transform: uppercase;
                font-size: 12px;
                letter-spacing: 0.5px;
            }
            tr:hover td {
                background: rgba(255,255,255,0.02);
            }
            .section-title {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            /* Сканер */
            .scanner-container {
                position: relative;
                width: 100%;
                border-radius: 12px;
                overflow: hidden;
                background: #000;
                display: none;
                margin-bottom: 16px;
                border: 2px solid var(--accent-indigo);
            }
            #qr-reader {
                width: 100%;
            }
            .tab-buttons {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                padding-bottom: 10px;
            }
            .tab-btn {
                background: none;
                border: none;
                color: var(--text-muted);
                font-size: 16px;
                font-weight: 600;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.2s;
            }
            .tab-btn.active {
                color: var(--text-main);
                background: rgba(99, 102, 241, 0.15);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-container">
                    <span class="logo-icon">📚</span>
                    <span class="logo-text">SmartLib <span style="font-size: 14px; font-weight: 400; color: var(--accent-indigo);">Админ-панель</span></span>
                </div>
                <div class="user-info">
                    <span style="font-weight: 500; color: var(--text-muted);">Библиотекарь</span>
                    <button class="btn btn-secondary" onclick="handleLogout()" style="padding: 8px 14px; font-size: 14px;">Выйти</button>
                </div>
            </div>

            <!-- ДАШБОРД СТАТИСТИКИ -->
            <div class="dashboard-grid">
                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">📖</div>
                    <div class="stat-info">
                        <h4>На руках (активно)</h4>
                        <p id="statActive">0</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">✅</div>
                    <div class="stat-info">
                        <h4>Сдано за сезон</h4>
                        <p id="statReturned">0</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(244, 63, 94, 0.15); color: #f87171;">⚠️</div>
                    <div class="stat-info">
                        <h4>Утеряно (ждут замену)</h4>
                        <p id="statLost">0</p>
                    </div>
                </div>
            </div>

            <div class="main-layout">
                <!-- ЛЕВАЯ КОЛОНКА: Списки должников и потеряшек -->
                <div class="card">
                    <div class="tab-buttons">
                        <button id="debtorsTab" class="tab-btn active" onclick="switchMainTab('debtors')">🔴 Должники</button>
                        <button id="lostTab" class="tab-btn" onclick="switchMainTab('lost')">📙 Потеряшки (замена книг)</button>
                    </div>

                    <!-- Таблица Должники -->
                    <div id="debtorsSection">
                        <div class="table-container">
                            <table id="debtorsTable">
                                <thead>
                                    <tr>
                                        <th>ФИО Ученика</th>
                                        <th>Класс</th>
                                        <th>Учебник</th>
                                        <th>Инвентарный №</th>
                                        <th>Дата выдачи</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Данные вставляются скриптом -->
                                </tbody>
                            </table>
                            <div id="debtorsEmpty" style="text-align: center; padding: 30px; color: var(--text-muted); display: none;">Должников нет! Все книги сданы.</div>
                        </div>
                    </div>

                    <!-- Таблица Потеряшки -->
                    <div id="lostSection" style="display: none;">
                        <div class="table-container">
                            <table id="lostTable">
                                <thead>
                                    <tr>
                                        <th>ФИО Ученика</th>
                                        <th>Класс</th>
                                        <th>Утерянный учебник</th>
                                        <th>Инв. №</th>
                                        <th>Что принести взамен</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Данные вставляются скриптом -->
                                </tbody>
                            </table>
                            <div id="lostEmpty" style="text-align: center; padding: 30px; color: var(--text-muted); display: none;">Утерянных книг нет! Отличный показатель.</div>
                        </div>
                    </div>
                </div>

                <!-- ПРАВАЯ КОЛОНКА: Модуль сдачи книги и Сканер -->
                <div class="card" style="align-self: start;">
                    <div class="section-title">
                        <span>⚡</span> Прием учебника
                    </div>
                    
                    <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.5;">
                        Введите инвентарный номер вручную или запустите сканирование штрихкода камерой устройства.
                    </p>

                    <!-- Сканер штрихкодов встроенный -->
                    <div id="scannerWrapper" class="scanner-container">
                        <div id="qr-reader"></div>
                        <button class="btn btn-rose" onclick="stopScanner()" style="position: absolute; bottom: 10px; right: 10px; padding: 8px 12px; font-size: 12px; z-index: 10;">Закрыть</button>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div>
                            <label for="invNumberInput" style="display: block; font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">Инвентарный № книги</label>
                            <input type="text" id="invNumberInput" class="input-field" placeholder="Например: INV-001001">
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button class="btn" style="flex: 1;" onclick="handleManualReturn()">Принять</button>
                            <button class="btn btn-secondary" id="scanBtn" onclick="startScanner()" style="padding: 12px;">
                                📷 Сканировать штрихкод
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="toast" class="toast">Сообщение</div>

        <script>
            // Проверка сессии администратора
            const adminToken = localStorage.getItem('admin_token');
            if (!adminToken) {
                window.location.href = '/';
            }

            function handleLogout() {
                localStorage.clear();
                window.location.href = '/';
            }

            function showToast(message, isSuccess = true) {
                const toast = document.getElementById('toast');
                toast.textContent = message;
                toast.style.borderLeftColor = isSuccess ? 'var(--accent-emerald)' : 'var(--accent-rose)';
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 5000);
            }

            // Переключение вкладок в левой панели
            function switchMainTab(tab) {
                const debtorsTab = document.getElementById('debtorsTab');
                const lostTab = document.getElementById('lostTab');
                const debtorsSection = document.getElementById('debtorsSection');
                const lostSection = document.getElementById('lostSection');

                if (tab === 'debtors') {
                    debtorsTab.classList.add('active');
                    lostTab.classList.remove('active');
                    debtorsSection.style.display = 'block';
                    lostSection.style.display = 'none';
                } else {
                    debtorsTab.classList.remove('active');
                    lostTab.classList.add('active');
                    debtorsSection.style.display = 'none';
                    lostSection.style.display = 'block';
                }
            }

            // Загрузка статистики и списков с бэкенда
            async function loadDashboardData() {
                try {
                    const response = await fetch('/api/admin/dashboard');
                    const data = await response.json();

                    if (!response.ok) throw new Error(data.error);

                    // Отрисовка статистики
                    document.getElementById('statActive').textContent = data.stats.issued;
                    document.getElementById('statReturned').textContent = data.stats.returned;
                    document.getElementById('statLost').textContent = data.stats.lost;

                    // Отрисовка должников
                    const debtorsBody = document.querySelector('#debtorsTable tbody');
                    debtorsBody.innerHTML = '';
                    if (data.debtors.length === 0) {
                        document.getElementById('debtorsEmpty').style.display = 'block';
                    } else {
                        document.getElementById('debtorsEmpty').style.display = 'none';
                        data.debtors.forEach(d => {
                            const date = new Date(d.issued_at).toLocaleDateString('ru-RU');
                            const tr = document.createElement('tr');
                            tr.innerHTML = \`
                                <td><strong>\${d.student_name}</strong></td>
                                <td><span class="badge badge-active">\${d.grade}</span></td>
                                <td>\${d.book_title}</td>
                                <td><code style="color: var(--accent-indigo); font-weight:600;">\${d.inventory_number}</code></td>
                                <td>\${date}</td>
                            \`;
                            debtorsBody.appendChild(tr);
                        });
                    }

                    // Отрисовка потеряшек
                    const lostBody = document.querySelector('#lostTable tbody');
                    lostBody.innerHTML = '';
                    if (data.lostList.length === 0) {
                        document.getElementById('lostEmpty').style.display = 'block';
                    } else {
                        document.getElementById('lostEmpty').style.display = 'none';
                        data.lostList.forEach(l => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = \`
                                <td><strong>\${l.student_name}</strong></td>
                                <td><span class="badge badge-lost">\${l.grade}</span></td>
                                <td>\${l.book_title}</td>
                                <td><code>\${l.inventory_number}</code></td>
                                <td style="font-size:13px; color: var(--accent-amber);">\${l.book_author}, год от \${l.book_year} г.</td>
                            \`;
                            lostBody.appendChild(tr);
                        });
                    }

                } catch (err) {
                    showToast('Не удалось загрузить данные дашборда', false);
                }
            }

            // Ручной возврат книги
            async function handleManualReturn() {
                const invInput = document.getElementById('invNumberInput');
                const invNumber = invInput.value.trim();

                if (!invNumber) {
                    showToast('Введите инвентарный номер книги!', false);
                    return;
                }

                await processReturn(invNumber);
                invInput.value = '';
            }

            // API запрос сдачи книги
            async function processReturn(inventoryNumber) {
                try {
                    const response = await fetch('/api/admin/return', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ inventory_number: inventoryNumber })
                    });
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error);
                    }

                    showToast(\`🎉 Книга успешно принята! <br> \${data.details}\`);
                    loadDashboardData(); // Обновляем списки
                    return true;
                } catch (err) {
                    showToast(err.message, false);
                    return false;
                }
            }

            // --- БРАУЗЕРНЫЙ СКАНЕР ШТРИХКОДОВ (HTML5 QRCODE) ---
            let html5Qrcode = null;

            function startScanner() {
                const wrapper = document.getElementById('scannerWrapper');
                wrapper.style.display = 'block';

                // Создаем инстанс сканера, если он еще не создан
                if (!html5Qrcode) {
                    html5Qrcode = new Html5Qrcode("qr-reader");
                }

                // Запрашиваем доступ к камере
                Html5Qrcode.getCameras().then(devices => {
                    if (devices && devices.length > 0) {
                        // Пытаемся найти заднюю (основную) камеру для смартфонов
                        const backCamera = devices.find(device => 
                            device.label.toLowerCase().includes('back') || 
                            device.label.toLowerCase().includes('rear') ||
                            device.label.toLowerCase().includes('environment')
                        );
                        
                        const cameraId = backCamera ? backCamera.id : devices[0].id;
                        
                        const config = {
                            fps: 15,
                            qrbox: { width: 260, height: 160 } // Оптимизируем под прямоугольный штрихкод
                        };

                        html5Qrcode.start(
                            cameraId, 
                            config, 
                            async (decodedText) => {
                                // Штрихкод успешно отсканирован!
                                stopScanner();
                                showToast('Штрихкод успешно распознан: ' + decodedText);
                                document.getElementById('invNumberInput').value = decodedText;
                                
                                // Мгновенно проводим возврат
                                await processReturn(decodedText);
                            },
                            (errorMessage) => {
                                // Ошибки сканирования в потоке логировать не обязательно
                            }
                        ).catch(err => {
                            showToast('Не удалось запустить сканер камеры: ' + err, false);
                            wrapper.style.display = 'none';
                        });
                    } else {
                        showToast('Камера на устройстве не найдена!', false);
                        wrapper.style.display = 'none';
                    }
                }).catch(err => {
                    showToast('Ошибка при доступе к камере: ' + err, false);
                    wrapper.style.display = 'none';
                });
            }

            function stopScanner() {
                const wrapper = document.getElementById('scannerWrapper');
                wrapper.style.display = 'none';
                if (html5Qrcode && html5Qrcode.isScanning) {
                    html5Qrcode.stop().catch(err => console.log('Ошибка остановки камеры: ' + err));
                }
            }

            // Инициализация при старте страницы
            loadDashboardData();
        </script>
    </body>
    </html>
    `);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 Сервер запущен на порту \${PORT}`);
    console.log(`🌐 Локальный адрес приложения: http://localhost:\${PORT}`);
    console.log(`================================================================`);
});
