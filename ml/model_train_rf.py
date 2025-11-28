# RandomForest 모델 테스트

# 라이브러리 불러오기
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV # Train / Valid / Test 데이터 분할, 최적 파라이터 값 자동 찾기
from sklearn.ensemble import RandomForestRegressor # 모델 생성 / 학습
from sklearn.metrics import root_mean_squared_error, r2_score # 예측 / 평가
import pickle # 모델 저장
import json

# config.json 불러오기
with open("config.json") as f:
    config = json.load(f)

# config 데이터 가져오기
n_estimators = config["n_estimators"] # 사용되는 트리 개수
max_depth = config["max_depth"] # 트리의 깊이
min_samples_split = config["min_samples_split"] # 노드 분할을 위한 샘플 수
min_samples_leaf = config["min_samples_leaf"] # 트리 끝 노드의 최소 샘플 수

# 데이터 불러오기
df = pd.read_csv("data/total_data.csv")
print("========== 데이터 로드 성공 ==========\n")

# 데이터 확인
print("[ 원본 데이터 확인 ]\n\n")
print(df.head())
# df.info()
# print(df.describe())

# Feature / Target 분리

# y를 DataFrame으로 생성
y = pd.DataFrame({
    "1h": df["generation"].shift(-1),
    "2h": df["generation"].shift(-2),
    "3h": df["generation"].shift(-3)
})

# NaN 값 필터링
mask = df["time"] <= 15
X = df[mask]
y = y[mask]

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

# 모델 생성
model = RandomForestRegressor(
    n_estimators=n_estimators,
    max_depth=max_depth,
    min_samples_split=min_samples_split,
    min_samples_leaf=min_samples_leaf,
    verbose=2,
    random_state=42
)

# 파라미터 그리드 정의
# param_grid = {
#     "n_estimators": n_estimators,
#     "max_depth": max_depth,
#     "min_samples_split": min_samples_split,
#     "min_samples_leaf": min_samples_leaf
# }

# # 그리드 서치 생성
# grid_search = GridSearchCV(
#     model,
#     param_grid,
#     cv=5,
#     scoring="r2",
#     verbose=2
# )

# print("\n========== GridSearch 시작 ==========\n")
# print("최적 파라미터 탐색 중....\n")

# 학습 시작
model.fit(X_train, y_train)

# 최적 모델 가져오기
# model = grid_search.best_estimator_
# print(f"최적 파라미터 : {grid_search.best_params_}")
# print(f"최고 CV 점수 : {grid_search.best_score_:.4f}")

print("\n========== 모델 생성 완료 ==========\n")

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
print(f"min_samples_split : {min_samples_split}")
print(f"min_samples_leaf : {min_samples_leaf}")

# Train 평가
print("\n========== Train 성능 ==========")
print(f"RMSE : {root_mean_squared_error(y_train, y_pred_train):.4f}")
print(f"R2 : {r2_score(y_train, y_pred_train):.4f}")

# Valid 평가
print("\n========== Valid 성능 ==========")
print(f"RMSE : {root_mean_squared_error(y_valid, y_pred_valid):.4f}")
print(f"R2 : {r2_score(y_valid, y_pred_valid):.4f}")

# Test 평가
print("\n========== Test 성능 ==========")
print(f"RMSE : {root_mean_squared_error(y_test, y_pred_test):.4f}")
print(f"R2 : {r2_score(y_test, y_pred_test):.4f}")

# 각 시간별 평가
for i, label in enumerate(["1h", "2h", "3h"]):
    rmse = root_mean_squared_error(y_test.iloc[:, i], y_pred_test[:, i])
    r2 = r2_score(y_test.iloc[:, i], y_pred_test[:, i])
    print(f"\n========== [ {label} ] 시간별 성능 ==========")
    print(f"RMSE : {rmse:.4f}")
    print(f"R2 : {r2:.4f}")

# 모델 저장
with open("data/model/rf_best_model.pkl", "wb") as f:
    pickle.dump(model, f)
print("\n[ 모델 저장 완료! ]")