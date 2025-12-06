import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      background: '#2c3e50',
      color: 'white',
      padding: '20px 30px',
      marginTop: 'auto',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <p style={{
            margin: 0,
            fontSize: '14px',
            opacity: 0.9
          }}>
            © 2025 ワッカソン2025 チームI
          </p>
          <p style={{
            margin: '5px 0 0 0',
            fontSize: '12px',
            opacity: 0.7
          }}>
            トロッコ DE サーチ - TROLLEY de SEARCH
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '20px',
          fontSize: '12px',
          opacity: 0.8
        }}>
          <span>トーナメント形式レストラン選択システム</span>
          <span>|</span>
          <span>React 19.2.0 + TypeScript 5.6.2</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
