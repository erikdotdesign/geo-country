import React from 'react';
import './Button.css';

const Button = ({
  onClick,
  children,
  type,
  disabled = false
}: {
  onClick?: () => void;
  children?: React.ReactNode;
  type?: string;
  disabled?: boolean;
}) => {
  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`c-button ${type ? `c-button--${type}` : ""}`}>
      {children}
    </button>
  )
}

export default Button;