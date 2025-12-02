import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import turnon from '../../img/yellow_gray.png';
import './home.css';

function Home() {
  const [currentSection, setCurrentSection] = useState(0);
  const [direction, setDirection] = useState(0);
  const sectionsCount = 7;

  useEffect(() => {
    let accumulatedDelta = 0;
    let isScrolling = false;
    const threshold = 50;

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
        setTimeout(() => { isScrolling = false; }, 800);
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
        <div className="content-container">
          <motion.h1
            key="title-0"
            initial="hidden"
            animate="visible"
            variants={fadeInUpSlow}
            className="hero-title"
          >
            What is <span className="highlight">Solar ESS Manager?</span>
          </motion.h1>
          <motion.img
            key="img-0"
            initial="hidden"
            animate="visible"
            variants={fadeInUpSlow}
            className="hero-img"
            src={turnon}
            alt="yellow_gray"
          />
        </div>
      )
    },
    {
      id: 1,
      content: (
        <div className="content-container">
          <h2 className="hero-title">
            INTRODUCING <span className="highlight">S.E.M</span>
          </h2>
        </div>
      )
    },
    {
      id: 2,
      content: (
        <div className="content-container">
          <div className="info-box">
            <h3>프로젝트 개요</h3>
            <p>
              Solar ESS Manager(S.E.M)는 태양광 에너지 저장 시스템을 효율적으로 관리하는
              스마트 플랫폼입니다. 실시간 모니터링과 최적화 기능을 제공합니다.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      content: (
        <div className="content-container">
          <div className="info-box">
            <h3>진행 과정 및 기술 스택</h3>
            <p>
              초기 기획 → 데이터 수집 → 알고리즘 개발 → 프론트/백 통합 → 테스트 & 배포
            </p>
            <table style={{border:'1px'}}>
              <tbody>
                <tr>
                  <td>분류</td>
                  <td>내용</td>
                </tr>
                <tr>
                  <td>언어</td>
                  <td>JavaScript, Python</td>
                </tr>
                <tr>
                  <td>프레임워크</td>
                  <td>React, Express</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 4,
      content: (
        <div className="content-container">
          <div className="info-box">
            <h3>팀 소개 | Watt's Up?</h3>
            <p>
              What's Up? 이라는 문장과 전력단위인 Watt를 더한 재치있는 말장난으로, 전력관리의 효율성을 잡겠다는 패기가 담긴 이름입니다.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      content: (
        <div className="content-container">
          <div className="info-box">
            <h3>팀원소개 / 연락처</h3>
            <div style={{display:'flex', flexWrap:'wrap',justifyContent:'center', gap:'40px'}}>
              <div>
                팀장/프론트: 오왕경 <br />(qowkqowk@gmail.com)
              </div>
              <div>
                머신러닝: 안태현 <br /> (withblua@gmail.com)
              </div>
              <div>
                 백엔드: 이민정 <br />(naas0523@gmail.com)
              </div>
              <div>
                아두이노: 윤태훈 <br />(yun47873160@gmail.com)
              </div>
              <div>
                아두이노: 최하연 <br />(gkdus011020@gmail.com)
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      content: (
        <div className="content-container">
          <div className="info-box">
            <h3>깃허브 레포지토리</h3>
            <p>
              <a href="https://github.com/example/Solar-ESS-Manager" target="_blank" rel="noreferrer">
                https://github.com/example/Solar-ESS-Manager
              </a>
            </p>
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
