import React, { useEffect, useRef } from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, children, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={handleOutsideClick}>
      <div className="confirm-modal-content" ref={modalRef}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-modal-body">
          {message && <p>{message}</p>}
          {children}
        </div>
        <div className="confirm-modal-footer">
          <button className="btn btn-outline" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn btn-${type === 'danger' ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
