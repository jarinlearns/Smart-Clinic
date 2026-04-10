const User = require('../models/userModel');
const Prescription = require('../models/prescriptionModel');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialty: user.specialty,
      isAvailable: user.isAvailable,
      consultationFee: user.consultationFee,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
const updateDoctorStatus = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    if (req.user.role !== 'Doctor') {
        return res.status(401).json({ message: 'Only doctors can update availability' });
    }

    const user = await User.findById(req.user._id);

    if (user) {
      user.isAvailable = isAvailable;
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isAvailable: updatedUser.isAvailable,
        token: req.token 
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (user.role === 'Doctor') {
      user.specialty = req.body.specialty || user.specialty;
      user.consultationFee = req.body.consultationFee ?? user.consultationFee;
    }

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id), 
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const updateUserPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await bcrypt.compare(currentPassword, user.password))) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } else {
        res.status(401).json({ message: 'Invalid current password' });
    }
};

const updateUser = async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Not authorized to edit users' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email is already in use.' });
        }
      }
      if (req.body.role && user.role === 'Admin' && req.user.id === user.id) {
        const adminCount = await User.countDocuments({ role: 'Admin' });
        if (adminCount <= 1 && req.body.role !== 'Admin') {
          return res.status(400).json({ message: 'Cannot change the role of the last administrator.' });
        }
      }

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt, 
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const createUser = async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Not authorized to create users' });
  }

  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};




const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (role && role !== 'Patient') {
    return res.status(400).json({ message: 'Public registration is for patients only.' });
  }
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'Patient',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAvailable: user.isAvailable,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get statistics for a specific doctor
// @route   GET /api/users/:id/stats
// @access  Private
const getDoctorStats = async (req, res) => {
    try {
        const doctorId = new mongoose.Types.ObjectId(req.params.id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const timeStats = await Prescription.aggregate([
            { $match: { doctor: doctorId, createdAt: { $gte: today } } },
            { $addFields: { duration: { $divide: [{ $subtract: ["$consultationEndTime", "$consultationStartTime"] }, 60000] } } },
            { $group: { _id: null, averageConsultationTime: { $avg: "$duration" } } }
        ]);

        const diagnosisStats = await Prescription.aggregate([
            { $match: { doctor: doctorId, createdAt: { $gte: today } } },
            { $group: { _id: "$diagnosis", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const averageTime = timeStats[0]?.averageConsultationTime || 0;

        res.json({
            averageTime: averageTime,
            commonDiagnoses: diagnosisStats,
        });

    } catch (error) {
        console.error("ERROR FETCHING DOCTOR STATS:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
const updateUserRole = async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Not authorized to change user roles' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'Admin' && req.user.id === user.id) {
        const adminCount = await User.countDocuments({ role: 'Admin' });
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot change the role of the last administrator.' });
        }
      }

      user.role = req.body.role || user.role;
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getDoctorIncomeStats = async (req, res) => {
  try {
    const doctorId = new mongoose.Types.ObjectId(req.params.id);

    const doctor = await User.findById(doctorId).select('consultationFee');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    const consultationFee = doctor.consultationFee || 0;

    const completedConsultations = await Prescription.countDocuments({
      doctor: doctorId,
      status: { $in: ['Filled', 'Partially Filled', 'Pending'] },
    });

    const totalEarnings = completedConsultations * consultationFee;

    res.json({
      totalEarnings,
      consultationFee,
      paidConsultations: completedConsultations, 
    });

  } catch (error) {
    console.error("ERROR FETCHING DOCTOR INCOME STATS:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};



const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'Doctor' }).select(
      'name email specialty consultationFee isAvailable'
    );
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};




module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getDoctorStats,
  createUser,
  updateUserRole,
  updateUser,
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  getDoctorIncomeStats,
  getDoctors,
  updateDoctorStatus,
};
