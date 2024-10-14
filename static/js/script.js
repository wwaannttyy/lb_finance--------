let expenses = [];
let totalBudget = 0;
let userId = null;

// Получение user_id с помощью Telegram WebApp
function init() {
    if (window.Telegram && window.Telegram.WebApp) {
        userId = window.Telegram.WebApp.initDataUnsafe.user.id;
        // Получение данных с бэкенда при загрузке страницы
        fetchDataFromServer();
    }
}

function fetchDataFromServer() {
    fetch(`/get-data/${userId}`)
        .then(response => response.json())
        .then(data => {
            expenses = data.expenses;
            totalBudget = data.totalBudget;
            renderExpenses();
            updateAvailableAmount(0); // Обновляем отображение доступного бюджета
        })
        .catch(err => console.error('Error fetching data from server:', err));
}

function addExpense() {
    const expenseAmount = parseFloat(document.getElementById('expense-amount').value);

    if (expenseAmount && !isNaN(expenseAmount) && expenseAmount > 0) {
        const today = new Date();
        const expense = {
            amount: expenseAmount,
            date: today.toLocaleDateString(),
            time: today.toLocaleTimeString()
        };

        expenses.push(expense);
        sendExpenseToServer(expense);  // Отправляем на бэкенд
        updateAvailableAmount(-expenseAmount);
        renderExpenses();
        closeExpenseModal();
    } else {
        alert("Пожалуйста введите данные.");
    }
}

function deleteExpense(index) {
    const expenseToRemove = expenses[index];
    expenses.splice(index, 1);
    updateAvailableAmount(expenseToRemove.amount);
    renderExpenses();
    deleteExpenseFromServer(expenseToRemove);  // Удаление на сервере
}

function sendExpenseToServer(expense) {
    fetch('/add-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: userId,
            expense: expense
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Траты добавлены успешно:", data);
    })
    .catch(err => console.error('Ошибкба добавления трат:', err));
}

function deleteExpenseFromServer(expense) {
    fetch('/delete-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: userId,
            expense: expense
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Траты успешно удалены:", data);
    })
    .catch(err => console.error('Ошибка удаления трат:', err));
}

function updateAvailableAmount(amountChange) {
    fetch('/calculate-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: userId,
            amountChange: amountChange
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('available-amount').innerText = data.availableAmount.toFixed(2);
        document.getElementById('total-amount').innerText = data.totalAmount.toFixed(2);
    })
    .catch(err => console.error('Ошибка вычисления:', err));
}

function goToMainScreen() {
    document.getElementById('initial-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    calculateDailyAllowance();
}

function openExpenseModal() {
    document.getElementById('expenseModal').style.display = 'block';
}

function closeExpenseModal() {
    document.getElementById('expenseModal').style.display = 'none';
}

function calculateDailyAllowance() {
    const budget = document.getElementById('budget').value;
    const lastDay = new Date(document.getElementById('last-day').value);
    const today = new Date();
    
    if (budget && lastDay) {
        const daysDifference = Math.floor((lastDay - today) / (1000 * 60 * 60 * 24));
        const dailyAllowance = budget / (daysDifference + 1);
        document.getElementById('daily-allowance').innerText = dailyAllowance.toFixed(2);
        document.getElementById('available-amount').innerText = dailyAllowance.toFixed(2);
        document.getElementById('total-amount').innerText = budget;
        document.getElementById('budget-end-date').innerText = lastDay.toLocaleDateString();
        totalBudget = parseFloat(budget);
    }
}

function renderExpenses() {
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = ''; // Очищаем список перед перерисовкой

    expenses.forEach((expense, index) => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        expenseItem.innerHTML = `
            <div class="expense-date">${expense.date} at ${expense.time}</div>
            <div class="expense-amount">${expense.amount.toFixed(2)}</div>
        `;

        // Добавление событий для ПКМ и удержания для мобильных
        expenseItem.addEventListener('contextmenu', function(event) {
            event.preventDefault(); // Предотвращаем контекстное меню
            const confirmDelete = confirm("Вы действительно хотите удалить эту трату?");
            if (confirmDelete) {
                deleteExpense(index);
            }
        });

        // Удержание для мобильных устройств
        let pressTimer;
        expenseItem.addEventListener('mousedown', function(event) {
            pressTimer = setTimeout(function() {
                const confirmDelete = confirm("Вы действительно хотите удалить эту трату?");
                if (confirmDelete) {
                    deleteExpense(index);
                }
            }, 800); // Удержание в течение 800 миллисекунд
        });

        expenseItem.addEventListener('mouseup', function(event) {
            clearTimeout(pressTimer); // Отменяем таймер, если кнопка отпущена раньше
        });

        expenseItem.addEventListener('mouseout', function(event) {
            clearTimeout(pressTimer); // Отменяем таймер, если мышь покинула элемент
        });

        expenseList.appendChild(expenseItem); // Добавляем элемент траты в список
    });
}

function openSettings() {
    document.getElementById('modal-budget').value = document.getElementById('budget').value;
    document.getElementById('modal-last-day').value = document.getElementById('last-day').value;
    calculateNewDailyAllowance();
    document.getElementById('settingsModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function calculateNewDailyAllowance() {
    const budget = document.getElementById('modal-budget').value;
    const lastDay = new Date(document.getElementById('modal-last-day').value);
    const today = new Date();

    if (budget && lastDay) {
        const daysDifference = Math.floor((lastDay - today) / (1000 * 60 * 60 * 24));
        const dailyAllowance = budget / (daysDifference + 1);
        document.getElementById('new-daily-allowance').innerText = dailyAllowance.toFixed(2);
    }
}

function updateSettings() {
    document.getElementById('budget').value = document.getElementById('modal-budget').value;
    document.getElementById('last-day').value = document.getElementById('modal-last-day').value;

    calculateDailyAllowance();

    const allowance = document.getElementById('daily-allowance').innerText;
    document.getElementById('available-amount').innerText = allowance;

    closeModal();
}

window.onclick = function(event) {
    if (event.target == document.getElementById('settingsModal')) {
        closeModal();
    }
    if (event.target == document.getElementById('expenseModal')) {
        closeExpenseModal();
    }
}

