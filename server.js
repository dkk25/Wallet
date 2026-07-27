require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();

app.use(express.static('public'));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/financeApp')
   .then(() => {
        console.log('✅ Συνδεθήκαμε επιτυχώς στη MongoDB (financeApp)!');
    })
    .catch((error) => {
        console.error('❌ Αποτυχία σύνδεσης στη MongoDB:', error);
    });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});   

const User = mongoose.model('User', userSchema);

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    type: { type: String, enum: ['income', 'expense'], required: true},
    category: { type: String, required: true},
    amount: { type: Number, required: true},
    note: { type: String, default: ''},
    date: { type: String, required: true},
    createdAt: { type: Date, default: Date.now}
})

const Transaction = mongoose.model('Transaction', transactionSchema);



app.post('/api/register', async (req, res) => {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;

    console.log(`[REGISTER] Ήρθε αίτημα εγγραφής για: ${email}`);

    if (!email || !password) {
        return res.json({
            success: false,
            message: 'Παρακαλώ συμπληρώστε και τα δύο πεδία!'
        });
    }

    if (!email.includes('@') || !email.includes('.')) {
    return res.json({
        success: false,
        message: 'Παρακαλώ δώστε ένα έγκυρο email (π.χ. name@example.com)!'
    });
}

    if (password.length < 8) {
        return res.json({
            success: false,
            message: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες!'
        });
    }

    try {
        const existingUser = await User.findOne({email: email});
        if (existingUser) {
            return res.json({
                success: false,
                message: 'Αυτό το email χρησιμοποιείται ήδη!'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email: email,
            password: hashedPassword
        })

        await newUser.save();

        res.json({
            success: true,
            message: 'Η εγγραφή ολοκληρώθηκε με επιτυχία!'
        });

    } catch (error) {
        console.error('Σφάλμα εγγραφής:', error);
        res.json({ 
            success: false, 
            message: 'Κάτι πήγε στραβά κατά την εγγραφή!' 
        });
    }


});




app.post('/api/login', async (req, res) => {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : ''
    const password = req.body.password;

    console.log(`[LOGIN] Ήρθε αίτημα σύνδεσης για: ${email}`);

    if (!email || !password) {
        return res.json({
            success: false,
            message: 'Παρακαλώ συμπληρώστε και τα δύο πεδία!'
        });
    }

    try {
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.json({
                success: false,
                message: 'Λάθος email ή κωδικός πρόσβασης!'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: 'Λάθος email ή κωδικός πρόσβασης!'
            });
        }

        const token = jwt.sign(
            { userId: user._id},
            process.env.JWT_SECRET,
            { expiresIn: '24h'}
        );

        res.json({
            success: true,
            message: 'Η σύνδεση έγινε με επιτυχία!',
            token: token
        });

    } catch (error) {
        console.error('Σφάλμα κατά το login:', error);
        res.json({
            success: false,
            message: 'Κάτι πήγε στραβά κατά τη σύνδεση!'
        });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({success: false, message: 'Δεν βρέθηκε token, η πρόσβαση απορρίφθηκε!' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
           return res.status(401).json({ success: false, message: 'Άκυρο ή ληγμένο token!' });
        }

        req.userId = decoded.userId;

        const freshToken = jwt.sign(
            { userId: req.userId},
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.setHeader('Access-Control-Expose-Headers', 'x-auth-token');
        res.setHeader('x-auth-token', freshToken);

        next();
    });
}

app.get('/api/transactions', authenticateToken, async(req, res) => {
    try {
        const userTransactions = await Transaction.find({ userId: req.userId});

        res.json({ success: true, transactions: userTransactions});
    } catch (error) {
        res.json({ success: false, message: 'Σφάλμα φόρτωσης'});
    }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { type, category, amount, note, date } = req.body;
        const newTransaction = new Transaction({
            userId: req.userId, type, category, amount, note, date
        });

        const saved = await newTransaction.save();

        res.json({ success: true, transaction: saved});
    } catch (error) {
         res.json({ success: false, message: 'Σφάλμα αποθήκευσης' });
    }
});


app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        res.json({ success: true});
    } catch (error) {
         res.json({ success: false, message: 'Σφάλμα διαγραφής' });
    }
});







const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Ο Server δουλεύει! Μπες στο http://localhost:${PORT}`);
});

