import { useState } from 'react';

function App() {
  const [page, setPage] = useState('home');
  const [arduPage, setArduPage] = useState('circuits');

  const buttonStyle = {
    background: 'none',
    border: 'none',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '16px'
  };

  return (
    <div>
      <div style={{ backgroundColor: '#FFD900', padding: '10px'}}>
        <button 
          onClick={() => setPage('home')} 
          style={{ ...buttonStyle, fontWeight: page === 'home' ? 'bold' : 'normal' }}>
          HOME
        </button>
        <button 
          onClick={() => setPage('statistics')} 
          style={{ ...buttonStyle, fontWeight: page === 'statistics' ? 'bold' : 'normal' }}>
          STATISTICS
        </button>
        <button 
          onClick={() => setPage('trade')} 
          style={{ ...buttonStyle, fontWeight: page === 'trade' ? 'bold' : 'normal' }}>
          S.E.M
        </button>
        <button 
          onClick={() => setPage('arduino')} 
          style={{ ...buttonStyle, fontWeight: page === 'arduino' ? 'bold' : 'normal' }}>
          ARDUINO
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {page === 'home' && (
          <div>
            <h1>What is<br></br>Solar ESS Manager?</h1>
            <img src="img/yellow.png" width="200" height="200" alt="yellow"/>
            <img src="img/gray.png" width="200" height="200" alt="gray"/>
            <h1>Introducing<br></br>S.E.M</h1>
          </div>
        )}
        
        {page === 'statistics' && (
        <div>
            <h1>Statistics</h1>
            <div id="holder" style={{backgroundColor:"#FFD900"}}>현재 최적의 판매 조합 추천</div>
            <div id="holder" style={{backgroundColor:"#DCDCDC"}}>시간대별 에너지 축적량 차트</div>
            <div id="holder" style={{backgroundColor:"#DCDCDC"}}>가구별 에너지 보유량 차트</div>
        </div>
        )}
        
        {page === 'trade' && (
        <div>
            <h1>Trade System</h1>
            <div>
                <div id="holder" style={{backgroundColor:"#DCDCDC", width:"200px",height:"50px"}}>내 에너지 잔고</div>
                <div id="holder" style={{backgroundColor:"#DCDCDC", width:"200px",height:"50px"}}>가상현금 잔고</div>
                <div id="holder" style={{backgroundColor:"#FFD900"}}>거래할 수 있는 기능</div>
                <div id="holder" style={{display: 'flex', justifyContent: 'space-between', width:"200px",height:"50px", margin:"10px"}}>
                    <button style={{width:"80px"}}>SELECT</button>
                    <button style={{width:"80px"}}>SELL</button>
                </div>
            </div>
        </div>
        )}
        
        {page === 'arduino' && (
         <div>
            <h1>Arduino<br></br>Structure</h1>
            <div style={{display:"flex", justifyContent:"center", backgroundColor:"#DCDCDC",width:"500px"}}>
                <button className="ardu-button" onClick={() => setArduPage('circuits')}>CERCUITS</button>
                <button className="ardu-button" onClick={() => setArduPage('video')}>VIDEO</button>
                <button className="ardu-button" onClick={() => setArduPage('flowchart')}>FLOWCHART</button>
            </div>
            <div id="ardu-show" style={{margin:"0px",backgroundColor:"#DCDCDC",width:"500px", height:"500px"}}>
                {arduPage==='circuits'&&(
                    <div>
                        <h1>CIRCUITS</h1>
                    </div>
                )}

                {arduPage==='video'&&(
                    <div>
                        <h1>VIDEO</h1>
                    </div>
                )}

                {arduPage==='flowchart'&&(
                    <div>
                        <h1>FLOWCHART</h1>
                    </div>
                )}
            </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;