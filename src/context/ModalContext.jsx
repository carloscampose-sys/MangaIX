import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modalCount, setModalCount] = useState(0);

  const openModal = useCallback(() => {
    setModalCount(prev => prev + 1);
  }, []);

  const closeModal = useCallback(() => {
    setModalCount(prev => Math.max(0, prev - 1));
  }, []);

  const isAnyModalOpen = modalCount > 0;

  const value = {
    isAnyModalOpen,
    openModal,
    closeModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
