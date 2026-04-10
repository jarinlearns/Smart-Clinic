import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import landingImage from '../assets/homepage.png';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <div className="hero-content">
        <h1>
          Efficient Clinic Management and service, <span className="highlight">Simplified.</span>
        </h1>
        <p>
          Welcome to Smart Clinic, the all-in-one solution for patient service, managing patient flow,
          pharmacy inventory, and operational insights.
        </p>
        <Link to="/login" className="cta-button">
          Login
        </Link>
      </div>
      <div className="hero-image">
        <img src={landingImage} alt="Smart Clinic App landing page" className="landing-image" />
        
      </div>
    </div>
  );
};

export default LandingPage;