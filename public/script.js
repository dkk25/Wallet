const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/index.html';
}

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
const api_endpoint = '/api/transactions';


function showToast(message, isSuccess = true) {
    const toast = document.getElementById('toast-message');
    toast.textContent = message;

    toast.className = 'toast'; 
    toast.classList.add(isSuccess ? 'success' : 'error');
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function checkAndRefreshToken(response){
    const freshToken = response.headers.get('x-auth-token');
    if (freshToken) {
        localStorage.setItem('token', freshToken);
         console.log("Το token μόλις ανανεώθηκε για άλλες 24 ώρες!");
    }
}


async function loadData() {
    const token = localStorage.getItem('token');

    if (!token) return;

    try {
        const response = await fetch(api_endpoint, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        checkAndRefreshToken(response);

        const result = await response.json();

        if (result.success) {
            const allTransactions = result.transactions;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            totalBalance = 0;
            allTransactions.forEach(t => {
                if (t.type === 'income') {
                    totalBalance += t.amount;
                } else {
                    totalBalance -= t.amount;
                }
            });

           
            transactions = allTransactions.filter(t => {
                const tDate = new Date(t.createdAt);
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            });

            totalIncome = 0;
            totalExpense = 0;
            transactions.forEach(t => {
                if (t.type === 'income') {
                    totalIncome += t.amount;
                } else {
                    totalExpense += t.amount;
                }
            });

            renderTransactions();
            updateDashboard();
        } else{
            showToast(result.message || 'Σφάλμα Φόρτωσης', false);

            if (result.message && result.message.includes('token')) {
                setTimeout(() => {
                    localStorage.removeItem('token');
                    window.location.href = '/index.html';
                }, 2000);
            }
        }
    } catch (error) {
         console.error("Σφάλμα φόρτωσης:", error);
         showToast('Πρόβλημα σύνδεσης με τον server.', false);
    }
}


function renderTransactions() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';

    if (transactions.length === 0) {
        list.innerHTML = `<div class="new-month-card">✨ Νέος Μήνας! Το ιστορικό ξεκινάει από την αρχή.</div>`;
        return; 
    }

    transactions.forEach(t => {
        const listItem = document.createElement('li');
        listItem.className = t.type === 'income' ? 'income-item' : 'expense-item';
        const sign = t.type === 'income' ? '+' : '-';

        const idToUse = t._id;

        listItem.innerHTML = `
            <div class='transaction-top'>
                <span class='transaction-name'>${t.category}</span>
                <div class='amount-wrapper'>
                    <span class='amount'>${sign}${t.amount.toFixed(2)}€</span>
                    <button class="delete-btn" onclick="promptDeleteTransaction('${idToUse}')" title="Διαγραφή">🗑️</button>
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

async function processTransaction() {
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

    const token = localStorage.getItem('token');

    const dataToSend = {type: currentType, category: selectedCategory, amount: amount, note: note, date: transactionDate};

    try {
        const response = await fetch(api_endpoint, {
            method: 'POST',
             headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(dataToSend)
        });

        checkAndRefreshToken(response);

        const result = await response.json();

        if (result.success) {
            transactions.push(result.transaction);

            if (currentType === 'income') {
                totalBalance += amount; totalIncome += amount;
            } else {
                totalBalance -= amount; totalExpense += amount;
            }

            renderTransactions();
            updateDashboard();

            descInput.value = '';
            amountInput.value = '';
            document.getElementById('form-container').classList.add('hidden-form');

            showToast('Η συναλλαγή καταχωρήθηκε!', true);
        } else{
            showToast(result.message || 'Αποτυχία καταχώρησης.', false);
            if (result.message && result.message.includes('token')) {
                setTimeout(() => {
                    localStorage.removeItem('token');
                    window.location.href = '/index.html';
                }, 2000);
            }
        }
    } catch (error) {
        console.error("Σφάλμα:", error);
        showToast('Πρόβλημα σύνδεσης.', false);
    }
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

function confirmLogout() {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
}

function promptDeleteTransaction(id) {
    transactionToDeleteId = id;
    openModal('delete-modal');
}

async function confirmDeleteTransaction() {
    if (transactionToDeleteId !== null) {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`/api/transactions/${transactionToDeleteId}`, {
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });

            checkAndRefreshToken(response);
            
            const result = await response.json();
            
            if (result.success) {
                const transactionIndex = transactions.findIndex(t => (t._id) === transactionToDeleteId);
                
                if (transactionIndex !== -1) {
                    const t = transactions[transactionIndex];

                    if (t.type === 'income') {
                        totalBalance -= t.amount; totalIncome -= t.amount;
                    } else {
                        totalBalance += t.amount; totalExpense -= t.amount;
                    }

                    transactions.splice(transactionIndex, 1);
                }
                
                renderTransactions();
                updateDashboard();
                showToast('Η συναλλαγή διαγράφηκε επιτυχώς!', true); 
            }else{
                showToast(result.message || 'Δεν κατέστη δυνατή η διαγραφή.', false);
                if (result.message && result.message.includes('token')) {
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        window.location.href = '/index.html';
                    }, 2000);
                }
            }
        } catch (error) {
            console.error("Σφάλμα διαγραφής:", error);
            showToast('Πρόβλημα σύνδεσης.', false);
        }
    }
    
    transactionToDeleteId = null;
    closeModal('delete-modal');
}


window.onload = loadData;

