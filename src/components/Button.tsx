import React from 'react';
import { Link } from 'react-router-dom';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
};

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  href, 
  className = '',
  onClick,
  type = 'button'
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantStyles = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm",
    secondary: "bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500 shadow-sm",
    outline: "border-2 border-primary-600 bg-transparent hover:bg-primary-50 text-primary-600 focus:ring-primary-500",
    text: "bg-transparent hover:bg-primary-50 text-primary-600 hover:text-primary-700 focus:ring-primary-500"
  };
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  const allStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  
  if (href) {
    return (
      <Link to={href} className={allStyles}>
        {children}
      </Link>
    );
  }
  
  return (
    <button type={type} className={allStyles} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;