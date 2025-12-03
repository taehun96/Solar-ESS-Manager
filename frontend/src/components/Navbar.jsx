function Navbar({ currentPage, onPageChange }) {
  const buttonStyle = {
    background: 'none',
    border: 'none',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '16px'
  };

  return (
    <div style={{ backgroundColor: '#FFD900', padding: '10px' }}>
      <button 
        onClick={() => onPageChange('home')} 
        style={{ ...buttonStyle, fontWeight: currentPage === 'home' ? 'bold' : 'normal' }}>
        HOME
      </button>
      <button 
        onClick={() => onPageChange('statistics')} 
        style={{ ...buttonStyle, fontWeight: currentPage === 'statistics' ? 'bold' : 'normal' }}>
        STATISTICS
      </button>
      <button 
        onClick={() => onPageChange('trade')} 
        style={{ ...buttonStyle, fontWeight: currentPage === 'trade' ? 'bold' : 'normal' }}>
        S.E.M
      </button>
      <button 
        onClick={() => onPageChange('arduino')} 
        style={{ ...buttonStyle, fontWeight: currentPage === 'arduino' ? 'bold' : 'normal' }}>
        ARDUINO
      </button>
      <button 
        onClick={() => onPageChange('env')} 
        style={{ ...buttonStyle, fontWeight: currentPage === 'env' ? 'bold' : 'normal' }}>
        VIRTUAL-ENVIRONMENT-SETTING
      </button>
    </div>
  );
}

export default Navbar;