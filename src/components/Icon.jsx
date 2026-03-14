const Icon = ({ name, size = 20, color = "currentColor", style, className }) => {
  const icons = {
    shield:      <><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    lock:        <><rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.5" fill="none"/><path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill={color}/></>,
    lockOpen:    <><rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.5" fill="none"/><path d="M8 11V7a4 4 0 016.93-2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    plus:        <><path d="M12 5v14M5 12h14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
    users:       <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5" fill="none"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    qr:          <><rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/><rect x="5" y="5" width="3" height="3" fill={color}/><rect x="16" y="5" width="3" height="3" fill={color}/><rect x="5" y="16" width="3" height="3" fill={color}/><path d="M14 14h3v3M17 14v3h3M14 17h3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
    upload:      <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><polyline points="17 8 12 3 7 8" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
    download:    <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><polyline points="7 10 12 15 17 10" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
    send:        <><line x1="22" y1="2" x2="11" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/></>,
    copy:        <><rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="1.5" fill="none"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    share:       <><circle cx="18" cy="5" r="3" stroke={color} strokeWidth="1.5" fill="none"/><circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="none"/><circle cx="18" cy="19" r="3" stroke={color} strokeWidth="1.5" fill="none"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    clock:       <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none"/><polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    file:        <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.5" fill="none"/><polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/></>,
    check:       <><polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    x:           <><line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
    arrowLeft:   <><line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><polyline points="12 19 5 12 12 5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    paperclip:   <><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    alert:       <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/></>,
    cpu:         <><rect x="9" y="9" width="6" height="6" stroke={color} strokeWidth="1.5" fill="none"/><path d="M20 14h1v-4h-1M3 14h1v-4H3M14 20v1h-4v-1M14 3v1h-4V3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M20 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2z" stroke={color} strokeWidth="1.5" fill="none"/></>,
    wifi:        <><path d="M5 12.55a11 11 0 0114.08 0" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M1.42 9a16 16 0 0121.16 0" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M8.53 16.11a6 6 0 016.95 0" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="12" cy="20" r="1" fill={color}/></>,
    home:        <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/></>,
    camera:      <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.5" fill="none"/></>,
    trash:       <><polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} className={className}>
      {icons[name] || null}
    </svg>
  );
};

export default Icon;
