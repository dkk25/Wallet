const incomeCategories = [
    { id: 'salary', name: '💰 Μισθός' },
    { id: 'pocket-money', name: '💵 Χαρτζιλίκι' },
    { id: 'gift', name: '🎁 Δώρο / Bonus' },
    { id: 'other-income', name: '📝 Άλλο' }
];

const expenseCategories = [
    { id: 'food', name: '🍔 Καφές / Φαγητό' },
    { id: 'supermarket', name: '🛒 Σούπερ Μάρκετ' },
    { id: 'transport', name: '🚗 Μετακίνηση' },
    { id: 'bills', name: '💡 Λογαριασμοί' },
    { id: 'shopping', name: '🛍️ Αγορές' },
    { id: 'other-expense', name: '📝 Άλλο' }
];

let currentType = 'income'; 
let totalBalance = 0;
let totalIncome = 0;
let totalExpense = 0;
let transactions = [];
let transactionToDeleteId = null;

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function loadData() {
    const savedBalance = localStorage.getItem('wallet_balance');
    const savedIncome = localStorage.getItem('wallet_income');
    const savedExpense = localStorage.getItem('wallet_expense');
    const savedTransactions = localStorage.getItem('wallet_transactions');
    const savedWeek = localStorage.getItem('wallet_week');

    const currentWeek = getWeekNumber(new Date());

    if (savedBalance !== null) {
        totalBalance = parseFloat(savedBalance);
    } 
    
    if (savedWeek !== null && parseInt(savedWeek) !== currentWeek) {
        openModal('weekly-modal');

        if (savedIncome !== null) totalIncome = parseFloat(savedIncome);
        if (savedExpense !== null) totalExpense = parseFloat(savedExpense);
        if (savedTransactions !== null) transactions = JSON.parse(savedTransactions);
    } else {
        if (savedIncome !== null) totalIncome = parseFloat(savedIncome);
        if (savedExpense !== null) totalExpense = parseFloat(savedExpense);
        if (savedTransactions !== null) transactions = JSON.parse(savedTransactions);
    }

    renderTransactions();
    updateDashboard();

    localStorage.setItem('wallet_week', currentWeek);
}

function saveData() {
    localStorage.setItem('wallet_balance', totalBalance.toFixed(2));
    localStorage.setItem('wallet_income', totalIncome.toFixed(2));
    localStorage.setItem('wallet_expense', totalExpense.toFixed(2));
    localStorage.setItem('wallet_transactions', JSON.stringify(transactions));
}

function renderTransactions() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';

    transactions.forEach(t => {
        const listItem = document.createElement('li');
        listItem.className = t.type === 'income' ? 'income-item' : 'expense-item';
        const sign = t.type === 'income' ? '+' : '-';

        listItem.innerHTML = `
            <div class='transaction-top'>
                <span class='transaction-name'>${t.category}</span>
                <div class='amount-wrapper'>
                    <span class='amount'>${sign}${t.amount.toFixed(2)}€</span>
                    <button class="delete-btn" onclick="promptDeleteTransaction(${t.id})" title="Διαγραφή">🗑️</button>
                </div>
            </div>
            <div class='transaction-note'>${t.note}</div>
            <div class='transaction-date'>${t.date}</div>
        `;

        list.prepend(listItem);
    });
}


function openForm(type) {
    currentType = type;

    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const submitButton = document.getElementById('submit-btn');
    const categorySelect = document.getElementById('category');

    document.getElementById('error-category').classList.add('hidden');
    document.getElementById('error-amount').classList.add('hidden');

    formContainer.classList.remove('hidden-form');

    formTitle.textContent = type === 'income' ? 'Καταχώρηση Eσόδου' : 'Καταχώρηση Εξόδου';
    submitButton.textContent = type === 'income' ? 'Καταχώρηση Εσόδου' : 'Καταχώρηση Εξόδου';
    submitButton.className = type === 'income' ? 'btn submit-income' : 'btn submit-expense';

    categorySelect.innerHTML = '<option value="" disabled selected>— Επιλέξτε κατηγορία —</option>';

    const categoriesToShow = type === 'income' ? incomeCategories : expenseCategories;

    categoriesToShow.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
}

