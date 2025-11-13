import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 임시 더미 데이터 - 나중에 백엔드에서 받아올 데이터
const DUMMY_ENERGY_DATA = [
  { time: '00:00', A가구: 12, B가구: 8 },
  { time: '03:00', A가구: 10, B가구: 6 },
  { time: '06:00', A가구: 15, B가구: 10 },
  { time: '09:00', A가구: 20, B가구: 15 },
  { time: '12:00', A가구: 25, B가구: 18 },
  { time: '15:00', A가구: 22, B가구: 16 },
  { time: '18:00', A가구: 18, B가구: 12 },
  { time: '21:00', A가구: 14, B가구: 9 },
];

const DUMMY_HOURLY_DATA = [
  { hour: '00시', 오늘: 5, 어제: 4 },
  { hour: '06시', 오늘: 8, 어제: 7 },
  { hour: '12시', 오늘: 15, 어제: 12 },
  { hour: '18시', 오늘: 12, 어제: 10 },
  { hour: '24시', 오늘: 6, 어제: 5 },
];

function Statistics() {
  // 나중에 백엔드 연결할 때 여기만 수정하면 됨!
  // const [energyData, setEnergyData] = useState(DUMMY_ENERGY_DATA);
  // const [hourlyData, setHourlyData] = useState(DUMMY_HOURLY_DATA);
  // const [optimal, setOptimal] = useState({ A: 10, B: 3 });
  
  // useEffect(() => {
  //   // 백엔드에서 데이터 가져오기
  //   fetch('/api/energy-data')
  //     .then(res => res.json())
  //     .then(data => {
  //       setEnergyData(data.energyData);
  //       setHourlyData(data.hourlyData);
  //       setOptimal(data.optimal);
  //     });
  // }, []);

  const energyData = DUMMY_ENERGY_DATA;
  const hourlyData = DUMMY_HOURLY_DATA;
  const optimal = { A: 10, B: 3 };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
      {/* 최적 조합 안내 */}
      <div style={{ marginBottom: '60px', padding: '20px', backgroundColor: '#f8f9fa' }}>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
          현재 최적의 판매 조합은...
        </p>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          A가구에 {optimal.A}와트, B가구에 {optimal.B}와트
        </p>
      </div>

      {/* 가구별 에너지 보유량 차트 */}
      <div style={{ 
        backgroundColor: '#FFFFFF', 
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          color: '#333'
        }}>
          가구별 에너지 보유량 차트
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis label={{ value: 'Watt', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="A가구" fill="#FFD900" />
            <Bar dataKey="B가구" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 시간대별 에너지 축적량 차트 */}
      <div style={{ 
        backgroundColor: '#FFFFFF', 
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          color: '#333'
        }}>
          시간대별 에너지 축적량 차트 (오늘 vs 어제)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hourlyData}>
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
  );
}

export default Statistics;