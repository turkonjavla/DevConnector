const express = require('express');
const { check, validationResult } = require('express-validator/check');
const ObjectId = require('mongoose').Types.ObjectId;
const router = express.Router();

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const authMiddleware = require('../../middleware/authMiddleware');

// @route GET api/profile
// @desc Get current users profile
// @access Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile
      .findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar']);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  }
  catch (error) {
    console.error(error);
    res
      .status(500)
      .send('Server error');
  }
});

// @route POST api/profile
// @desc Create or update user profile 
// @access Private
router.post('/', [
  authMiddleware,
  check('status', 'Status is required')
    .not()
    .isEmpty(),
  check('skills', 'Skills are required')
    .not()
    .isEmpty()
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array() })
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = req.body;

  const profileFields = {};

  // build profile object
  profileFields.user = req.user.id; ``
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if (skills) {
    profileFields.skills = skills.split(',').map(skill => skill.trim());
  }

  // build social object
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube
  if (twitter) profileFields.social.twitter = twitter
  if (linkedin) profileFields.social.linkedin = linkedin
  if (twitter) profileFields.social.twitter = twitter
  if (instagram) profileFields.social.instagram = instagram
  if (facebook) profileFields.social.facebook = facebook

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      // update profile
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );

      return res.json(profile);
    }

    // create profile
    profile = new Profile(profileFields);

    await profile.save();
    res.json(profile);
  }
  catch (error) {
    console.error(error);
    res
      .status(500)
      .send('Server error');
  }
});

// @route GET api/profile
// @desc Get all profiles
// @access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile
      .find()
      .populate('user', ['name', 'avatar']);
    res.json(profiles);
  }
  catch (error) {
    console.error('Get all profiles error: ', error.message);
    res
      .status(500)
      .send('Server error');
  }
});

// @route GET api/profile/user/:user_id
// @desc Get profile by user id
// @access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile
      .findOne({ user: req.params.user_id })
      .populate('user', ['name', 'avatar']);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: 'Profile not found' });
    }

    res.json(profile);
  }
  catch (error) {
    console.error('Get all profiles error: ', error.message);
    if (error.kind == 'ObjectId') {
      return res
        .status(400)
        .json({ msg: 'Profile not found' });
    }
    res
      .status(500)
      .send('Server error');
  }
});

// @route DELETE api/profile
// @desc Delete profile, user & posts
// @access Private
router.delete('/', authMiddleware, async (req, res) => {
  try {
    // @todo remove users posts

    // remove profile
    await Profile
      .findOneAndRemove({ user: req.user.id });

    // remove user
    await User
      .findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User removed' });
  }
  catch (error) {
    console.error('Get all profiles error: ', error.message);
    if (error.kind == 'ObjectId') {
      return res
        .status(400)
        .json({ msg: 'Profile not found' });
    }
    res
      .status(500)
      .send('Server error');
  }
});

// @route PUT api/profile/experience
// @desc Add profile experience
// @access Private
router.put('/experience', [
  check('title', 'Title is required')
    .not()
    .isEmpty(),
  check('company', 'Company is required')
    .not()
    .isEmpty(),
  check('from', 'Start date is required')
    .not()
    .isEmpty(),
  authMiddleware
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array() });
  }

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description,
  } = req.body;

  const newExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description,
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    profile.experience.unshift(newExp);
    await profile.save();

    res.json(profile);
  }
  catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send('Server error');
  }
});

// @route DELETE   api/profile/experience/:exp_id
// @desc Remove experience from profile
// @access Private
router.delete('/experience/:exp_id', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { experience: { _id: new ObjectId(req.params.exp_id) } } },
      { new: true }
    );

    await profile.save();
    res.json(profile);
  }
  catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send('Server error');
  }
});

// @route PUT api/profile/education
// @desc Add profile education
// @access Private
router.put('/education', [
  check('school', 'School is required')
    .not()
    .isEmpty(),
  check('degree', 'Degree is required')
    .not()
    .isEmpty(),
  check('from', 'Start date is required')
    .not()
    .isEmpty(),
  check('fieldofstudy', 'Field of study is required')
    .not()
    .isEmpty(),
  authMiddleware
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array() });
  }

  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    description
  } = req.body;

  const newEdu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    description
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    profile.education.unshift(newEdu);
    await profile.save();

    res.json(profile);
  }
  catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send('Server error');
  }
});

// @route DELETE   api/profile/education/:edu_id
// @desc Remove education from profile
// @access Private
router.delete('/education/:edu_id', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { education: { _id: new ObjectId(req.params.edu_id) } } },
      { new: true }
    );

    await profile.save();
    res.json(profile);
  }
  catch (error) {
    console.error(error.message);
    res
      .status(500)
      .send('Server error');
  }
});

module.exports = router;