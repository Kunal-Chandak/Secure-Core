/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

// context to share room information between pages after create/join
const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [room, setRoom] = useState(null);
  const updateRoom = (data) => setRoom((r) => ({ ...r, ...data }));

  return (
    <RoomContext.Provider value={{ room, updateRoom, setRoom }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within RoomProvider');
  return ctx;
}
