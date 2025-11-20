import { useState, useEffect } from 'react';
import io from 'socket.io-client';

function EnvSetting() {
  const [settPage, setEnvPage] = useState('none');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isArduinoConnected, setIsArduinoConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState('checking'); // 'checking', 'real', 'virtual'
  
  const [virtualSettings, setVirtualSettings] = useState({
    soc: '',
    solar_w: '',
    lux: '',
    cashBalance: '',
    relayA: '',
    relayB: '',
    relayC: '',
    relayD: ''
  });

  const [currentData, setCurrentData] = useState({
    soc: 0,
    solar_w: 0,
    lux: 0,
    relays: { A: false, B: false, C: false, D: false },
    timestamp: null
  });

  const [currentCash, setCurrentCash] = useState(0);

  const BACKEND_URL = 'http://localhost:5000';
  const socket = io(BACKEND_URL, { autoConnect: false });

  useEffect(() => {
    checkConnections();
    loadCashBalance();
    
    socket.on('connect', () => setIsBackendConnected(true));
    socket.on('disconnect', () => setIsBackendConnected(false));
    socket.on('new_sun_data', (data) => updateCurrentData(data));
    socket.on('relay_status_update', (data) => setCurrentData(prev => ({ ...prev, relays: data })));

    return () => socket.disconnect();
  }, []);

  const loadCashBalance = () => {
    const savedCash = localStorage.getItem('cashBalance');
    if (savedCash) {
      setCurrentCash(parseFloat(savedCash));
    } else {
      setCurrentCash(48020);
      localStorage.setItem('cashBalance', '48020');
    }
  };

  const checkConnections = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/data/latest`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        setIsBackendConnected(true);
        socket.connect();

        if (data.timestamp) {
          const diffMinutes = (new Date() - new Date(data.timestamp)) / (1000 * 60);
          if (diffMinutes < 5) {
            setIsArduinoConnected(true);
            setConnectionMode('real');
            updateCurrentData(data);
          } else {
            setIsArduinoConnected(false);
            setConnectionMode('virtual');
            loadVirtualData();
          }
        } else {
          setConnectionMode('virtual');
          loadVirtualData();
        }
      } else throw new Error('Backend not responding');
    } catch (error) {
      setIsBackendConnected(false);
      setIsArduinoConnected(false);
      setConnectionMode('virtual');
      loadVirtualData();
    }
  };

  const updateCurrentData = (data) => {
    const newData = {
      soc: data.soc || 0,
      solar_w: data.solar_w || 0,
      lux: data.lux || 0,
      relays: currentData.relays,
      timestamp: data.timestamp || new Date().toISOString()
    };
    setCurrentData(newData);
    localStorage.setItem('solarData', JSON.stringify(newData));
  };

  const loadVirtualData = () => {
    const saved = localStorage.getItem('solarData');
    if (saved) setCurrentData(JSON.parse(saved));
  };

  const saveData = async (newData) => {
    if (connectionMode === 'real' && isBackendConnected) {
      try {
        await fetch(`${BACKEND_URL}/api/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            soc: newData.soc ?? currentData.soc,
            solar_w: newData.solar_w ?? currentData.solar_w,
            lux: newData.lux ?? currentData.lux
          })
        });
      } catch (error) { console.error('Failed to send data to backend:', error); }
    } else {
      const updatedData = { ...currentData, ...newData, timestamp: new Date().toISOString() };
      setCurrentData(updatedData);
      localStorage.setItem('solarData', JSON.stringify(updatedData));
    }
  };

  const controlRelay = async (relay, state) => {
    const newRelays = { ...currentData.relays, [relay]: state };
    if (connectionMode === 'real' && isBackendConnected) {
      try {
        await fetch(`${BACKEND_URL}/api/control/relay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRelays)
        });
      } catch (error) { console.error('Failed to control relay:', error); }
    } else {
      const updatedData = { ...currentData, relays: newRelays, timestamp: new Date().toISOString() };
      setCurrentData(updatedData);
      localStorage.setItem('solarData', JSON.stringify(updatedData));
    }
  };

  const toggleManual = () => setEnvPage(prev => (prev === 'none' ? 'setting' : 'none'));
  const handleInputChange = (field, value) => setVirtualSettings(prev => ({ ...prev, [field]: value }));

  const cleanEnvironment = async () => {
    if (!window.confirm('모든 데이터를 초기화하시겠습니까?')) return;

    const resetData = {
      soc: 0,
      solar_w: 0,
      lux: 0,
      relays: { A: false, B: false, C: false, D: false },
      timestamp: new Date().toISOString()
    };

    if (connectionMode === 'real' && isBackendConnected) {
      try { await fetch(`${BACKEND_URL}/api/reset`, { method: 'POST' }); } 
      catch (error) { console.error('Backend reset failed:', error); }
    }

    setCurrentData(resetData);
    localStorage.setItem('solarData', JSON.stringify(resetData));
    localStorage.setItem('cashBalance', '0');
    setCurrentCash(0);
    setVirtualSettings({ soc: '', solar_w: '', lux: '', cashBalance: '', relayA: '', relayB: '', relayC: '', relayD: '' });
    alert('환경이 초기화되었고, 자산도 0원으로 초기화되었습니다.');
  };

  const connectArduino = async () => {
    await checkConnections();
    if (isArduinoConnected) {
      alert(
        `✅ 아두이노 연결됨!\n` +
        `배터리: ${currentData.soc}%\n` +
        `발전량: ${currentData.solar_w}W\n` +
        `조도: ${currentData.lux}lux\n` +
        `마지막 업데이트: ${new Date(currentData.timestamp).toLocaleString()}`
      );
    } else if (isBackendConnected) {
      alert('⚠️ 백엔드는 연결되었으나 아두이노 응답 없음\n가상 모드로 전환됩니다.');
    } else {
      alert('❌ 백엔드 연결 실패\n가상 모드로 작동합니다.');
    }
  };

  const startVirtualAuto = async () => {
    const virtualData = {
      soc: Math.floor(Math.random() * 40) + 60,
      solar_w: Math.floor(Math.random() * 150) + 50,
      lux: Math.floor(Math.random() * 30000) + 20000
    };
    await saveData(virtualData);
    alert(`가상 환경 자동 시작!\n배터리: ${virtualData.soc}%\n발전량: ${virtualData.solar_w}W\n조도: ${virtualData.lux}lux`);
  };

  const setSoc = () => {
    const value = parseFloat(virtualSettings.soc);
    if (isNaN(value) || value < 0 || value > 100) { alert('0-100 사이의 값을 입력하세요'); return; }
    saveData({ soc: value }); alert(`배터리 잔량 ${value}% 설정 완료`);
  };

  const setSolarW = () => {
    const value = parseFloat(virtualSettings.solar_w);
    if (isNaN(value) || value < 0) { alert('0 이상의 값을 입력하세요'); return; }
    saveData({ solar_w: value }); alert(`발전량 ${value}W 설정 완료`);
  };

  const setLux = () => {
    const value = parseFloat(virtualSettings.lux);
    if (isNaN(value) || value < 0) { alert('0 이상의 값을 입력하세요'); return; }
    saveData({ lux: value }); alert(`조도 ${value}lux 설정 완료`);
  };

  const setCashBalance = () => {
    const value = parseFloat(virtualSettings.cashBalance);
    if (isNaN(value) || value < 0) { alert('0 이상의 값을 입력하세요'); return; }
    localStorage.setItem('cashBalance', value.toString());
    setCurrentCash(value);
    alert(`현금 잔고 ${value.toLocaleString()}원 설정 완료`);
  };

  const setRelayPower = (relay, power) => {
    const value = parseFloat(power);
    if (isNaN(value) || value < 0) { alert('0 이상의 값을 입력하세요'); return; }
    controlRelay(relay, value > 0); alert(`${relay}가구에 ${value}W 전력 공급 ${value > 0 ? '시작' : '중지'}`);
  };

  const fillDefaultStats = () => {
    setVirtualSettings({ 
      soc: '80', 
      solar_w: '150', 
      lux: '35000', 
      cashBalance: '48020',
      relayA: '50', 
      relayB: '100', 
      relayC: '75', 
      relayD: '120' 
    });
    alert('기본값으로 설정되었습니다!');
  };

  const getStatusColor = () => connectionMode === 'real' ? '#d4edda' : '#fff3cd';
  const getStatusBorder = () => connectionMode === 'real' ? '#c3e6cb' : '#ffeaa7';
  const getStatusText = () => connectionMode === 'real' ? '🟢 실제 모드 (아두이노 연결됨)' : '🟡 가상 모드 (로컬 데이터 사용)';

  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment<br />Setting</h1>
      <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: getStatusColor(), border: `1px solid ${getStatusBorder()}`, borderRadius: '5px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>{getStatusText()}</h3>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>백엔드: {isBackendConnected ? '✅ 연결됨' : '❌ 연결 안됨'}</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>아두이노: {isArduinoConnected ? '✅ 연결됨' : '❌ 연결 안됨'}</p>
      </div>

      <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>📊 현재 데이터</h3>
        <p style={{ margin: '5px 0' }}>배터리: {currentData.soc}%</p>
        <p style={{ margin: '5px 0' }}>발전량: {currentData.solar_w}W</p>
        <p style={{ margin: '5px 0' }}>조도: {currentData.lux}lux</p>
        <p style={{ margin: '5px 0' }}>현금 잔고: {currentCash.toLocaleString()}원</p>
        <p style={{ margin: '5px 0' }}>
          릴레이: A({currentData.relays.A ? 'ON' : 'OFF'}) B({currentData.relays.B ? 'ON' : 'OFF'}) C({currentData.relays.C ? 'ON' : 'OFF'}) D({currentData.relays.D ? 'ON' : 'OFF'})
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
          {currentData.timestamp ? `마지막 업데이트: ${new Date(currentData.timestamp).toLocaleString()}` : '데이터 없음'}
        </p>
      </div>

      <div>
        <button onClick={cleanEnvironment} style={{ padding: '10px 20px', margin: '5px', cursor: 'pointer' }}>clean environment</button>
        <p style={{ fontSize: '12px', color: '#666' }}>모든 데이터 초기화 (자산 0원 포함)</p>
        
        <button onClick={connectArduino} style={{ padding: '10px 20px', margin: '5px', cursor: 'pointer' }}>check connection</button>
        <p style={{ fontSize: '12px', color: '#666' }}>백엔드/아두이노 연결 상태 확인</p>
        
        <button onClick={startVirtualAuto} style={{ padding: '10px 20px', margin: '5px', cursor: 'pointer' }}>start virtual environment auto</button>
        <p style={{ fontSize: '12px', color: '#666' }}>랜덤 가상 데이터 자동 생성</p>
        
        <button onClick={toggleManual} style={{ padding: '10px 20px', margin: '5px', cursor: 'pointer' }}>start virtual environment manually</button>
        <p style={{ fontSize: '12px', color: '#666' }}>수동으로 값 설정</p>
      </div>

      <div style={{ margin: "20px 0", padding: "20px", border: "1px solid #ddd", borderRadius: "5px", minHeight: "100px", backgroundColor: "#f9f9f9" }}>
        {settPage === 'none' && <div style={{ textAlign: 'center', color: '#999' }}><p>수동 설정을 시작하려면 위 버튼을 클릭하세요</p></div>}
        {settPage === 'setting' && (
          <div>
            <h2>Manual Setting</h2>
            <div style={{ marginBottom: '15px' }}>
              <input type='number' placeholder='0-100' value={virtualSettings.soc} onChange={(e) => handleInputChange('soc', e.target.value)} style={{ padding: '8px', marginRight: '10px', width: '150px' }} />
              <button onClick={setSoc} style={{ padding: '8px 15px', cursor: 'pointer' }}>에너지 잔고량 (배터리 %)</button>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input type='number' placeholder='Watts' value={virtualSettings.solar_w} onChange={(e) => handleInputChange('solar_w', e.target.value)} style={{ padding: '8px', marginRight: '10px', width: '150px' }} />
              <button onClick={setSolarW} style={{ padding: '8px 15px', cursor: 'pointer' }}>태양광 발전량 (W)</button>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input type='number' placeholder='Lux' value={virtualSettings.lux} onChange={(e) => handleInputChange('lux', e.target.value)} style={{ padding: '8px', marginRight: '10px', width: '150px' }} />
              <button onClick={setLux} style={{ padding: '8px 15px', cursor: 'pointer' }}>조도 (lux)</button>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input type='number' placeholder='원(₩)' value={virtualSettings.cashBalance} onChange={(e) => handleInputChange('cashBalance', e.target.value)} style={{ padding: '8px', marginRight: '10px', width: '150px' }} />
              <button onClick={setCashBalance} style={{ padding: '8px 15px', cursor: 'pointer' }}>현금 잔고 (원)</button>
            </div>
            {['A', 'B', 'C', 'D'].map(relay => (
              <div key={relay} style={{ marginBottom: '15px' }}>
                <input type='number' placeholder='Watts' value={virtualSettings[`relay${relay}`]} onChange={(e) => handleInputChange(`relay${relay}`, e.target.value)} style={{ padding: '8px', marginRight: '10px', width: '150px' }} />
                <button onClick={() => setRelayPower(relay, virtualSettings[`relay${relay}`])} style={{ padding: '8px 15px', cursor: 'pointer' }}>{relay}가구 전력량</button>
              </div>
            ))}
            <div style={{ marginTop: '20px' }}>
              <button onClick={fillDefaultStats} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>통계 정보 기본값으로 채우기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnvSetting;