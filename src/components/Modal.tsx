import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "560px",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fema-modal-overlay" onClick={onClose}>
      <div
        className="fema-modal-card"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fema-modal-header">
          <div>
            <h3 className="fema-modal-title">{title}</h3>
            {subtitle && <p className="fema-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            className="fema-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="fema-modal-body">{children}</div>
      </div>
    </div>
  );
};
