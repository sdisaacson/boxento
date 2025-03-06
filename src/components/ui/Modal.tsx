import React, { ReactNode, useEffect, useRef, MouseEvent, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Modal Component
 * 
 * A reusable modal component that renders its content in a portal
 * at the document body level, ensuring it appears above everything
 * else on the page.
 */
const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Get width class based on size prop
  const getWidthClass = (): string => {
    switch (size) {
      case 'sm': return 'w-80';
      case 'md': return 'w-96';
      case 'lg': return 'w-[32rem]';
      case 'xl': return 'w-[48rem]';
      case 'full': return 'w-[90vw]';
      default: return 'w-96';
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc as any);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc as any);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    // Prevent clicks in the modal backdrop from affecting widgets underneath
    e.stopPropagation();
    onClose();
  };

  const handleModalClick = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-slate-800 rounded-lg p-6 ${getWidthClass()} shadow-lg dark:shadow-slate-900/30 max-h-[90vh] overflow-auto`}
        onClick={handleModalClick}
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        onMouseUp={(e: React.MouseEvent) => e.stopPropagation()}
        onMouseMove={(e: React.MouseEvent) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 ml-auto"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          {children}
        </div>
        
        {footer && (
          <div className="flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;