const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');

const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const authMiddleware = require('../../middleware/authMiddleware');

const User = require('../../models/User');

// @route GET api/auth
// @desc Get auth user
// @access Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  }
  catch (error) {
    console.log(error);
    res
      .status(500)
      .send('Server error');
  }
});

// @route POST api/auth
// @desc Auth user & get token
// @access Public
router.post('/', [
  check('email', 'Please provide a valid email')
    .isEmail(),
  check('password', 'Password is required')
    .exists()
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Invalid email or password' }] })
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Invalid email or password' }] })
    }

    // return jsonwebtoken
    const payload = {
      user: {
        id: user.id
      }
    }
    
    const jwtSecret = config.get('jwtSecret');

    jwt
      .sign(
        payload,
        jwtSecret,
        { expiresIn: 43200 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        });
  }
  catch (error) {
    console.log(error.message);
    res
      .status(500)
      .send('Server error')
  }
});

module.exports = router;