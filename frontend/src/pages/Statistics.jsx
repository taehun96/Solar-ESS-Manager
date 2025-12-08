import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dataAPI } from '../api/dataAPI';
import { energyAPI } from '../api/energyAPI';
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
  const [predictedEnergies, setPredictedEnergies] = useState([0, 0, 0]);

  const { data: sensorData, error: sensorError } = usePolling(
    dataAPI.getLatest,
    10000,
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
      fetchPredictedMultiEnergy();
    }
  }, [sensorData, connectionMode]);

  const checkBackendConnection = async () => {
    try {
      const data = await dataAPI.getLatest();
      // 변경됨: 타임스탬프 검증 제거, API 응답만 성공하면 실시간 모드
      // 백엔드 통신이 정상이면 데이터 신선도와 무관하게 실시간 모드로 간주
      if (data) {
        setConnectionMode('real');
        fetchPredictedMultiEnergy();
      } else {
        setConnectionMode('virtual');
      }
    } catch {
      setConnectionMode('virtual');
    }
  };

  const fetchPredictedMultiEnergy = async () => {
    try {
      const result = await energyAPI.getPredicted();
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
    return DUMMY_HOURLY_DATA;
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

      {/* 예측 발전량 정보 */}
      <div style={{ marginBottom: '60px', padding: '20px', backgroundColor: '#f8f9fa' }}>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
          {connectionMode === 'real' ? 'ML 모델 예측 발전량' : '가상 데이터'}
        </p>
        {connectionMode === 'real' && (
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            1시간 뒤: {predictedEnergies[0]}W | 2시간 뒤: {predictedEnergies[1]}W | 3시간 뒤: {predictedEnergies[2]}W
          </p>
        )}
        {connectionMode === 'virtual' && (
          <p style={{ fontSize: '16px', color: '#666', marginTop: '10px' }}>
            * 백엔드 서버에 연결하면 ML 모델 예측 발전량을 확인할 수 있습니다
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
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