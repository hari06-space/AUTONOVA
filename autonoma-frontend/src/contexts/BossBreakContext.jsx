import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const BossBreakContext = createContext({
  isOpen: false,
  activeTab: 'timer',
  openBossBreak: () => {},
  closeBossBreak: () => {},
  setActiveTab: () => {}
});

export function BossBreakProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'relax' | 'games'

  const openBossBreak = useCallback((tab = 'timer') => {
    setActiveTab(tab);
    setIsOpen(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-boss-break', { detail: { tab } }));
    }
  }, []);

  const closeBossBreak = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('close-boss-break'));
    }
  }, []);

  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail?.tab) setActiveTab(e.detail.tab);
      setIsOpen(true);
    };
    const handleClose = () => {
      setIsOpen(false);
    };
    window.addEventListener('open-boss-break', handleOpen);
    window.addEventListener('close-boss-break', handleClose);
    return () => {
      window.removeEventListener('open-boss-break', handleOpen);
      window.removeEventListener('close-boss-break', handleClose);
    };
  }, []);

  return (
    <BossBreakContext.Provider value={{ isOpen, activeTab, openBossBreak, closeBossBreak, setActiveTab }}>
      {children}
    </BossBreakContext.Provider>
  );
}

export function useBossBreak() {
  const context = useContext(BossBreakContext);
  if (!context) {
    return {
      isOpen: false,
      activeTab: 'timer',
      openBossBreak: (tab = 'timer') => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-boss-break', { detail: { tab } }));
        }
      },
      closeBossBreak: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('close-boss-break'));
        }
      },
      setActiveTab: () => {}
    };
  }
  return context;
}

export default BossBreakContext;
