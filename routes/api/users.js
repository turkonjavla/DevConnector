const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const User = require('../../models/User');

// @route GET api/users
// @desc Register user
// @access Public
router.post('/', [
  check('name', 'Name is required')
    .not()
    .isEmpty()
    .trim(),
  check('email', 'Please provide a valid email')
    .isEmail()
    .normalizeEmail()
    .trim(),
  check('password', 'Please enter a password with 6 or more characters')
    .isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'User already exists' }] })
    }

    // get users gravatar
    const avatar = gravatar.url(email, {
      s: '200',
      r: 'pg',
      d: 'mm'
    });

    user = new User({
      name,
      email,
      avatar,
      password
    });

    // encrypt password with bcrypt
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // save user to db
    await user.save();

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