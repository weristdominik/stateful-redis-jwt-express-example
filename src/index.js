const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const os = require('os');
const path = require('path');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');

const app = express();
const JWT_SECRET = 'super-secret-key';
const TOKEN_EXPIRY_SECONDS = 120; // 2 Minutes

// --- Redis client ---
const redisClient = createClient({ url: 'redis://redis:6379' });
redisClient.connect().catch(console.error);

// --- Middleware ---
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Fake user database ---
const users = {
  alice: { password: 'password123', role: 'admin' },
  bob: { password: 'letmein', role: 'user' }
};

// --- Middleware to protect routes ---
async function authenticateJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const payload = jwt.verify(token, JWT_SECRET); // return decoded payload if signature OK

    // Check if jti exists in Redis
    const sessionExists = await redisClient.get(payload.jti);
    if (!sessionExists) {
      return res.redirect('/login'); // Session was revoked or expired
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.redirect('/login');
  }
}

// --- Routes ---

app.get('/', authenticateJWT, (req, res) => {
  res.send(`
    <h1>Welcome, ${req.user.username}, (${req.user.role})</h1>
    <p>Served by pod: <strong>${os.hostname()}</strong></p>
    <a href="/logout">Logout</a>
  `);
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check user exists and password matches
  if (users[username] && users[username].password === password) {
    const jti = uuidv4();
    const role = users[username].role;

    // Store jti in Redis as JSON string with username and role
    await redisClient.set(jti, JSON.stringify({ username, role }), {
      EX: TOKEN_EXPIRY_SECONDS
    });

    // Sign JWT with username, jti, and role
    const token = jwt.sign({ username, jti, role }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY_SECONDS
    });

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/');
  } else {
    res.send('<p>Login failed. <a href="/login">Try again</a></p>');
  }
});

app.get('/logout', async (req, res) => {
  try {
    const token = req.cookies.token;
    const payload = jwt.verify(token, JWT_SECRET);
    await redisClient.del(payload.jti);
  } catch (err) {
    // token invalid or expired
  }

  res.clearCookie('token');
  res.redirect('/login');
});

app.listen(3000, () => {
  console.log('JWT+Redis auth app running on port 3000');
});
