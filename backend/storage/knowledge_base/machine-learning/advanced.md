# Advanced Machine Learning

## Ensemble Methods

Ensemble methods combine multiple models to produce better predictions than any single model.

### Boosting
Trains models sequentially, each correcting the errors of the previous one.

```python
from sklearn.ensemble import GradientBoostingClassifier, AdaBoostClassifier
import xgboost as xgb
import lightgbm as lgb

# Gradient Boosting
gb = GradientBoostingClassifier(n_estimators=200, learning_rate=0.05, max_depth=4)
gb.fit(X_train, y_train)

# XGBoost (industry standard)
xgb_model = xgb.XGBClassifier(
    n_estimators=500,
    learning_rate=0.01,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss",
    early_stopping_rounds=50,
)
xgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

# LightGBM (faster for large datasets)
lgb_model = lgb.LGBMClassifier(
    n_estimators=1000,
    learning_rate=0.01,
    num_leaves=63,
    min_child_samples=20,
)
lgb_model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    callbacks=[lgb.early_stopping(50), lgb.log_evaluation(100)],
)
```

### Bagging
Trains models in parallel on random subsets of data.

```python
from sklearn.ensemble import BaggingClassifier, RandomForestClassifier

bag = BaggingClassifier(
    estimator=DecisionTreeClassifier(max_depth=6),
    n_estimators=50,
    max_samples=0.8,
    max_features=0.8,
    bootstrap=True,
)

# Random Forest IS bagging + feature randomness
rf = RandomForestClassifier(n_estimators=100, max_features="sqrt")
```

### Stacking
Uses predictions of base models as features for a meta-learner.

```python
from sklearn.ensemble import StackingClassifier

estimators = [
    ("rf", RandomForestClassifier(n_estimators=100)),
    ("gb", GradientBoostingClassifier(n_estimators=100)),
    ("svm", SVC(probability=True)),
]
stack = StackingClassifier(
    estimators=estimators,
    final_estimator=LogisticRegression(),
    cv=5,
)
stack.fit(X_train, y_train)
```

## Feature Selection and Dimensionality Reduction

### Principal Component Analysis (PCA)

```python
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

pca = PCA(n_components=2)
X_2d = pca.fit_transform(X_scaled)

print("Explained variance:", pca.explained_variance_ratio_)

plt.figure(figsize=(8, 6))
plt.scatter(X_2d[:, 0], X_2d[:, 1], c=y, cmap="viridis", alpha=0.7)
plt.xlabel("PC 1")
plt.ylabel("PC 2")
plt.title("PCA – 2D Projection")
plt.colorbar()
plt.show()
```

### t-SNE

```python
from sklearn.manifold import TSNE

tsne = TSNE(n_components=2, perplexity=30, random_state=42, n_iter=1000)
X_tsne = tsne.fit_transform(X_scaled)
```

### Feature Selection

```python
from sklearn.feature_selection import (
    SelectKBest, chi2, mutual_info_classif,
    RFE, SelectFromModel,
)

# Filter method
selector = SelectKBest(mutual_info_classif, k=10)
X_selected = selector.fit_transform(X, y)

# Wrapper method – Recursive Feature Elimination
rfe = RFE(estimator=RandomForestClassifier(), n_features_to_select=10)
X_rfe = rfe.fit_transform(X, y)

# Embedded method – L1 regularisation
from sklearn.svm import LinearSVC
sfm = SelectFromModel(LinearSVC(penalty="l1", dual=False, C=0.1))
X_sfm = sfm.fit_transform(X, y)
```

## Hyperparameter Tuning

### Grid Search and Randomised Search

```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from scipy.stats import randint, uniform

# Grid Search (exhaustive)
param_grid = {
    "n_estimators": [100, 200, 500],
    "max_depth": [4, 6, 8, None],
    "min_samples_split": [2, 5, 10],
}
grid_search = GridSearchCV(
    RandomForestClassifier(), param_grid, cv=5, n_jobs=-1, verbose=1
)
grid_search.fit(X_train, y_train)

# Randomised Search (faster for large spaces)
param_dist = {
    "n_estimators": randint(100, 1000),
    "max_depth": randint(3, 15),
    "learning_rate": uniform(0.001, 0.3),
}
rand_search = RandomizedSearchCV(
    GradientBoostingClassifier(), param_dist, n_iter=50, cv=5, n_jobs=-1
)
```

### Bayesian Optimisation

```python
# Using Optuna
import optuna

def objective(trial):
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "learning_rate": trial.suggest_float("learning_rate", 1e-3, 0.3, log=True),
    }
    model = GradientBoostingClassifier(**params)
    return cross_val_score(model, X, y, cv=3, scoring="roc_auc").mean()

study = optuna.create_study(direction="maximize")
study.optimize(objective, n_trials=100, timeout=300)
print("Best params:", study.best_params)
```

## Pipeline Construction

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

num_features = ["age", "income", "years_experience"]
cat_features = ["city", "education", "job_type"]

num_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

cat_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore")),
])

preprocessor = ColumnTransformer([
    ("num", num_transformer, num_features),
    ("cat", cat_transformer, cat_features),
])

full_pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", XGBClassifier(n_estimators=200)),
])

full_pipeline.fit(X_train, y_train)
```

## Model Deployment

```python
import joblib
import json

# Save model
joblib.dump(full_pipeline, "model_v1.pkl")

# Load model
loaded = joblib.load("model_v1.pkl")
predictions = loaded.predict(X_new)

# Save metadata alongside
metadata = {
    "model_version": "1.0",
    "training_date": "2024-01-01",
    "features": num_features + cat_features,
    "metrics": {"cv_auc": 0.92, "test_f1": 0.88},
}
with open("model_v1_meta.json", "w") as f:
    json.dump(metadata, f, indent=2)
```

## MLflow Experiment Tracking

```python
import mlflow
import mlflow.sklearn

mlflow.set_experiment("customer-churn")

with mlflow.start_run(run_name="random-forest-v2"):
    model = RandomForestClassifier(n_estimators=200, max_depth=8)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    f1 = f1_score(y_test, preds)

    mlflow.log_param("n_estimators", 200)
    mlflow.log_param("max_depth", 8)
    mlflow.log_metric("roc_auc", auc)
    mlflow.log_metric("f1", f1)
    mlflow.sklearn.log_model(model, "model")
```

## Model Interpretability: SHAP and LIME

```python
import shap

explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer(X_test)

# Summary plot
shap.summary_plot(shap_values, X_test, feature_names=feature_names)

# Waterfall for a single prediction
shap.plots.waterfall(shap_values[0])

# LIME for any model
from lime.lime_tabular import LimeTabularExplainer

lime_explainer = LimeTabularExplainer(
    X_train, feature_names=feature_names,
    class_names=["No Churn", "Churn"], mode="classification"
)
lime_exp = lime_explainer.explain_instance(X_test[0], model.predict_proba)
lime_exp.show_in_notebook()
```
