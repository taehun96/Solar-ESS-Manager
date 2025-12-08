import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import turnon from '../assets/yellow_gray.png';
import './Home.css';

function Home() {
  const [currentSection, setCurrentSection] = useState(0);
  const [direction, setDirection] = useState(0);
  const sectionsCount = 7;

  useEffect(() => {
    let accumulatedDelta = 0;
    let isScrolling = false;
    const threshold = 100;

    const handleWheel = (e) => {
      if (isScrolling) return;
      e.preventDefault();

      accumulatedDelta += e.deltaY;

      if (Math.abs(accumulatedDelta) > threshold) {
        isScrolling = true;
        if (accumulatedDelta > 0 && currentSection < sectionsCount - 1) {
          setDirection(1);
          setCurrentSection(prev => prev + 1);
        } else if (accumulatedDelta < 0 && currentSection > 0) {
          setDirection(-1);
          setCurrentSection(prev => prev - 1);
        }
        accumulatedDelta = 0;
        setTimeout(() => { isScrolling = false; }, 1200);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentSection]);

  const fadeInUpSlow = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 1, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: { duration: 0.6, ease: "easeIn" }
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      y: dir > 0 ? "100%" : "-100%",
      opacity: 0
    }),
    center: {
      y: "0%",
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    },
    exit: (dir) => ({
      y: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: { duration: 0.8, ease: "easeIn" }
    })
  };

  const sections = [
    {
      id: 0,
      content: (
        <div className="content-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '60px' }}>
          <motion.h1
            key="title-0"
            initial="hidden"
            animate="visible"
            variants={fadeInUpSlow}
            className="hero-title"
            style={{ fontSize: '48px', marginTop: '40px' }}
          >
            What is <span className="highlight">Solar ESS Manager?</span>
          </motion.h1>
          <motion.img
            key="img-0"
            className="hero-img"
            src={turnon}
            alt="yellow_gray"
            style={{
              filter: 'drop-shadow(0 25px 35px rgba(255, 217, 0, 0.3))',
              maxWidth: '400px'
            }}
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      )
    },
    {
      id: 1,
      content: (
        <div className="content-container">
          <div className="info-box" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3>INTRODUCING <span className="highlight">S.E.M</span></h3>

            <div style={{
              padding: '30px',
              backgroundColor: '#FFF9E6',
              borderRadius: '10px',
              border: '2px solid #FFD900',
              marginTop: '30px'
            }}>
              <h4 style={{ fontSize: '20px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>
                Solar Energy Manager (S.E.M)
              </h4>

              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '16px', color: '#555', lineHeight: '2', marginBottom: '25px' }}>
                  태양광 발전을 통해 생산된 에너지를 효율적으로 저장하고 관리하는 것은 지속 가능한 에너지 사용의 핵심입니다.
                </p>
                <p style={{ fontSize: '16px', color: '#555', lineHeight: '2', marginBottom: '25px' }}>
                  S.E.M은 ESS(Energy Storage System)에 저장된 태양광 에너지를 실시간으로 모니터링하고,
                  머신러닝 기반 예측 알고리즘을 통해 각 가구의 전력 수요를 분석하여 최적의 에너지 분배를 자동으로 수행합니다.
                </p>
                <p style={{ fontSize: '16px', color: '#555', lineHeight: '2' }}>
                  아두이노 센서를 통한 실시간 데이터 수집, Flask 기반 백엔드 서버, LSTM 딥러닝 모델,
                  그리고 React 기반의 직관적인 사용자 인터페이스가 하나의 시스템으로 통합되어
                  스마트한 에너지 관리 경험을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      content: (
        <div className="content-container">
          <div className="info-box" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3>프로젝트 개요</h3>

            <div style={{ display: 'flex', gap: '40px', marginTop: '40px', justifyContent: 'center', alignItems: 'flex-start' }}>
              <div style={{
                flex: 1,
                padding: '25px',
                backgroundColor: '#fff5f5',
                borderRadius: '10px',
                border: '2px solid #FF5C5C',
                textAlign: 'left'
              }}>
                <h4 style={{ color: '#FF5C5C', marginBottom: '20px', fontSize: '18px' }}>기존 문제점</h4>
                <ul style={{ lineHeight: '2', color: '#666', fontSize: '14px' }}>
                  <li>태양광 에너지 생산량의 불규칙성</li>
                  <li>각 가구별 전력 수요 패턴 파악 어려움</li>
                  <li>비효율적인 수동 전력 분배</li>
                  <li>남은 에너지 관리 미흡</li>
                </ul>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', fontSize: '40px', color: '#FFD900' }}>
                →
              </div>

              <div style={{
                flex: 1,
                padding: '25px',
                backgroundColor: '#f0f9f4',
                borderRadius: '10px',
                border: '2px solid #82ca9d',
                textAlign: 'left'
              }}>
                <h4 style={{ color: '#82ca9d', marginBottom: '20px', fontSize: '18px' }}>S.E.M 솔루션</h4>
                <ul style={{ lineHeight: '2', color: '#666', fontSize: '14px' }}>
                  <li>ML 모델 기반 시간대별 발전량 예측</li>
                  <li>실시간 센서 데이터 수집</li>
                  <li>최적 분배 알고리즘</li>
                  <li>가구별 맞춤형 전력 공급</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '40px', padding: '25px', backgroundColor: '#FFF9E6', borderRadius: '10px', border: '2px solid #FFD900' }}>
              <h4 style={{ marginBottom: '15px', color: '#333', fontSize: '18px' }}>주요 성과</h4>
              <p style={{ color: '#666', lineHeight: '1.8', fontSize: '15px' }}>
                LSTM 딥러닝 모델을 활용한 발전량 예측 시스템 구축<br />
                100% 자동화된 에너지 분배 프로세스 구현<br />
                실시간 모니터링 및 최적화 기능 제공
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      content: (
        <div className="content-container">
          <div className="info-box" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3>기술 스택 및 시스템 구조</h3>

            <div style={{ marginTop: '30px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#FFD900' }}>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>분류</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>기술</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}><strong>Frontend</strong></td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>React, Recharts, Framer Motion</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}><strong>Backend</strong></td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Flask, SQLite, REST API</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}><strong>ML/AI</strong></td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Python, TensorFlow, LSTM, Pandas</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}><strong>Hardware</strong></td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>Arduino, Sensors (LUX, Voltage)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px' }}><strong>Language</strong></td>
                    <td style={{ padding: '12px' }}>JavaScript, Python</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: '2' }}>
                🔌 Arduino (센서) → 🖥️ Flask Server (API, DB) → 🤖 ML Model → 💻 React Client
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      content: (
        <div className="content-container">
          <div className="info-box" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h3>팀 소개 | Watt's Up?</h3>

            <div style={{ marginTop: '30px', padding: '25px', backgroundColor: '#FFF9E6', borderRadius: '10px', borderLeft: '4px solid #FFD900' }}>
              <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
                <strong>"What's Up?"</strong> 이라는 문장과 전력 단위 <strong>"Watt"</strong>을 더한 재치있는 말장난으로,<br />
                전력관리의 효율성을 잡겠다는 패기가 담긴 이름입니다.
              </p>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.8', marginBottom: '15px' }}>
                지속 가능한 에너지 사용 문화를 확산하고,<br />
                AI 기술을 통해 에너지 자립을 실현하는 것이 우리의 목표입니다.
              </p>
              <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.8' }}>
                태양광 에너지의 효율을 최대화하고, 실시간 데이터 기반의 의사결정을 지원하며,<br />
                사용자 친화적인 에너지 관리 시스템을 구현합니다.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      content: (
        <div className="content-container">
          <div className="info-box" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h3>팀원 소개</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '30px' }}>
              <a
                href="https://github.com/Q5dis"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '2px solid #FFD900',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h4 style={{ color: '#333', marginBottom: '5px' }}>오왕경</h4>
                <p style={{ fontSize: '12px', color: '#FFD900', fontWeight: 'bold', marginBottom: '10px' }}>팀장 / 프론트엔드</p>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', textAlign: 'left' }}>
                  • React UI/UX 설계<br />
                  • 실시간 차트 구현<br />
                  • 반응형 디자인
                </div>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>qowkqowk@gmail.com</p>
              </a>

              <a
                href="https://github.com/taehyunan-99"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h4 style={{ color: '#333', marginBottom: '5px' }}>안태현</h4>
                <p style={{ fontSize: '12px', color: '#82ca9d', fontWeight: 'bold', marginBottom: '10px' }}>머신러닝</p>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', textAlign: 'left' }}>
                  • LSTM 예측 모델<br />
                  • 데이터 전처리<br />
                  • 모델 학습 최적화
                </div>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>withblua@gmail.com</p>
              </a>

              <a
                href="https://github.com/naas0523"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h4 style={{ color: '#333', marginBottom: '5px' }}>이민정</h4>
                <p style={{ fontSize: '12px', color: '#515151', fontWeight: 'bold', marginBottom: '10px' }}>백엔드</p>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', textAlign: 'left' }}>
                  • Flask REST API<br />
                  • 데이터베이스 설계<br />
                  • 센서 데이터 수집
                </div>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>naas0523@gmail.com</p>
              </a>

              <a
                href="https://github.com/taehun96"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h4 style={{ color: '#333', marginBottom: '5px' }}>윤태훈</h4>
                <p style={{ fontSize: '12px', color: '#FF5C5C', fontWeight: 'bold', marginBottom: '10px' }}>하드웨어</p>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', textAlign: 'left' }}>
                  • 아두이노 센서 회로<br />
                  • 릴레이 제어 시스템<br />
                  • HW-SW 통신
                </div>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>yun47873160@gmail.com</p>
              </a>

              <a
                href="https://github.com/choi-hayeonn"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h4 style={{ color: '#333', marginBottom: '5px' }}>최하연</h4>
                <p style={{ fontSize: '12px', color: '#FF5C5C', fontWeight: 'bold', marginBottom: '10px' }}>하드웨어</p>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', textAlign: 'left' }}>
                  • 센서 데이터 수집<br />
                  • 전력 측정 시스템<br />
                  • 안정성 테스트
                </div>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>gkdus011020@gmail.com</p>
              </a>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      content: (
        <div className="content-container">
          <div className="info-box" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h3>깃허브 레포지토리</h3>

            <div style={{ marginTop: '30px', padding: '25px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
              <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
                프로젝트 저장소
              </p>
              <a
                href="https://github.com/Q5dis/SolarESSManager"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#FFD900',
                  fontSize: '16px',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                https://github.com/Q5dis/SolarESSManager
              </a>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'left' }}>
              <h4 style={{ marginBottom: '15px', color: '#555' }}>프로젝트 구조</h4>
              <div style={{
                backgroundColor: '#2d2d2d',
                color: '#f8f8f2',
                padding: '20px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.8'
              }}>
                SolarESSManager/<br />
                ├── frontend/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# React 프론트엔드<br />
                ├── backend/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Flask API 서버<br />
                ├── ml/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# ML 모델 및 학습<br />
                └── arduino/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# 아두이노 펌웨어
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="home-container">
      {currentSection === 0 ? (
        sections[0].content
      ) : (
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentSection}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          >
            {sections[currentSection].content}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="page-indicator">
        {sections.map((_, i) => (
          <div
            key={i}
            className={currentSection === i ? 'active' : ''}
            onClick={() => setCurrentSection(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default Home;
