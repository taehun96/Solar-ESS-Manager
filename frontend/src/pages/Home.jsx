import React from "react";
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="hero">
        <h1 className="hero-title">
          What is <span className="highlight">Solar ESS Manager?</span>
        </h1>
        <div className="hero-images">
          <img src="img/yellow.png" alt="yellow" className="hero-img img-left" />
          <img src="img/gray.png" alt="gray" className="hero-img img-right" />
        </div>
      </div>

      <h2 className="intro-title">
        INTRODUCING <span className="highlight">S.E.M</span>
      </h2>

      <div className="project-info">
        <div className="info-box">
          <h3>프로젝트 개요</h3>
          <p>
            Solar ESS Manager(S.E.M)는 태양광 에너지 저장 시스템을 효율적으로 관리하는
            스마트 플랫폼입니다. 실시간 모니터링과 최적화 기능을 제공합니다.
          </p>
        </div>
        <div className="info-box">
          <h3>진행 과정 및 기술 스택</h3>
          <p>
            초기 기획 → 데이터 수집 → 알고리즘 개발 → 프론트/백 통합 → 테스트 & 배포<br />
            사용 기술: React, Node.js, MongoDB
          </p>
        </div>
        <div className="info-box">
          <h3>팀 소개 | Watt's Up?</h3>
          <p>
            What's Up? 이라는 문장과 전력단위인 Watt를 더한
            재치있는 말장난으로, 전력관리의 효율성을 잡겠다는
            패기가 담긴 이름입니다.
          </p>
        </div>
        <div className="info-box">
          <h3>팀원소개 / 연락처</h3>
          <p>
            팀장/프론트: 오왕경 (hong@example.com)<br />
            머신러닝: 안태현 (kim@example.com)<br />
            백엔드: 이민정 (lee@example.com)<br />
            아두이노: 윤태훈 (lee@example.com)<br />
            아두이노: 최하연 (lee@example.com)
          </p>
        </div>
        <div className="info-box">
          <h3>깃허브 레포지토리</h3>
          <p>
            <a href="https://github.com/example/Solar-ESS-Manager" target="_blank" rel="noreferrer">
              https://github.com/example/Solar-ESS-Manager
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
