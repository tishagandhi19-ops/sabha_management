import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Authenticate superadmin & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: 'કૃપા કરીને બધી માહિતી ભરો' }); // "Please fill in all details"
  }

  const expectedUsername = process.env.SUPERADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.SUPERADMIN_PASSWORD || 'admin123';
  const expectedUsername2 = process.env.SUPERADMIN2_USERNAME || 'seva_admin';
  const expectedPassword2 = process.env.SUPERADMIN2_PASSWORD || 'seva123';

  let role = '';
  let usernameToUse = '';

  if (username === expectedUsername && password === expectedPassword) {
    role = 'superadmin';
    usernameToUse = expectedUsername;
  } else if (username === expectedUsername2 && password === expectedPassword2) {
    role = 'seva_admin';
    usernameToUse = expectedUsername2;
  } else {
    return res.status(400).json({ msg: 'અમાન્ય વપરાશકર્તા નામ અથવા પાસવર્ડ' }); // "Invalid username or password"
  }

  try {
    const payload = {
      admin: {
        username: usernameToUse,
        role: role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'sabha_management_super_secret_key_987654321',
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('સર્વર ભૂલ');
  }
});

export default router;
