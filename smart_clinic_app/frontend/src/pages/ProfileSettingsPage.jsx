import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, updateUserPassword } from '../services/userService';
import { Link } from 'react-router-dom';
import './ProfileSettingsPage.css'; 

const ProfileSettingsPage = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setUser(data);
        setFormData({
          name: data.name,
          email: data.email,
          specialty: data.specialty || '',
          consultationFee: data.consultationFee || 0,
        });
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await updateUserProfile(formData);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }
    try {
      const res = await updateUserPassword(passwordData);
      setSuccess(res.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="profile-container">
      <div className="list-header">
      <h1>Account Settings</h1>
        <Link to="/" className="action-button secondary">
          ← Back to Dashboard
        </Link>
        </div>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <div className="profile-forms-grid">
        <div className="form-card">
          <h2>My Profile</h2>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group"><label>Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleProfileChange} required /></div>
            <div className="form-group"><label>Username</label><input type="text" name="email" value={formData.email || ''} onChange={handleProfileChange} required /></div>
            {user?.role === 'Doctor' && (
              <>
                <div className="form-group"><label>Specialty</label><input type="text" name="specialty" placeholder="e.g., Cardiologist" value={formData.specialty || ''} onChange={handleProfileChange} /></div>
                <div className="form-group"><label>Consultation Fee (BDT)</label><input type="number" name="consultationFee" value={formData.consultationFee || 0} onChange={handleProfileChange} /></div>
              </>
            )}
            <button type="submit" className="submit-button">Update Profile</button>
          </form>
        </div>
        
        <div className="form-card">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group"><label>Current Password</label><input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required /></div>
            <div className="form-group"><label>New Password</label><input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required /></div>
            <div className="form-group"><label>Confirm New Password</label><input type="password" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={handlePasswordChange} required /></div>
            <button type="submit" className="submit-button">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;