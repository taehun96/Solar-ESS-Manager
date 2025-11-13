import { useState } from 'react';

function EnvSetting() {
  const [settPage, setEnvPage] = useState('none');

  // toggle function
  const toggleManual = () => {
    setEnvPage(prev => (prev === 'none' ? 'setting' : 'none'));
  };

  return (
    <div>
      <h1>Environment<br />Setting</h1>
      <p>아두이노와 연결하지 못하는 환경에서 가상으로 값을 설정해 진행할 수 있게 하는 페이지</p>
      <p>아두이노를 사용할 거라면 테더링/연결하는 페이지</p>

      <div>
        <button>clean environment</button>
        <p></p>
        <button>connect arduino</button>
        <p></p>
        <button>start virtual environment auto</button>
        <p></p>
        <button onClick={toggleManual}>
          start virtual environment manually
        </button>

        <div style={{ margin: "0px", width: "500px", height: "500px" }}>
          {settPage === 'none' && (
            <div>
            </div>
          )}

          {settPage === 'setting' && (
            <div>
              <h2> Setting </h2>
              <input type='text'></input>
              <button>에너지 잔고량</button>
              <p></p>

              <input type='text'></input>
              <button>현금 잔고량</button>
              <p></p>

              <input type='text'></input>
              <button>A가구 전력량</button>
              <p></p>

              <input type='text'></input>
              <button>B가구 전력량</button>
              <p></p>

              <input type='text'></input>
              <button>C가구 전력량</button>
              <p></p>

              <button>통계 정보 기본값으로 채우기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnvSetting;
