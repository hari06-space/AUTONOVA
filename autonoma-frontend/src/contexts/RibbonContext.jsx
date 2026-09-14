import { createContext, useContext, useState } from 'react';

const RibbonContext = createContext({ ribbonOpen: false, setRibbonOpen: () => {} });

export function RibbonProvider({ children }) {
  const [ribbonOpen, setRibbonOpenState] = useState(() => {
    const saved = localStorage.getItem('ribbonOpen');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const setRibbonOpen = (val) => {
    setRibbonOpenState(val);
    localStorage.setItem('ribbonOpen', JSON.stringify(val));
  };

  return <RibbonContext.Provider value={{ ribbonOpen, setRibbonOpen }}>{children}</RibbonContext.Provider>;
}

export function useRibbon() {
  return useContext(RibbonContext);
}
