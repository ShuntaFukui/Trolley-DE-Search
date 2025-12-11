import React from 'react';
import '../../styles/index.css';

interface HeaderProps {
  pageTitle?: string;
}

const Header: React.FC<HeaderProps> = ({ pageTitle = 'トロッコ de サーチ' }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <img 
          src="/images/logo.webp" 
          alt="Logo" 
          className="header-logo"
        />
        <h1 className="header-title">
          {pageTitle}
        </h1>
      </div>
    </header>
  );
};

export default Header;
