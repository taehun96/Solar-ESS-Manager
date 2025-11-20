import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import turnoff from '../../img/turnoff.png';
import turnon from '../../img/turnon.png';

function Trade() {
  const [selectedHouses, setSelectedHouses] = useState([]);
  const [relayStatus, setRelayStatus] = useState({ A: false, B: false, C: false, D: false });
  const [energyBalance, setEnergyBalance] = useState(0); // Watt
  const [cashBalance, setCashBalance] = useState(0); // ₩
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState('virtual'); // 'real' or 'virtual'
  const [houseEnergy, setHouseEnergy] = useState({ A: 0, B: 0, C: 0, D: 0 }); // 각 가구 에너지
  const [isHoverSell, setIsHoverSell] = useState(false); // SELL 버튼 호버 상태
  
  const houses = ["A", "B", "C", "D"];
  const BACKEND_URL = 'http://localhost:5000';
  const PRICE_PER_WATT = 140; // 1W당 140원
  let socket = null;

  // 초기 데이터 로드
  useEffect(() => {
    loadLocalData();
    checkBackendConnection();
    
    // WebSocket 연결
    socket = io(BACKEND_URL, { autoConnect: false });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsBackendConnected(true);
      setConnectionMode('real');
      loadRelayStatus();
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsBackendConnected(false);
      setConnectionMode('virtual');
    });

    // 실시간 릴레이 상태 업데이트
    socket.on('relay_status_update', (data) => {
      console.log('🔌 Relay status updated:', data);
      setRelayStatus(data);
      // localStorage 동기화
      const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
      solarData.relays = data;
      localStorage.setItem('solarData', JSON.stringify(solarData));
    });

    // 실시간 에너지 데이터 업데이트
    socket.on('new_sun_data', (data) => {
      console.log('📡 Energy data updated:', data);
      if (data.soc !== undefined) {
        const energyInWatt = (data.soc / 100) * 10000; // SOC%를 Watt로 변환
        setEnergyBalance(energyInWatt);
        
        // localStorage 동기화
        const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
        solarData.soc = data.soc;
        solarData.solar_w = data.solar_w;
        solarData.lux = data.lux;
        localStorage.setItem('solarData', JSON.stringify(solarData));
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // 로컬 데이터 로드
  const loadLocalData = () => {
    // localStorage에서 태양광 데이터 로드
    const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
    if (solarData.soc) {
      const energyInWatt = (solarData.soc / 100) * 10000;
      setEnergyBalance(energyInWatt);
    }

    // 릴레이 상태 로드
    if (solarData.relays) {
      setRelayStatus(solarData.relays);
    }

    // 각 가구 에너지 로드
    const savedHouseEnergy = JSON.parse(localStorage.getItem('houseEnergy') || '{}');
    if (Object.keys(savedHouseEnergy).length > 0) {
      setHouseEnergy(savedHouseEnergy);
    } else {
      // 초기값 설정
      const initialEnergy = { A: 1200, B: 800, C: 1500, D: 950 };
      setHouseEnergy(initialEnergy);
      localStorage.setItem('houseEnergy', JSON.stringify(initialEnergy));
    }

    // 현금 잔고 로드
    const savedCash = localStorage.getItem('cashBalance');
    if (savedCash) {
      setCashBalance(parseFloat(savedCash));
    } else {
      setCashBalance(48020); // 초기값
      localStorage.setItem('cashBalance', '48020');
    }

    // 거래 내역 로드
    const savedHistory = JSON.parse(localStorage.getItem('tradeHistory') || '[]');
    setTradeHistory(savedHistory);
  };

  // 백엔드 연결 확인
  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/data/latest`, {
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 최근 5분 이내 데이터가 있으면 실제 모드
        if (data.timestamp) {
          const diffMinutes = (new Date() - new Date(data.timestamp)) / (1000 * 60);
          
          if (diffMinutes < 5) {
            setIsBackendConnected(true);
            setConnectionMode('real');
            
            // 실제 데이터로 업데이트
            if (data.soc) {
              const energyInWatt = (data.soc / 100) * 10000;
              setEnergyBalance(energyInWatt);
            }
            
            // WebSocket 연결
            if (socket) socket.connect();
            
            // 릴레이 상태 로드
            loadRelayStatus();
          } else {
            // 5분 이상 지난 데이터 -> 가상 모드
            setIsBackendConnected(false);
            setConnectionMode('virtual');
          }
        } else {
          setIsBackendConnected(false);
          setConnectionMode('virtual');
        }
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      console.log('Backend not connected, using virtual mode');
      setIsBackendConnected(false);
      setConnectionMode('virtual');
    }
  };

  // 백엔드에서 릴레이 상태 로드
  const loadRelayStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/relay/status`);
      if (response.ok) {
        const data = await response.json();
        setRelayStatus(data);
        
        // localStorage 동기화
        const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
        solarData.relays = data;
        localStorage.setItem('solarData', JSON.stringify(solarData));
      }
    } catch (error) {
      console.error('Failed to load relay status:', error);
    }
  };

  // 집 선택/해제
  const toggleHouse = (house) => {
    setSelectedHouses((prev) =>
      prev.includes(house)
        ? prev.filter((h) => h !== house)
        : [...prev, house]
    );
  };

  // 판매 처리
  const handleSell = async () => {
    if (selectedHouses.length === 0) {
      alert("판매할 가구를 선택해주세요!");
      return;
    }

    // 각 가구당 100W 판매
    const wattPerHouse = 100;
    const totalWatt = selectedHouses.length * wattPerHouse;
    const totalPrice = totalWatt * PRICE_PER_WATT;

    // 에너지 부족 확인
    if (energyBalance < totalWatt) {
      alert(`에너지가 부족합니다! (필요: ${totalWatt}W, 보유: ${energyBalance.toFixed(0)}W)`);
      return;
    }

    // 릴레이 상태 업데이트
    const newRelayStatus = { ...relayStatus };
    selectedHouses.forEach(house => {
      newRelayStatus[house] = true;
    });

    // 실제 모드: 백엔드로 릴레이 제어 명령 전송
    if (connectionMode === 'real' && isBackendConnected) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/control/relay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRelayStatus)
        });

        if (!response.ok) {
          throw new Error('Relay control failed');
        }
        
        console.log('✅ Relay command sent to backend');
      } catch (error) {
        console.error('Failed to control relay:', error);
        alert('⚠️ 백엔드 연결 실패, 가상 모드로 전환됩니다.');
        setConnectionMode('virtual');
        setIsBackendConnected(false);
      }
    }

    // 로컬 상태 업데이트 (실제/가상 모두)
    setRelayStatus(newRelayStatus);
    
    // 각 가구 에너지 증가
    const newHouseEnergy = { ...houseEnergy };
    selectedHouses.forEach(house => {
      newHouseEnergy[house] += wattPerHouse;
    });
    setHouseEnergy(newHouseEnergy);
    localStorage.setItem('houseEnergy', JSON.stringify(newHouseEnergy));
    
    // 에너지 차감
    const newEnergyBalance = energyBalance - totalWatt;
    setEnergyBalance(newEnergyBalance);

    // 현금 증가
    const newCashBalance = cashBalance + totalPrice;
    setCashBalance(newCashBalance);
    localStorage.setItem('cashBalance', newCashBalance.toString());

    // 거래 내역 추가
    const newTrade = {
      date: new Date().toLocaleString('ko-KR'),
      houses: selectedHouses.join(', '),
      watt: totalWatt,
      price: totalPrice
    };
    const newHistory = [newTrade, ...tradeHistory];
    setTradeHistory(newHistory);
    localStorage.setItem('tradeHistory', JSON.stringify(newHistory));

    // localStorage에 에너지 업데이트
    const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
    solarData.soc = (newEnergyBalance / 10000) * 100;
    solarData.relays = newRelayStatus;
    solarData.timestamp = new Date().toISOString();
    localStorage.setItem('solarData', JSON.stringify(solarData));

    // 실제 모드: 백엔드에 에너지 변경 사항 전송
    if (connectionMode === 'real' && isBackendConnected) {
      try {
        await fetch(`${BACKEND_URL}/api/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            soc: (newEnergyBalance / 10000) * 100,
            solar_w: solarData.solar_w || 0,
            lux: solarData.lux || 0
          })
        });
        console.log('✅ Energy data sent to backend');
      } catch (error) {
        console.error('Failed to update backend energy:', error);
      }
    }

    alert(
      `✅ 판매 완료!\n` +
      `판매 가구: ${selectedHouses.join(', ')}\n` +
      `전력: ${totalWatt}W\n` +
      `수익: +${totalPrice.toLocaleString()}원\n` +
      `모드: ${connectionMode === 'real' ? '실제 (백엔드 연동)' : '가상 (로컬)'}`
    );

    setSelectedHouses([]);
  };

  // 거래 내역 모두 지우기
  const clearHistory = () => {
    if (!window.confirm('모든 거래 내역을 삭제하시겠습니까?')) return;
    
    setTradeHistory([]);
    localStorage.setItem('tradeHistory', '[]');
    alert('거래 내역이 삭제되었습니다.');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
      {/* 연결 상태 표시 */}
      <div style={{ 
        padding: '10px', 
        marginBottom: '20px',
        backgroundColor: connectionMode === 'real' ? '#d4edda' : '#fff3cd',
        border: `1px solid ${connectionMode === 'real' ? '#c3e6cb' : '#ffeaa7'}`,
        borderRadius: '5px',
        textAlign: 'center'
      }}>
        {connectionMode === 'real' 
          ? '🟢 실제 모드 (백엔드 연결됨 - EnvSetting과 동기화)' 
          : '🟡 가상 모드 (로컬 데이터 사용 - EnvSetting과 동기화)'}
      </div>

      {/* 상단: 버튼 + 집 이미지 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
        <button 
          style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            backgroundColor: isHoverSell ? '#FFC700' : '#E0E0E0',
            border: 'none', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            fontSize: '18px', 
            color: '#222',
            marginBottom:'100px', 
            marginTop:'100px',
            transition: 'background-color 0.3s ease'
          }}
          onClick={handleSell}
          onMouseEnter={() => setIsHoverSell(true)}
          onMouseLeave={() => setIsHoverSell(false)}
        >
          SELL!
        </button>
        <div style={{ display: 'flex', gap: '20px' }}>
          {houses.map((house) => {
            const isSelected = selectedHouses.includes(house);
            return (
              <div key={house} style={{ textAlign: 'center' }}>
                <img
                  src={isSelected ? turnon : turnoff}
                  alt={house}
                  style={{ 
                    width: '100px', 
                    height: '80px', 
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleHouse(house)}
                />
                <p style={{ 
                  fontSize: '14px', 
                  color: '#333',
                  fontWeight: 'bold',
                  margin: '5px 0'
                }}>
                  {house}가구
                </p>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#FFB300',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  {houseEnergy[house].toLocaleString()}W
                </p>
                <p style={{ 
                  fontSize: '11px', 
                  color: '#999',
                  margin: 0
                }}>
                  {connectionMode === 'real' ? '(실시간)' : '(로컬)'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 내 에너지 현황 + 가상현금 잔고 */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1, padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
            내 에너지 현황
          </h2>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFB300', margin: 0 }}>
            {energyBalance.toLocaleString()} W
          </p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            {connectionMode === 'real' ? '실시간 데이터 (백엔드)' : '로컬 데이터'}
          </p>
        </div>
        <div style={{ flex: 1, padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
            가상현금 잔고
          </h2>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#82ca9d', margin: 0 }}>
            {cashBalance.toLocaleString()} ₩
          </p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            (1W = {PRICE_PER_WATT}원)
          </p>
        </div>
      </div>

      {/* 거래 내역 섹션 */}
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>
          거래 내역 ({tradeHistory.length}건)
        </h2>
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          overflowY: 'auto', 
          height: '200px', 
          padding: '15px', 
          marginBottom: '20px', 
          color: '#333',
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}>
          {tradeHistory.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>거래 내역이 없습니다.</p>
          ) : (
            tradeHistory.map((trade, index) => (
              <p key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                <strong>{trade.date}</strong><br />
                {trade.houses}가구 {trade.watt}W, 
                <span style={{ color: '#FFB300', fontWeight: 'bold' }}> +{trade.price.toLocaleString()}원</span>
              </p>
            ))
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={clearHistory}
            style={{ 
              width: '200px', 
              padding: '10px 0', 
              backgroundColor: '#FF5C5C', 
              border: 'none', 
              color: '#fff', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              fontSize: '16px',
              borderRadius: '5px'
            }}
          >
            거래내역 모두 지우기
          </button>
        </div>
      </div>
    </div>
  );
}

export default Trade;