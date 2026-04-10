import React, { useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import './RegisterPage.css'; 

const AddUserPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Doctor'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      await api.post('/users/create', { name, email, password, role }, config);
      setLoading(false);
      setSuccess(`Successfully created ${role} account for ${name}.`);
      
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Create a New User Account</h1>
        <p>As an administrator, you can create new accounts for staff and patients.</p>
        
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        
        <form onSubmit={submitHandler}>
          <div className="form-group"><label htmlFor="name">Name</label><input type="text" id="name" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="form-group"><label htmlFor="email">Username</label><input type="text" id="email" placeholder="Enter username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="form-group"><label htmlFor="password">Password</label><input type="password" id="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Doctor">Doctor</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="Patient">Patient</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
        <div className="login-link">
          <Link to="/">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default AddUserPage;