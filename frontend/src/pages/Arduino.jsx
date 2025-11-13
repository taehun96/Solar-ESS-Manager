import { useState } from 'react';

function Arduino() {
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
      <div style={{ display: "flex", justifyContent: "center", backgroundColor: "#DCDCDC", width: "500px" }}>
        <button
          onClick={() => setArduPage('circuits')}
          style={{ ...buttonStyle, backgroundColor: arduPage === 'circuits' ? "#FFD900" : "#DCDCDC" }}>
          CIRCUITS
        </button>
        <button
          onClick={() => setArduPage('video')}
          style={{ ...buttonStyle, backgroundColor: arduPage === 'video' ? "#FFD900" : "#DCDCDC" }}>
          VIDEO
        </button>
        <button
          onClick={() => setArduPage('flowchart')}
          style={{ ...buttonStyle, backgroundColor: arduPage === 'flowchart' ? "#FFD900" : "#DCDCDC" }}>
          FLOWCHART
        </button>
      </div>
      <div style={{ margin: "0px", backgroundColor: "#DCDCDC", width: "500px", height: "500px" }}>
        {arduPage === 'circuits' && (
          <div>
            <h1>CIRCUITS</h1>
          </div>
        )}

        {arduPage === 'video' && (
          <div>
            <h1>VIDEO</h1>
          </div>
        )}

        {arduPage === 'flowchart' && (
          <div>
            <h1>FLOWCHART</h1>
          </div>
        )}
      </div>
      <div>
        <p>aaaaa</p>
      </div>
    </div>
  );
}

export default Arduino;