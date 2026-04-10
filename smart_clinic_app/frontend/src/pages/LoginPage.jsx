import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css'; 

import landingImage from '../assets/homepage.png';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate(); 

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const { data } = await api.post(
        '/users/login', 
        { email, password }
      );

      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);


      navigate('/');
      window.location.reload(); 

    } catch (err) {
      setError(err.response && err.response.data.message ? err.response.data.message : 'Login Failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login</h1>
        
        {error && <p className="error-message">{error}</p>}
        
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="email">Username</label>
            <input
              type="text"
              id="email"
              placeholder="Enter username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        <div className="register-link">
          New Customer? <Link to="/register">Register now</Link>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;