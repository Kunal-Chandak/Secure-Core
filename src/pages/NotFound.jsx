import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="container center-vert" style={{minHeight:'100vh'}}>
      <h1 className="glow-active" style={{fontSize:'4rem'}}>404</h1>
      <p>Secure route not found</p>
      <button className="glow-button" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
}
