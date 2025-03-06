import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * Modal Component
 * 
 * A reusable modal component that renders its content in a portal
 * at the document body level, ensuring it appears above everything
 * else on the page.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {string} props.title - Modal title
 * @param {ReactNode} props.children - Modal content
 * @param {ReactNode} props.footer - Modal footer content
 * @returns {JSX.Element} Modal component
 */
const Modal = ({ isOpen, onClose, title, children, footer }) => {
  const modalRef = useRef(null);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
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