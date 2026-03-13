# Machine Learning Fundamentals

## What is Machine Learning?

Machine Learning (ML) is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Instead of following hand-crafted rules, ML algorithms identify patterns in data and build models that make predictions or decisions.

## Types of Machine Learning

### Supervised Learning
The algorithm learns from labelled training data (input-output pairs).
- **Classification**: Predict a discrete category (spam/not spam, digit recognition)
- **Regression**: Predict a continuous value (house price, temperature)

### Unsupervised Learning
The algorithm finds patterns in unlabelled data.
- **Clustering**: Group similar data points (K-Means, DBSCAN)
- **Dimensionality Reduction**: Compress features (PCA, t-SNE)
- **Anomaly Detection**: Find outliers

### Reinforcement Learning
An agent learns by interacting with an environment, receiving rewards or penalties.

## Key Algorithms

### Linear Regression
Fits a linear relationship between features and a continuous target.

```python
from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 5, 4, 5])

model = LinearRegression()
model.fit(X, y)
print("Coefficient:", model.coef_[0])
print("Prediction for 6:", model.predict([[6]])[0])
```

### Logistic Regression
Classification algorithm using the sigmoid function to output probabilities.

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

clf = LogisticRegression(max_iter=200)
clf.fit(X_train, y_train)
print("Accuracy:", clf.score(X_test, y_test))
```

### Decision Trees
Hierarchical model that splits data using feature thresholds.

```python
from sklearn.tree import DecisionTreeClassifier, export_text

tree = DecisionTreeClassifier(max_depth=4, random_state=42)
tree.fit(X_train, y_train)
print(export_text(tree))
```

### Random Forest
Ensemble of decision trees using bagging and feature randomness.

```python
from sklearn.ensemble import RandomForestClassifier

rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)
importances = rf.feature_importances_
```

### Support Vector Machine (SVM)
Finds the optimal hyperplane that maximises the margin between classes.

```python
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", SVC(kernel="rbf", C=1.0, gamma="scale")),
])
pipe.fit(X_train, y_train)
```

### K-Nearest Neighbours (KNN)
Classifies based on the majority class among k nearest neighbours.

```python
from sklearn.neighbors import KNeighborsClassifier

knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)
```

### K-Means Clustering
Partitions data into k clusters by minimising intra-cluster variance.

```python
from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3, random_state=42)
kmeans.fit(X)
labels = kmeans.labels_
centers = kmeans.cluster_centers_
```

### Neural Networks
Multi-layer perceptron for non-linear classification/regression.

```python
from sklearn.neural_network import MLPClassifier

mlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500)
mlp.fit(X_train, y_train)
```

## Feature Engineering and Preprocessing

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
import pandas as pd

df = pd.read_csv("data.csv")

# Handle missing values
imputer = SimpleImputer(strategy="median")
df["age"] = imputer.fit_transform(df[["age"]])

# Encode categorical features
enc = OneHotEncoder(sparse_output=False, drop="first")
cat_features = enc.fit_transform(df[["city", "gender"]])

# Scale numerical features
scaler = StandardScaler()
num_features = scaler.fit_transform(df[["age", "income"]])
```

## Model Evaluation

```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix,
    mean_squared_error, mean_absolute_error, r2_score,
)

# Classification metrics
y_pred = clf.predict(X_test)
y_prob = clf.predict_proba(X_test)[:, 1]

print("Accuracy:", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred, average="weighted"))
print("Recall:", recall_score(y_test, y_pred, average="weighted"))
print("F1:", f1_score(y_test, y_pred, average="weighted"))

# Regression metrics
y_pred_reg = reg.predict(X_test)
print("MSE:", mean_squared_error(y_test, y_pred_reg))
print("R²:", r2_score(y_test, y_pred_reg))
```

## Cross-Validation

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(clf, X, y, cv=cv, scoring="f1_weighted")
print(f"CV F1: {scores.mean():.3f} ± {scores.std():.3f}")
```

## Overfitting and Underfitting

- **Underfitting**: Model too simple – high bias, low variance. Fix: increase model complexity, add features.
- **Overfitting**: Model memorises training data – low bias, high variance. Fix: regularisation, more data, pruning, dropout.
- **Regularisation**: L1 (Lasso) – feature selection; L2 (Ridge) – weight shrinkage; Elastic Net – both.

```python
from sklearn.linear_model import Ridge, Lasso, ElasticNet

ridge = Ridge(alpha=1.0)    # L2
lasso = Lasso(alpha=0.1)    # L1
elastic = ElasticNet(alpha=0.1, l1_ratio=0.5)
```

## Scikit-learn Workflow

```python
# Complete workflow
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV

pipe = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(random_state=42)),
])

param_grid = {
    "classifier__n_estimators": [50, 100, 200],
    "classifier__max_depth": [None, 5, 10],
}

search = GridSearchCV(pipe, param_grid, cv=5, scoring="f1_weighted", n_jobs=-1)
search.fit(X_train, y_train)
print("Best params:", search.best_params_)
```

## Popular Datasets

| Dataset | Type | Features | Task |
|---------|------|----------|------|
| Iris | Classification | 4 numerical | 3-class flower species |
| Boston Housing | Regression | 13 features | House price prediction |
| MNIST | Classification | 784 pixels | Digit recognition |
| Titanic | Classification | Mixed | Survival prediction |
| California Housing | Regression | 8 features | Median house value |
