import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; 
import './Header.css';

const Header = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true); 
  const navigate = useNavigate();

  useEffect(() => {
    
    const storedUserInfo = localStorage.getItem('userInfo');
    let parsedUser = null;

    if (storedUserInfo) {
      parsedUser = JSON.parse(storedUserInfo);
      setUserInfo(parsedUser);
      
      if (parsedUser.isAvailable !== undefined) {
        setIsAvailable(parsedUser.isAvailable);
      }
    }

    
    const fetchLatestStatus = async () => {
      if (parsedUser && parsedUser.role === 'Doctor') {
        try {
          const config = {
            headers: { Authorization: `Bearer ${parsedUser.token}` },
          };
          
          
          const { data } = await api.get('/users/profile', config);
          
          
          setIsAvailable(data.isAvailable);
          
          
          const updatedUser = { ...parsedUser, isAvailable: data.isAvailable };
          localStorage.setItem('userInfo', JSON.stringify(updatedUser));
          
        } catch (error) {
          console.error("Error syncing status:", error);
        }
      }
    };

    fetchLatestStatus();

  }, []);

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    navigate('/login');
    window.location.reload();
  };

  
  const toggleAvailability = async () => {
    try {
      
      const newStatus = !isAvailable;
      setIsAvailable(newStatus); 

      const token = userInfo.token;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      
      const { data } = await api.put(
        '/users/profile/status',
        { isAvailable: newStatus },
        config
      );

      
      const updatedUserInfo = { ...userInfo, isAvailable: data.isAvailable };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      setUserInfo(updatedUserInfo);

    } catch (error) {
      console.error("Failed to update status", error);
      setIsAvailable(!isAvailable); 
      alert("Failed to update status");
    }
  };

  return (
    <header className="header">
      <div>
        <Link to="/" className="brand-link">
          Smart Clinic
        </Link>
      </div>
      <nav className="header-nav"> 
        {userInfo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span className="user-greeting">Hello, {userInfo.name} ({userInfo.role})</span>
            
            {userInfo.role === 'Doctor' && (
              <div 
                onClick={toggleAvailability}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: isAvailable ? '#e6fffa' : '#fff5f5',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${isAvailable ? '#38b2ac' : '#fc8181'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isAvailable ? '#38b2ac' : '#fc8181',
                  marginRight: '8px'
                }}></div>
                <span style={{ 
                  color: isAvailable ? '#2c7a7b' : '#c53030',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            )}
            
            <Link to="/profile" className="account-settings-button">
              Account Settings
            </Link>
            <button onClick={logoutHandler} className="logout-button">
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;