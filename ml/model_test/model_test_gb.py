# GradientBoosting 모델 테스트

# 라이브러리 불러오기
import pandas as pd
from sklearn.model_selection import train_test_split # Train / Valid / Test 데이터 분할
from sklearn.ensemble import GradientBoostingRegressor # 모델 생성 / 학습
from sklearn.metrics import root_mean_squared_error, r2_score # 예측 / 평가

# 데이터 불러오기
df = pd.read_csv("../data/total_data.csv")
print("========== 데이터 로드 성공 ==========\n")

# 데이터 확인
print("[ 원본 데이터 확인 ]\n\n")
print(df.head())
# df.info()
# print(df.describe())

# Feature / Target 분리
X = df.drop(columns=["generation"]) # 발전량을 제외한 모든 컬럼 추가
y = df["generation"] # 발전량 컬럼만 사용
print("\n[ 예측용 데이터 확인 ]\n")
print(X.shape)
print(X.columns, "\n")
print("[ 정답 라벨 데이터 확인 ]\n")
print(y.shape)

# 데이터 분할 (Train(70), Valid(15), Test(15))
# 시계열 데이터 = 순서 유지(shuffle=False)
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, shuffle=False)
X_valid, X_test, y_valid, y_test = train_test_split(X_temp, y_temp, test_size=0.5, shuffle=False)
print("\n[ 분할 데이터 확인 ]\n")
print("Train :", X_train.shape)
print("Valid :", X_valid.shape)
print("Test :", X_test.shape)

# 하이퍼 파라미터 튜닝
n_estimators = 300 # 사용되는 트리 개수
max_depth = 20 # 트리의 깊이
learning_rate = 0.01 # 학습률
min_samples_split = 20
min_samples_leaf = 20

# 모델 생성
model = GradientBoostingRegressor(
    n_estimators=n_estimators, 
    max_depth=max_depth,
    learning_rate=learning_rate,
    min_samples_split=min_samples_split,
    min_samples_leaf=min_samples_leaf,
    random_state=42 # 랜덤 요소 고정
)
print("\n========== 모델 생성 완료 ==========\n")

# 학습 시작
print("모델 학습 진행중....\n")
model.fit(X_train, y_train)

# 예측 시작
y_pred_train = model.predict(X_train)
y_pred_valid = model.predict(X_valid)
y_pred_test = model.predict(X_test)

# RMSE : 예측 오차 크기(낮을수록 좋음)
# R2 : 모델 설명력(1에 가까울수록 )

print("[ 결과 출력 ]\n")

print("========== 하이퍼 파라미터 ==========\n")

print(f"n_estimators : {n_estimators}")
print(f"max_depth : {max_depth}")
print(f"learning_rate : {learning_rate}")
print(f"min_samples_split : {min_samples_split}")
print(f"min_samples_leaf : {min_samples_leaf}")

# Train 평가
print("\n========== Train 성능 ==========")
print(f"RMSE: {root_mean_squared_error(y_train, y_pred_train):.4f}")
print(f"R2: {r2_score(y_train, y_pred_train):.4f}")

# Valid 평가
print("\n========== Valid 성능 ==========")
print(f"RMSE: {root_mean_squared_error(y_valid, y_pred_valid):.4f}")
print(f"R2: {r2_score(y_valid, y_pred_valid):.4f}")

# Test 평가
print("\n========== Test 성능 ==========")
print(f"RMSE: {root_mean_squared_error(y_test, y_pred_test):.4f}")
print(f"R2: {r2_score(y_test, y_pred_test):.4f}")