# LSTM 모델 테스트

# 라이브러리 불러오기
import pandas as pd
import numpy as np
from keras.models import Sequential # Keras 모델 클래스
from keras.layers import LSTM, Dense, Input # 시계열 학습층(신경망) / 출력층
from sklearn.preprocessing import MinMaxScaler # 데이터 정규화 라이브러리
from sklearn.metrics import root_mean_squared_error, r2_score # 예측 / 평가
import json

# config.json 불러오기
with open("config.json") as f:
    config = json.load(f)

# config 데이터 가져오기
seq_length = config["seq_length"] # 시퀀스 길이 : 과거 몇 시간 데이터를 사용할지
train_ratio = config["train_ratio"] # 학습 데이터 비율
valid_ratio = config["valid_ratio"] # 검증 데이터 비율
lstm_units = config["lstm_units"] # LSTM 유닛 개수(노드)
optimizer = config["optimizer"] # 가중치 업데이트 방법(어떻게 학습할지)
metrics = config["metrics"] # 평가 지표
loss = config["loss"] # 손실 함수 정의
epochs = config["epochs"] # 학습 반복 횟수
batch_size = config["batch_size"] # 한번 학습에 사용하는 데이터 수 

# 데이터 불러오기
df = pd.read_csv("../data/total_data.csv")
print("========== 데이터 로드 성공 ==========\n")

# 데이터 확인
print("[ 원본 데이터 확인 ]\n\n")
print(df.head())
# df.info()
# print(df.describe())

# Feature / Target 분리
features = df.drop(columns=["generation", "prev_generation", "yesterday_generation"]) # 발전량관련 데이터를 제외한 모든 컬럼 추가
target = df["generation"] # 발전량 컬럼만 사용
X = features.values
y = target.values

# 데이터 정규화
scaler_X = MinMaxScaler()
scaler_y = MinMaxScaler()

X_scaled = scaler_X.fit_transform(X)
y_scaled = scaler_y.fit_transform(y.reshape(-1, 1)) # 1D -> 2D 변환

print("\n[ 정규화 데이터 확인 ]\n")
print("X shape:", X_scaled.shape)
print("y shape:", y_scaled.shape)
print("X 범위:", X_scaled.min(), "~", X_scaled.max())

# 시퀀스(순서가 있는 데이터) 생성 함수
def create_sequences(X, y, seq_length):
    # 시퀀스 데이터를 담을 빈 리스트 생성
    X_seq, y_seq = [], []
    for i in range(len(X) - seq_length):
        # seq_length 시간 만큼의 데이터를 사용해서 다음 값 예측
        X_seq.append(X[i:i+seq_length])
        y_seq.append(y[i+seq_length])
    # 중첩 리스트 -> 배열로 변환 후 반환
    return np.array(X_seq), np.array(y_seq)

# 함수 실행
if __name__ == "__main__":
    X_seq, y_seq = create_sequences(X_scaled, y_scaled, seq_length)

# 데이터 분할 (Train(70), Valid(15), Test(15))
train_size = int(len(X_seq) * 0.7)
valid_size = int(len(X_seq) * 0.15)

# Train 데이터
X_train = X_seq[:train_size]
y_train = y_seq[:train_size]

# Valid 데이터
X_valid = X_seq[train_size:train_size+valid_size]
y_valid = y_seq[train_size:train_size+valid_size]

# Test 데이터
X_test = X_seq[train_size+valid_size:]
y_test = y_seq[train_size+valid_size:]

print("\n[ 분할 데이터 확인 ]\n")
print("Train :", X_train.shape, y_train.shape)
print("Valid :", X_valid.shape, y_valid.shape)
print("Test :", X_test.shape, y_test.shape)

# 모델 생성
model = Sequential([
    Input(shape=(seq_length, X_train.shape[2])),
    LSTM(lstm_units),
    Dense(1) # 출력 개수(발전량)
])

# 모델 컴파일
model.compile(optimizer=optimizer, loss=loss, metrics=metrics)

# 모델 구조 확인
print("\n[ 모델 구조 확인 ]\n")
model.summary()

# 모델 학습
print("\n[ 모델 학습 시작 ]\n")
history = model.fit(
    X_train,
    y_train,
    epochs=epochs,
    batch_size=batch_size,
    validation_data=(X_valid, y_valid), # 검증용 데이터 설정
    verbose=1, # 진행상황 출력
    shuffle=True, # 기본값=True / True False 선택
)
print("\n[ 모델 학습 완료 ]\n")

# 예측 및 평가
y_pred_train = model.predict(X_train)
y_pred_valid = model.predict(X_valid)
y_pred_test = model.predict(X_test)

print("\n========== Train 성능 ==========")
print(f"RMSE : {root_mean_squared_error(y_train, y_pred_train):.4f}")
print(f"R2 : {r2_score(y_train, y_pred_train):.4f}")

print("\n========== Valid 성능 ==========")
print(f"RMSE : {root_mean_squared_error(y_valid, y_pred_valid):.4f}")
print(f"R2 : {r2_score(y_valid, y_pred_valid):.4f}")

print("\n========== Test 성능 ==========")
print(f"RMSE : {root_mean_squared_error(y_test, y_pred_test):.4f}")
print(f"R2 : {r2_score(y_test, y_pred_test):.4f}")