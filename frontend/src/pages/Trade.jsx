import React, { useState } from "react";

function Trade() {
  const [selectedHouses, setSelectedHouses] = useState([]);

  const houses = ["A", "B", "C"];

  const toggleHouse = (house) => {
    setSelectedHouses((prev) =>
      prev.includes(house)
        ? prev.filter((h) => h !== house)
        : [...prev, house]
    );
  };

  const handleSell = () => {
    if (selectedHouses.length === 0) {
      alert("판매할 가구를 선택해주세요!");
      return;
    }
    alert(`${selectedHouses.join(", ")} 가구에게 판매했습니다!`);
    setSelectedHouses([]); // 선택 초기화
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>

      {/* 상단: 내 에너지 현황 + 가상현금 잔고 */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1, padding: '20px',  textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
            내 에너지 현황
          </h2>
          <div style={{ width: '100%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '28px',fontWeight: 'bold', color: '#FFB300', margin: 0 }}>10,020 W</p>
          </div>
        </div>

        <div style={{ flex: 1, padding: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
            가상현금 잔고
          </h2>
          <div style={{ width: '100%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '28px',fontWeight: 'bold', color: '#82ca9d', margin: 0 }}>48,020 ₩</p>
          </div>
        </div>
      </div>

      {/* 거래 기능 섹션 */}
      <div style={{padding: '20px' }}>
        <h2 style={{ display:'flex', justifyContent:'center', fontSize: '18px', fontWeight: 'bold', marginTop:'40px', marginBottom:'40px', color: '#333' }}>
          현재 판매가능 포트 목록
        </h2>

        {/* 가구 선택 체크박스 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px' }}>
          {houses.map((house) => (
            <label key={house} style={{ display: 'flex', alignItems: 'center', fontSize: '16px', cursor: 'pointer', gap: '8px', color: '#333' }}>
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', accentColor: '#FFB300' }}
                checked={selectedHouses.includes(house)}
                onChange={() => toggleHouse(house)}
              />
              {house} 가구
            </label>
          ))}
        </div>

        {/* SELL 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            style={{ width: '200px', padding: '10px 0', backgroundColor: '#FFC700', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', color: '#222' }}
            onClick={handleSell}
          >
            SELL
          </button>
        </div>

        {/* 거래 내역 */}
        <div style={{ backgroundColor: '#F8F9FA', overflowY: 'auto', display: 'flex', flexDirection: 'column', height: '200px', padding: '10px', marginBottom: '20px', color: '#333' }}>
          <p>2025-11-11 A가구 100W, <span style={{ color: '#FFB300', fontWeight: 'bold' }}>+14,000원</span></p> 
          <p>2025-11-11 A가구 100W, <span style={{ color: '#FFB300', fontWeight: 'bold' }}>+14,000원</span></p> 
          <p>2025-11-11 A가구 100W, <span style={{ color: '#FFB300', fontWeight: 'bold' }}>+14,000원</span></p>
        </div>

        {/* 거래내역 모두 지우기 버튼 */}
        <div style={{ textAlign: 'center' }}>
          <button style={{ width: '200px', padding: '10px 0', backgroundColor: '#FF5C5C', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
            거래내역 모두 지우기
          </button>
        </div>
      </div>
    </div>
  );
}

export default Trade;
