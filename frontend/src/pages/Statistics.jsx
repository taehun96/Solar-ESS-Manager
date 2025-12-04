import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dataAPI } from '../api/dataAPI';
import { energyAPI } from '../api/energyAPI';
import { channelAPI } from '../api/channelAPI';
import { usePolling } from '../hooks/usePolling';

const DUMMY_HOURLY_DATA = [
  { hour: '00시', 오늘: 5, 어제: 4 },
  { hour: '06시', 오늘: 8, 어제: 7 },
  { hour: '12시', 오늘: 15, 어제: 12 },
  { hour: '18시', 오늘: 12, 어제: 10 },
  { hour: '24시', 오늘: 6, 어제: 5 },
];

function Statistics() {
  const [connectionMode, setConnectionMode] = useState('virtual');
  const [optimal, setOptimal] = useState({ A: 0, B: 0, C: 0, D: 0 });
  const [predictedEnergies, setPredictedEnergies] = useState([0, 0, 0]);
  const [currentLux, setCurrentLux] = useState(0);

  const { data: sensorData, error: sensorError } = usePolling(
    dataAPI.getLatest,
    10000,
    connectionMode === 'real'
  );

  const { data: hourlyData } = usePolling(
    () => dataAPI.getHourly(24),
    30000,
    connectionMode === 'real'
  );

  useEffect(() => {
    checkBackendConnection();
  }, []);

  useEffect(() => {
    if (sensorError) {
      setConnectionMode('virtual');
    }
  }, [sensorError]);

  useEffect(() => {
    if (connectionMode === 'real' && sensorData) {
      setCurrentLux(sensorData.lux || 0);
      fetchOptimalChannels();
      fetchPredictedMultiEnergy(sensorData.lux || 0);
    }
  }, [sensorData, connectionMode]);

  const checkBackendConnection = async () => {
    try {
      const data = await dataAPI.getLatest();
      if (data.timestamp) {
        const diffMinutes = (new Date() - new Date(data.timestamp)) / (1000 * 60);
        if (diffMinutes < 5) {
          setConnectionMode('real');
          setCurrentLux(data.lux || 0);
          fetchOptimalChannels();
          fetchPredictedMultiEnergy(data.lux || 0);
        } else {
          setConnectionMode('virtual');
        }
      } else {
        setConnectionMode('virtual');
      }
    } catch {
      setConnectionMode('virtual');
    }
  };

  const fetchOptimalChannels = async () => {
    try {
      const houseEnergy = JSON.parse(localStorage.getItem('houseEnergy') || '{}');
      const totalTarget = Object.values(houseEnergy).reduce((sum, val) => sum + val, 0);

      const result = await channelAPI.getOptimal(totalTarget);
      if (result.optimal_channels) {
        setOptimal(result.optimal_channels);
      }
    } catch (error) {
      console.error('Failed to fetch optimal channels:', error);
      setOptimal({ A: 10, B: 3, C: 5, D: 2 });
    }
  };

  const fetchPredictedMultiEnergy = async (lux) => {
    try {
      const result = await energyAPI.getPredictedMulti(lux);
      if (result && result.predicted_energies) {
        setPredictedEnergies(result.predicted_energies);
      } else {
         setPredictedEnergies([10, 15, 20]);
      }
    } catch (error) {
      console.error('Failed to fetch predicted energy:', error);
      setPredictedEnergies([10, 15, 20]);
    }
  };

  const formatHourlyData = () => {
    if (connectionMode === 'real' && hourlyData && Array.isArray(hourlyData)) {
      return hourlyData.map(item => ({
        hour: new Date(item.timestamp).getHours() + '시',
        오늘: item.solar_w || 0,
        어제: (item.solar_w || 0) * 0.9,
      }));
    }
    return DUMMY_HOURLY_DATA;
  };

  // 변경됨: 가구별 단순 총량 데이터 포맷 (막대 4개용)
  const formatEnergyData = () => {
    const houseEnergy = JSON.parse(localStorage.getItem('houseEnergy') || '{}');
    
    // 데이터가 없으면 0으로 처리
    const A = houseEnergy.A || 0;
    const B = houseEnergy.B || 0;
    const C = houseEnergy.C || 0;
    const D = houseEnergy.D || 0;

    return [
      { name: 'A가구', value: A, fill: '#FFD900' },
      { name: 'B가구', value: B, fill: '#82ca9d' },
      { name: 'C가구', value: C, fill: '#DCDCDC' },
      { name: 'D가구', value: D, fill: '#515151' },
    ];
  };

  const luxToInsolation = (lux) => {
    return (lux * 0.0079 * 0.0036).toFixed(2);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Connection Status */}
      <div style={{
        padding: '10px',
        marginBottom: '20px',
        backgroundColor: connectionMode === 'real' ? '#d4edda' : '#fff3cd',
        border: `1px solid ${connectionMode === 'real' ? '#c3e6cb' : '#ffeaa7'}`,
        borderRadius: '5px',
        textAlign: 'center'
      }}>
        {connectionMode === 'real'
          ? '🟢 실제 모드 (백엔드 연결됨 - ML 모델 예측 사용)'
          : '🟡 가상 모드 (더미 데이터 사용)'}
      </div>

      {/* 일사량 정보 */}
      <div style={{ marginBottom: '60px', padding: '20px', backgroundColor: '#f8f9fa' }}>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
          {connectionMode === 'real' ? '실시간 센서 데이터' : '가상 데이터'}
        </p>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          조도: {currentLux.toLocaleString()} lux → 일사량: {luxToInsolation(currentLux)} MJ/㎡
        </p>
        {connectionMode === 'real' && (
          <p style={{ fontSize: '16px', color: '#666', marginTop: '10px' }}>
            ML 모델 예측 발전량: 1시간 뒤 {predictedEnergies[0]}W, 2시간 뒤 {predictedEnergies[1]}W, 3시간 뒤 {predictedEnergies[2]}W
          </p>
        )}
        {connectionMode === 'virtual' && (
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            * 백엔드 서버에 연결하면 실제 센서 데이터와 ML 모델 예측값을 확인할 수 있습니다
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* 변경됨: 가구별 총 판매량 차트 (막대 4개) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#333'
          }}>
            각 가구별 현재 판매 누적량
            {connectionMode === 'real' && <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>(실시간 데이터)</span>}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatEnergyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Watt', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {/* 셀(Cell)을 사용하여 각 막대별 색상 지정 */}
              <Bar dataKey="value" name="판매량">
                {formatEnergyData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 시간대별 에너지 축적량 차트 */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#333'
          }}>
            시간대별 에너지 축적량 차트 (오늘 vs 어제)
            {connectionMode === 'real' && <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>(DB 데이터)</span>}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatHourlyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis label={{ value: 'Watt', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="오늘"
                stroke="#FFD900"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="어제"
                stroke="#DCDCDC"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p style={{
            marginTop: '10px',
            fontSize: '14px',
            color: '#666',
            textAlign: 'center'
          }}>
            * 매일 00시에 초기화됩니다
          </p>
        </div>
      </div>
    </div>
  );
}

export default Statistics;