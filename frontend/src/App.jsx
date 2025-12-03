import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import Trade from './pages/Trade';
import Arduino from './pages/Arduino';
import EnvSetting from './pages/EnvSetting';

function App() {
  const [page, setPage] = useState('home');

  return (
    <div>
      <Navbar currentPage={page} onPageChange={setPage} />
      
      <div style={{ padding: '20px' }}>
        {page === 'home' && <Home />}
        {page === 'statistics' && <Statistics />}
        {page === 'trade' && <Trade />}
        {page === 'arduino' && <Arduino />}
        {page === 'env' && <EnvSetting />}
      </div>
    </div>
  );
}

export default App;