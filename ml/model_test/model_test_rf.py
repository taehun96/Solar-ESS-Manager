# RandomForest 모델 테스트

# 라이브러리 불러오기
import pandas as pd
from sklearn.model_selection import train_test_split # Train / Valid / Test 데이터 분할
from sklearn.ensemble import RandomForestRegressor # 모델 생성 / 학습
from sklearn.metrics import mean_squared_error, r2_score # 예측 / 평가

# 데이터 불러오기
df = pd.read_csv("../data/total_data.csv")
print("==========데이터 로드 성공==========\n")

# 데이터 확인
print("[ 원본 데이터 확인 ]\n\n")
print(df.head())
# df.info()
# print(df.describe())

print("\n", "=" * 100, "\n")

# Feature / Target 분리
X = df.drop(columns=["generation"]) # 발전량을 제외한 모든 컬럼 추가
y = df["generation"] # 발전량 컬럼만 사용
print("[ 예측용 데이터 확인 ]\n")
print(X.shape)
print(X.columns, "\n")
print("[ 정답 라벨 데이터 확인 ]\n")
print(y.shape)

print("\n", "=" * 100, "\n")

# 데이터 분할 (Train(70), Valid(15), Test(15))
# 시계열 데이터 = 순서 유지(shuffle=False)
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, shuffle=False)
X_valid, X_test, y_valid, y_test = train_test_split(X_temp, y_temp, test_size=0.5, shuffle=False)
print("[ 분할 데이터 확인 ]\n")
print("Train :", X_train.shape)
print("Valid :", X_valid.shape)
print("Test :", X_test.shape)

print("\n", "=" * 100, "\n")

# 모델 생성
model = RandomForestRegressor(
    n_estimators=100, # 사용되는 트리 개수
    max_depth=10, # 트리의 깊이
    min_samples_split=5, # 노드 분할을 위한 샘플 수
    random_state=42 # 랜덤 요소 고정
)
print("==========모델 생성 완료==========\n")

# 학습 시작
model.fit(X_train, y_train)
print("모델 학습 진행중....\n")

# 예측 시작
y_pred_train = model.predict(X_train)
y_pred_valid = model.predict(X_valid)
y_pred_test = model.predict(X_test)

