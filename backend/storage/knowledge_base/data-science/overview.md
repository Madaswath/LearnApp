# Data Science Fundamentals

## The Data Science Workflow

The data science workflow is an iterative process:

1. **Problem definition**: Translate a business question into a data question.
2. **Data collection**: Gather data from databases, APIs, web scraping, surveys.
3. **Exploratory Data Analysis (EDA)**: Understand distributions, correlations, and anomalies.
4. **Data cleaning**: Handle missing values, outliers, duplicates, wrong types.
5. **Feature engineering**: Create informative features from raw data.
6. **Modelling**: Select, train, and tune models.
7. **Evaluation**: Measure model performance with appropriate metrics.
8. **Deployment**: Productionise the model or dashboard.
9. **Monitoring**: Track performance over time.

## pandas for Data Manipulation

```python
import pandas as pd
import numpy as np

# Load data
df = pd.read_csv("data.csv", parse_dates=["date"], low_memory=False)
df = pd.read_excel("data.xlsx", sheet_name="Sheet1")

# Basic inspection
df.shape          # (rows, cols)
df.info()         # dtypes, non-null counts
df.describe()     # summary statistics
df.head(10)
df.value_counts("category")

# Selection
df["column"]                          # Series
df[["col1", "col2"]]                  # DataFrame
df.loc[df["age"] > 30, ["name", "age"]]  # label-based
df.iloc[0:10, 2:5]                    # position-based

# Filtering
mask = (df["salary"] > 50_000) & (df["dept"] == "Engineering")
filtered = df[mask]

# Missing values
df.isnull().sum()
df.fillna({"age": df["age"].median(), "city": "Unknown"})
df.dropna(subset=["required_col"], inplace=True)

# Groupby and aggregation
summary = (
    df.groupby(["dept", "level"])
    .agg(
        avg_salary=("salary", "mean"),
        headcount=("id", "count"),
        max_age=("age", "max"),
    )
    .reset_index()
)

# Merge / join
merged = pd.merge(orders, customers, on="customer_id", how="left")

# Pivot table
pivot = df.pivot_table(
    values="sales", index="region", columns="product", aggfunc="sum", fill_value=0
)

# Apply custom functions
df["salary_band"] = df["salary"].apply(lambda x: "high" if x > 100_000 else "low")
```

## NumPy for Numerical Computation

```python
import numpy as np

# Array creation
arr = np.array([1, 2, 3, 4, 5])
zeros = np.zeros((3, 4))
ones = np.ones((2, 3, 4))
identity = np.eye(4)
linspace = np.linspace(0, 1, 100)
arange = np.arange(0, 10, 0.5)
random_arr = np.random.randn(100, 10)

# Broadcasting
a = np.array([[1, 2, 3], [4, 5, 6]])
b = np.array([10, 20, 30])
result = a + b  # broadcasts b across rows

# Linear algebra
A = np.random.randn(4, 4)
eigenvalues, eigenvectors = np.linalg.eig(A)
inv_A = np.linalg.inv(A)
U, S, Vt = np.linalg.svd(A)

# Vectorised operations (fast – avoid Python loops)
x = np.random.randn(1_000_000)
mean = x.mean()
std = x.std()
z_scores = (x - mean) / std
```

## Matplotlib and Seaborn for Visualisation

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Matplotlib
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

axes[0].plot(x, y, "b-", linewidth=2, label="Line")
axes[0].scatter(x_points, y_points, c="red", s=50, alpha=0.7)
axes[0].set_title("Time Series")
axes[0].set_xlabel("Date")
axes[0].set_ylabel("Value")
axes[0].legend()

axes[1].bar(categories, values, color=sns.color_palette("husl", len(categories)))
axes[1].set_title("Category Distribution")

plt.tight_layout()
plt.savefig("analysis.png", dpi=150, bbox_inches="tight")
plt.show()

# Seaborn (statistical visualisation)
sns.set_style("whitegrid")
sns.set_palette("husl")

