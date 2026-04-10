const express = require('express');
const router = express.Router();
const { registerUser, updateDoctorStatus, loginUser, getUsers, getDoctorStats, createUser, updateUser, getUserProfile, updateUserProfile, updateUserPassword , getDoctorIncomeStats, getDoctors } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');


router.route('/').get(protect, getUsers);
router.post('/register', registerUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/profile/password')
  .put(protect, updateUserPassword);
router.put('/profile/status', protect, updateDoctorStatus);
router.post('/login', loginUser);
router.route('/:id/stats').get(protect, getDoctorStats);
router.route('/:id')
    .patch(protect, updateUser);
router.route('/:id/income').get(protect, getDoctorIncomeStats);
router.route('/doctors').get(getDoctors);
router.post('/create', protect, createUser);
module.exports = router;