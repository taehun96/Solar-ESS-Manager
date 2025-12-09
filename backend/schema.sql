# 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS realtime_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE realtime_db;

# 테이블 생성
CREATE TABLE sun_data_realtime (
    id INT PRIMARY KEY AUTO_INCREMENT,
    timestamp  datetime not null,
    soc FLOAT,
    solar_w FLOAT,
    lux int,
    INDEX idx_timestamp (timestamp)
);

CREATE TABLE sun_data_hourly (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    hour INT NOT NULL,
    avg_soc FLOAT,
    avg_solar_w FLOAT,
    avg_lux INT,
    UNIQUE KEY unique_datetime (date, hour)
);

CREATE TABLE relay_status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    relay_name char(5) not null,
    status VARCHAR(5) NOT NULL DEFAULT 'off'
);

CREATE TABLE trade_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    buyer_id INT NOT NULL,  -- 구매채널 ID
    amount FLOAT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES relay_status (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

# 초기 릴레이 상태 추가
INSERT INTO relay_status (relay_name, status) VALUES
    ('A', 'off'),
    ('B', 'off'),
    ('C', 'off'),
    ('D', 'off');

# 테이블 조회
SELECT * FROM sun_data_realtime;
SELECT * FROM sun_data_hourly;
SELECT * FROM relay_status;
SELECT * FROM trade_history;

# 테이블 초기화(테스트 데이터 삭제)
# TRUNCATE TABLE sun_data_realtime;
# TRUNCATE TABLE sun_data_hourly;
# TRUNCATE TABLE trade_history;
# TRUNCATE TABLE relay_status;
# UPDATE relay_status SET status = 'off';