# Distribution
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
sns.histplot(df["age"], bins=30, kde=True, ax=axes[0])
sns.boxplot(x="dept", y="salary", data=df, ax=axes[1])
sns.heatmap(df.corr(), annot=True, fmt=".2f", cmap="coolwarm", ax=axes[2])
```

## Data Cleaning and Preprocessing

```python
# Duplicate detection and removal
duplicates = df.duplicated(subset=["email"], keep=False)
df = df.drop_duplicates(subset=["email"], keep="first")

# Outlier detection
Q1, Q3 = df["salary"].quantile([0.25, 0.75])
IQR = Q3 - Q1
lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
df_clean = df[(df["salary"] >= lower) & (df["salary"] <= upper)]

# Type conversion
df["date"] = pd.to_datetime(df["date_str"], format="%Y-%m-%d")
df["salary"] = pd.to_numeric(df["salary_str"].str.replace(",", ""), errors="coerce")
df["age"] = df["age"].astype("int8")

# String cleaning
df["name"] = df["name"].str.strip().str.title()
df["email"] = df["email"].str.lower()
df["phone"] = df["phone"].str.replace(r"[^0-9]", "", regex=True)
```

## Exploratory Data Analysis (EDA)

```python
# Correlation analysis
correlation_matrix = df.select_dtypes(include=np.number).corr()

# Pairplot
sns.pairplot(df, hue="target", vars=["feature1", "feature2", "feature3"])

# Summary statistics by group
df.groupby("target").describe().round(2)

# Distribution comparison
for col in num_cols:
    fig, ax = plt.subplots(figsize=(8, 4))
    for label in df["target"].unique():
        subset = df[df["target"] == label][col]
        sns.kdeplot(subset, label=str(label), ax=ax)
    ax.set_title(f"Distribution of {col} by Target")
    plt.show()
```

## Statistical Concepts

```python
from scipy import stats

# Descriptive statistics
print("Mean:", df["salary"].mean())
print("Median:", df["salary"].median())
print("Skewness:", df["salary"].skew())
print("Kurtosis:", df["salary"].kurtosis())

# Hypothesis testing
group_a = df[df["group"] == "A"]["conversion_rate"]
group_b = df[df["group"] == "B"]["conversion_rate"]

# t-test
t_stat, p_value = stats.ttest_ind(group_a, group_b)
print(f"t={t_stat:.3f}, p={p_value:.4f}")

if p_value < 0.05:
    print("Statistically significant difference (p < 0.05)")

# Chi-square test for independence
contingency = pd.crosstab(df["gender"], df["purchased"])
chi2, p, dof, expected = stats.chi2_contingency(contingency)
```

## SQL for Data Analysis

```sql
-- Window functions
SELECT
  user_id,
  purchase_date,
  amount,
  SUM(amount) OVER (PARTITION BY user_id ORDER BY purchase_date) AS running_total,
  RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rank_by_amount,
  LAG(amount, 1) OVER (PARTITION BY user_id ORDER BY purchase_date) AS prev_amount
FROM purchases;

-- CTEs
WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', order_date) AS month,
    SUM(total_amount) AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY 1
),
growth AS (
  SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
    (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month) AS growth_rate
  FROM monthly_revenue
)
SELECT * FROM growth ORDER BY month;
```

## A/B Testing

```python
from scipy.stats import proportions_ztest
import numpy as np

# Conversion rates
n_control = 5000
n_treatment = 5000
conversions_control = 450     # 9.0%
conversions_treatment = 495   # 9.9%

count = np.array([conversions_control, conversions_treatment])
nobs = np.array([n_control, n_treatment])

z_stat, p_value = proportions_ztest(count, nobs, alternative="two-sided")
print(f"Z-statistic: {z_stat:.4f}")
print(f"P-value: {p_value:.4f}")

# Statistical power
from statsmodels.stats.power import NormalIndPower

effect_size = 0.05 / np.sqrt(0.09 * 0.91)  # Cohen's h approximation
analysis = NormalIndPower()
sample_size = analysis.solve_power(effect_size=effect_size, alpha=0.05, power=0.8)
print(f"Required sample size per group: {int(sample_size)}")
```