function processTransaction() {
    const categorySelect = document.getElementById('category');
    const amountInput = document.getElementById('amount');
    const descInput = document.getElementById('description');

    const selectedCategory = categorySelect.value;
    const amount = parseFloat(amountInput.value);
    const note = descInput.value.trim();

    const errorCategory = document.getElementById('error-category');
    const errorAmount = document.getElementById('error-amount');

    let hasError = false;

    errorCategory.classList.add('hidden');
    errorAmount.classList.add('hidden');

    if (!selectedCategory) {
        errorCategory.classList.remove('hidden');
        hasError = true;
    }

    if (isNaN(amount) || amount <= 0) {
        errorAmount.classList.remove('hidden');
        hasError = true;
    }

    if (hasError) {
        return;
    }

    const transactionDate = new Date().toLocaleString('el-GR', { dateStyle: 'short', timeStyle: 'short' });

    if (currentType === 'income') {
        totalBalance += amount;
        totalIncome += amount;
    } else {
        totalBalance -= amount;
        totalExpense += amount;
    }

    transactions.push({
        id: Date.now(),
        type: currentType,
        category: selectedCategory,
        amount: amount,
        note: note,
        date: transactionDate
    });

    saveData();
    renderTransactions();
    updateDashboard();

    descInput.value = '';
    amountInput.value = '';
    document.getElementById('form-container').classList.add('hidden-form');
}

function updateDashboard() {
    document.getElementById('total-balance').textContent = `${totalBalance.toFixed(2)}€`;
    document.getElementById('total-income').textContent = `${totalIncome.toFixed(2)}€`;
    document.getElementById('total-expense').textContent = `${totalExpense.toFixed(2)}€`;

    const aiMessage = document.getElementById('ai-message');
    const aiBox = document.getElementById('ai-alert');

    if (totalBalance <= 50 && (totalIncome > 0 || transactions.length > 0)) {
        
        aiBox.classList.remove('hidden');     
        aiMessage.classList.remove('hidden'); 

        if (totalBalance < 0) {
            aiBox.style.borderLeftColor = "#ef4444"; 
            aiBox.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
            aiBox.style.color = "#fca5a5";
            aiMessage.innerText = "🚨 Συναγερμός! Έχεις μπει μέσα! Σταμάτα τα έξοδα αμέσως.";
        } else {
            aiBox.style.borderLeftColor = "#f59e0b"; 
            aiBox.style.backgroundColor = "rgba(245, 158, 11, 0.1)";
            aiBox.style.color = "#fde68a";
            aiMessage.innerText = "⚠️ Προσοχή! Τα χρήματά σου λιγοστεύουν. Κόψε τους καφέδες απ' έξω!";
        }
        
    } else {
        aiBox.classList.add('hidden');
        aiMessage.classList.add('hidden');
    }
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function confirmReset() {
    totalIncome = 0;
    totalExpense = 0;
    transactions = [];

    localStorage.setItem('wallet_week', getWeekNumber(new Date()));

    saveData();
    renderTransactions();
    updateDashboard();

    closeModal('weekly-modal');
}

function promptDeleteTransaction(id) {
    transactionToDeleteId = id;
    openModal('delete-modal');
}

function confirmDeleteTransaction() {
    if (transactionToDeleteId !== null) {
        const transactionIndex = transactions.findIndex(t => t.id === transactionToDeleteId);
        if (transactionIndex !== -1) {
            const t = transactions[transactionIndex];

            if (t.type === 'income') {
                totalBalance -= t.amount;
                totalIncome -= t.amount;
            } else {
                totalBalance += t.amount;
                totalExpense -= t.amount;
            }

            transactions.splice(transactionIndex, 1);
        }
    }

    saveData();
    renderTransactions();
    updateDashboard();
    
    transactionToDeleteId = null;
    closeModal('delete-modal');
}

function hardReset() {
    totalBalance = 0;
    totalIncome = 0;
    totalExpense = 0;
    transactions = [];

    localStorage.setItem('wallet_week', getWeekNumber(new Date()));

    saveData();
    renderTransactions();
    updateDashboard();

    closeModal('custom-modal');
}

window.onload = loadData;