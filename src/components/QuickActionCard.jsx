import React from 'react';

/**
 * A card used on the home screen for quick actions.
 * Props:
 *  - icon: JSX element for the icon
 *  - title: string
 *  - onClick: function
 */
export default function QuickActionCard({ icon, title, onClick }) {
  return (
    <div className="cyber-card center-vert" onClick={onClick} style={{cursor:'pointer', gap:'12px', width:'200px'}}>
      <div style={{fontSize:'2rem'}}>{icon}</div>
      <div style={{fontWeight:'600'}}>{title}</div>
    </div>
  );
}
