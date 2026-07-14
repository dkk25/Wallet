let currentType = 'income'; 
let totalBalance = 0.00;
let totalIncome = 0.00;
let totalExpense = 0.00;

function openForm(type) {
    currentType = type;

    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const submitButton = document.getElementById('submit-button');

    formContainer.classList.remove('hidden-form');
    formTitle.textContent = type === 'income' ? 'Καταχώρηση Εσόδου' : 'Καταχώρηση Εξόδου';
    submitButton.textContent = type === 'income' ? 'Καταχώρηση Εσόδου' : 'Καταχώρηση Εξόδου';
    submitButton.className = type === 'income' ? 'btn submit-income' : 'btn submit-expense';
}

function processTransaction() {
    const descInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');

    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (description === '' || isNaN(amount) || amount <= 0) {
        alert('Παρακαλώ εισάγετε έγκυρη περιγραφή και ποσό.');
        return;
    }

    const list = document.getElementById('transaction-list');
    const listItem = document.createElement('li');

    if (currentType === 'income') {
        totalIncome += amount;
        totalBalance += amount;
        listItem.className = 'income-item';
        listItem.innerHTML = `${description} <span class="amount">+${amount.toFixed(2)} €</span>`;
    } else {
        totalExpense += amount;
        totalBalance -= amount;
        listItem.className = 'expense-item';
        listItem.innerHTML = `${description} <span class="amount">-${amount.toFixed(2)} €</span>`;
    }

    list.prepend(listItem);

    updateDashboard();

    descInput.value = '';
    amountInput.value = '';

    formContainer.classList.add('hidden-form');
}

function updateDashboard() {
    document.getElementById('total-balance').textContent = `${totalBalance.toFixed(2)}€`;
    document.getElementById('total-income').textContent = `+${totalIncome.toFixed(2)}€`;
    document.getElementById('total-expense').textContent = `-${totalExpense.toFixed(2)}€`;

    const aiMessage = document.getElementById('ai-message');
    const aiBox = document.getElementById('ai-alert');

    if (totalBalance < 0) {
        aiBox.classList.remove('hidden');
        aiBox.style.borderLeftColor = "#ef4444"; 
        aiBox.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
        aiBox.style.color = "#fca5a5";
        aiMessage.innerText = "🚨 Συναγερμός! Έχεις μπει μέσα! Σταμάτα τα έξοδα αμέσως.";
    } 
    else if (totalBalance >= 0 && totalBalance <= 50) {
        aiBox.classList.remove('hidden');
        aiBox.style.borderLeftColor = "#f59e0b"; 
        aiBox.style.backgroundColor = "rgba(245, 158, 11, 0.1)";
        aiBox.style.color = "#fde68a";
        aiMessage.innerText = "⚠️ Προσοχή! Τα χρήματά σου λιγοστεύουν. Κόψε τους καφέδες απ' έξω!";
    } 
    else {
        aiBox.classList.add('hidden');
    }
}

function resetMonth() {
    if (confirm("Είσαι σίγουρος ότι θέλεις να ξεκινήσεις έναν νέο μήνα; Όλες οι συναλλαγές θα διαγραφούν.")) {
        totalIncome = 0.00;
        totalExpense = 0.00;
        document.getElementById('transaction-list').innerHTML = '';
        updateDashboard();
    }

}   