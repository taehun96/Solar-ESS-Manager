import { useState } from 'react';

function Arduino() {
  const [arduPage, setArduPage] = useState('circuits');

  const buttonStyle = (active) => ({
    backgroundColor: active ? "#FFD900" : "#F0F0F0",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: active ? "bold" : "normal",
    margin: "0 5px",
    transition: "0.3s",
  });

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  };

  const tabContainerStyle = {
    display: "flex",
    justifyContent: "center",
    margin: "20px 0",
  };

  const contentStyle = {
    backgroundColor: "#F8F8F8",
    width: "79%",
    minHeight: "700px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  };

  return (
    <div style={containerStyle}>
      {/* Tab Buttons */}
      <div style={tabContainerStyle}>
        <button
          onClick={() => setArduPage('circuits')}
          style={buttonStyle(arduPage === 'circuits')}
        >
          CIRCUITS
        </button>
        <button
          onClick={() => setArduPage('video')}
          style={buttonStyle(arduPage === 'video')}
        >
          VIDEO
        </button>
        <button
          onClick={() => setArduPage('flowchart')}
          style={buttonStyle(arduPage === 'flowchart')}
        >
          FLOWCHART
        </button>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {arduPage === 'circuits' && <h2>CIRCUITS</h2>}
        {arduPage === 'video' && <h2>VIDEO</h2>}
        {arduPage === 'flowchart' && <h2>FLOWCHART</h2>}
      </div>

      {/* Extra Info */}
      <div>
        <p>Additional Information Here</p>
      </div>
    </div>
  );
}

export default Arduino;
