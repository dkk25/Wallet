const token = localStorage.getItem('token');

if (token) {
    window.location.replace ='/dashboard.html';
}

let isLoginMode = true;

function toggleAuthMode(){
    isLoginMode = !isLoginMode;

    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('submit-btn');
    const toggleText = document.getElementById('toggle-text');
    const toggleBtn = document.getElementById('toggle-btn');

    if (isLoginMode) {
        title.textContent = "Συνδέσου για να διαχειριστείς τα οικονομικά σου.";
        submitBtn.textContent = "Σύνδεση";
        toggleText.textContent = "Δεν έχεις λογαριασμό;";
        toggleBtn.textContent = "Δημιουργία Λογαριασμού";
    } else {
        title.textContent = "Φτιάξε νέο λογαριασμό για να ξεκινήσεις.";
        submitBtn.textContent = "Εγγραφή";
        toggleText.textContent = "Έχεις ήδη λογαριασμό;";
        toggleBtn.textContent = "Σύνδεση";
    }

    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('message-box').textContent = '';
}


function togglePasswordVisibility(){
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');

    if(passwordInput.type === 'password'){
        passwordInput.type = 'text';
        eyeIcon.className = 'fa-solid fa-eye-slash';
        
    }else{
        passwordInput.type = 'password';
        eyeIcon.className = 'fa-solid fa-eye';
    }
}

async function handleSubmit(event){
    event.preventDefault();

    const emailValue = document.getElementById('email').value;
    const passwordValue = document.getElementById('password').value;

    const messageBox = document.getElementById('message-box');

    const endpoint = isLoginMode ? '/api/login' : '/api/register';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ email: emailValue, password: passwordValue})
        });

        const data = await response.json();

        messageBox.textContent = data.message;
        messageBox.style.color = data.success ? '#22c55e' : '#ef4444';

        if (data.success) {
            if (isLoginMode){

                localStorage.setItem('token', data.token);
                
                setTimeout(() => {
                    window.location.replace = '/dashboard.html';
                }, 1000);
            } else {
                setTimeout(() => {
                    toggleAuthMode();

                   messageBox.textContent = 'Τώρα κάνε σύνδεση με τα στοιχεία σου!';
                   messageBox.style.color = '#3b82f6';
                }, 1500);
            }
        }

    } catch (error) {
        console.error('Σφάλμα:', error);
        messageBox.textContent = 'Αποτυχία σύνδεσης με τον server!';
        messageBox.style.color = '#ef4444';
    }
}

