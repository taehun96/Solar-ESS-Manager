import { useState, useEffect } from "react";
import { dataAPI } from '../api/dataAPI';
import { relayAPI } from '../api/relayAPI';
import { channelAPI } from '../api/channelAPI';
import { usePolling } from '../hooks/usePolling';
import turnoff from '../assets/turnoff.png';
import turnon from '../assets/turnon.png';

function Trade() {
  const [selectedHouses, setSelectedHouses] = useState([]);
  const [relayStatus, setRelayStatus] = useState({ A: false, B: false, C: false, D: false });
  const [energyBalance, setEnergyBalance] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [connectionMode, setConnectionMode] = useState('virtual');
  const [houseEnergy, setHouseEnergy] = useState({ A: 0.6, B: 1.55, C: 0.93, D: 0.61 });
  const [isHoverSell, setIsHoverSell] = useState(false);
  const [isHoverReset, setIsHoverReset] = useState(false);
  const [optimal, setOptimal] = useState({ A: 0, B: 0, C: 0, D: 0 });

  const houses = ["A", "B", "C", "D"];
  const PRICE_PER_WATT = 140;

  const { data: sensorData, error: sensorError } = usePolling(
    dataAPI.getLatest,
    10000,
    connectionMode === 'real'
  );

  const { data: backendRelayStatus } = usePolling(
    relayAPI.getStatus,
    10000,
    connectionMode === 'real'
  );

  useEffect(() => {
    loadLocalData();
    checkBackendConnection();
    fetchOptimalChannels();
  }, []);

  useEffect(() => {
    if (sensorError) {
      setConnectionMode('virtual');
    }
  }, [sensorError]);

  useEffect(() => {
    if (connectionMode === 'real' && sensorData) {
      if (sensorData.soc !== undefined) {
        const energyInWatt = (sensorData.soc / 100) * 10000;
        setEnergyBalance(energyInWatt);

        const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
        solarData.soc = sensorData.soc;
        solarData.solar_w = sensorData.solar_w;
        solarData.lux = sensorData.lux;
        localStorage.setItem('solarData', JSON.stringify(solarData));
      }
    }
  }, [sensorData, connectionMode]);

  useEffect(() => {
    if (connectionMode === 'real' && backendRelayStatus) {
      setRelayStatus(backendRelayStatus);

      const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
      solarData.relays = backendRelayStatus;
      localStorage.setItem('solarData', JSON.stringify(solarData));
    }
  }, [backendRelayStatus, connectionMode]);

  const fetchOptimalChannels = async () => {
    try {
      const houseEnergy = JSON.parse(localStorage.getItem('houseEnergy') || '{}');
      const totalTarget = Object.values(houseEnergy).reduce((sum, val) => sum + val, 0);

      const result = await channelAPI.getOptimal(totalTarget);
      if (result.channels) {
        // 서버에서 ["A", "C", "D"] 형식으로 반환
        // 이를 { A: 1, B: 0, C: 1, D: 1 } 형식으로 변환
        const optimalObj = { A: 0, B: 0, C: 0, D: 0 };
        result.channels.forEach(channel => {
          optimalObj[channel] = 1;
        });
        setOptimal(optimalObj);
      }
    } catch (error) {
      console.error('Failed to fetch optimal channels:', error);
      setOptimal({ A: 0, B: 0, C: 0, D: 0 });
    }
  };

  const loadLocalData = () => {
    const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
    if (solarData.soc) {
      const energyInWatt = (solarData.soc / 100) * 10000;
      setEnergyBalance(energyInWatt);
    }

    if (solarData.relays) setRelayStatus(solarData.relays);

    // EnvSetting에서 설정한 값이 있으면 사용, 없으면 기본값
    const savedHouseEnergy = JSON.parse(localStorage.getItem('houseEnergy') || '{}');
    const defaultEnergy = { A: 0.6, B: 1.55, C: 0.93, D: 0.61 };

    // localStorage 값이 있으면 사용, 없으면 기본값 사용 (저장은 하지 않음)
    const currentEnergy = Object.keys(savedHouseEnergy).length > 0 ? savedHouseEnergy : defaultEnergy;
    setHouseEnergy(currentEnergy);

    const savedCash = localStorage.getItem('cashBalance');
    setCashBalance(savedCash ? parseFloat(savedCash) : 48020);

    const savedHistory = JSON.parse(localStorage.getItem('tradeHistory') || '[]');
    setTradeHistory(savedHistory);
  };

  const checkBackendConnection = async () => {
    try {
      const data = await dataAPI.getLatest();

      // 변경됨: 타임스탬프 검증 제거, API 응답만 성공하면 실시간 모드
      // 백엔드 통신이 정상이면 데이터 신선도와 무관하게 실시간 모드로 간주
      if (data) {
        setConnectionMode('real');

        if (data.soc !== undefined) {
          const energyInWatt = (data.soc / 100) * 10000;
          setEnergyBalance(energyInWatt);
        }

        const relayData = await relayAPI.getStatus();
        setRelayStatus(relayData);
      } else {
        setConnectionMode('virtual');
      }
    } catch {
      setConnectionMode('virtual');
    }
  };

  const toggleHouse = (house) => {
    setSelectedHouses((prev) =>
      prev.includes(house) ? prev.filter(h => h !== house) : [...prev, house]
    );
  };

  const handleSell = async () => {
    if (selectedHouses.length === 0) {
      alert("판매할 가구를 선택해주세요!");
      return;
    }

    const wattPerHouse = 100;
    const totalWatt = selectedHouses.length * wattPerHouse;
    const totalPrice = totalWatt * PRICE_PER_WATT;

    if (energyBalance < totalWatt) {
      alert(`에너지가 부족합니다! (필요: ${totalWatt}W, 보유: ${energyBalance.toFixed(0)}W)`);
      return;
    }

    const newRelayStatus = { ...relayStatus };
    selectedHouses.forEach(h => newRelayStatus[h] = true);

    if (connectionMode === 'real') {
      try {
        // 백엔드 형식에 맞게 전송: {A: true, B: false, C: false, D: false}
        await relayAPI.control(newRelayStatus);
      } catch {
        alert('⚠️ 백엔드 연결 실패, 가상 모드로 전환됩니다.');
        setConnectionMode('virtual');
      }
    }

    setRelayStatus(newRelayStatus);

    const newHouseEnergy = { ...houseEnergy };
    selectedHouses.forEach(h => newHouseEnergy[h] += wattPerHouse);
    setHouseEnergy(newHouseEnergy);
    localStorage.setItem('houseEnergy', JSON.stringify(newHouseEnergy));

    const newEnergyBalance = energyBalance - totalWatt;
    setEnergyBalance(newEnergyBalance);

    const newCashBalance = cashBalance + totalPrice;
    setCashBalance(newCashBalance);
    localStorage.setItem('cashBalance', newCashBalance.toString());

    const newTrade = {
      date: new Date().toLocaleString('ko-KR'),
      houses: selectedHouses.join(', '),
      watt: totalWatt,
      price: totalPrice
    };

    const newHistory = [newTrade, ...tradeHistory];
    setTradeHistory(newHistory);
    localStorage.setItem('tradeHistory', JSON.stringify(newHistory));

    const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
    const newSoc = (newEnergyBalance / 10000) * 100;
    solarData.soc = newSoc;
    solarData.relays = newRelayStatus;
    localStorage.setItem('solarData', JSON.stringify(solarData));

    // 실시간 모드일 때만 백엔드에 SOC 업데이트
    if (connectionMode === 'real') {
      try {
        await dataAPI.updateSolar(
          newSoc,
          solarData.solar_w || 0,
          solarData.lux || 0
        );
      } catch (error) {
        console.error('백엔드 SOC 업데이트 실패:', error);
        // 에러가 나도 로컬 거래는 완료된 상태 유지
      }
    }

    alert(
      `✅ 판매 완료!\n` +
      `판매 가구: ${selectedHouses.join(', ')}\n` +
      `전력: ${totalWatt}W\n` +
      `수익: +${totalPrice.toLocaleString()}원\n` +
      `모드: ${connectionMode === 'real' ? '실제' : '가상'}`
    );

    setSelectedHouses([]);
  };

  const clearHistory = () => {
    if (!window.confirm('모든 거래 내역을 삭제하시겠습니까?')) return;
    setTradeHistory([]);
    localStorage.setItem('tradeHistory', '[]');
    alert('거래 내역이 삭제되었습니다.');
  };

  // 리셋 버튼 추가
  const resetAllRelays = async () => {
    if (!window.confirm('모든 릴레이를 OFF 하시겠습니까?')) return;

    const allOffStatus = { A: false, B: false, C: false, D: false };

    if (connectionMode === 'real') {
      try {
        await relayAPI.control(allOffStatus);
      } catch {
        alert('⚠️ 백엔드 연결 실패, 가상 모드로 전환됩니다.');
        setConnectionMode('virtual');
      }
    }

    setRelayStatus(allOffStatus);

    const solarData = JSON.parse(localStorage.getItem('solarData') || '{}');
    solarData.relays = allOffStatus;
    solarData.timestamp = new Date().toISOString();
    localStorage.setItem('solarData', JSON.stringify(solarData));

    alert('✅ 모든 릴레이가 OFF 되었습니다.');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
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

      <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold', color: '#555' }}>
        최적의 판매 가구조합은 각 가구 위의 전구로 표시됩니다!
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '50px', marginTop: '100px' }}>
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
              transition: 'background-color 0.3s ease'
            }}
            onClick={handleSell}
            onMouseEnter={() => setIsHoverSell(true)}
            onMouseLeave={() => setIsHoverSell(false)}
          >
            SELL!
          </button>
          {/* 리셋 버튼 추가 */}
          <button
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: isHoverReset ? '#FF5C5C' : '#E0E0E0',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '18px',
              color: isHoverReset ? '#FFF' : '#222',
              transition: 'background-color 0.3s ease, color 0.3s ease'
            }}
            onClick={resetAllRelays}
            onMouseEnter={() => setIsHoverReset(true)}
            onMouseLeave={() => setIsHoverReset(false)}
          >
            RESET
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {houses.map((house) => {
            const isSelected = selectedHouses.includes(house);
            const isOptimal = optimal[house] > 0;
            
            return (
              <div 
                key={house} 
                style={{ 
                  textAlign: 'center' 
                  // 수정됨: 불투명도(opacity) 조절 스타일 삭제. 
                  // 이제 모든 가구가 선명하게 보입니다.
                }}
              >
                {/* 최적 조합인 경우에만 전구 아이콘 표시 */}
                <div style={{ height: '30px', fontSize: '24px', marginBottom: '5px' }}>
                  {isOptimal ? '💡' : ''}
                </div>
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