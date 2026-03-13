# Advanced Data Science

## Time Series Analysis

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller, acf, pacf
import matplotlib.pyplot as plt

# Load and prepare time series
df = pd.read_csv("sales.csv", parse_dates=["date"], index_col="date")
ts = df["sales"].resample("MS").sum()  # monthly sum

# Stationarity test (Augmented Dickey-Fuller)
adf_result = adfuller(ts.dropna())
print(f"ADF statistic: {adf_result[0]:.4f}")
print(f"p-value: {adf_result[1]:.4f}")
if adf_result[1] > 0.05:
    ts_diff = ts.diff().dropna()  # first-order differencing

# SARIMA model
model = SARIMAX(ts, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
result = model.fit(disp=False)

# Forecast 12 months ahead
forecast = result.get_forecast(steps=12)
mean_forecast = forecast.predicted_mean
conf_int = forecast.conf_int()

# Prophet (Facebook's forecasting library)
from prophet import Prophet

prophet_df = ts.reset_index().rename(columns={"date": "ds", "sales": "y"})
m = Prophet(seasonality_mode="multiplicative", yearly_seasonality=True)
m.add_seasonality(name="quarterly", period=91.25, fourier_order=5)
m.fit(prophet_df)

future = m.make_future_dataframe(periods=365)
forecast_df = m.predict(future)
m.plot(forecast_df)
```

## Natural Language Processing (NLP)

```python
import re
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation

# Text preprocessing
def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-z\s]", "", text)
    tokens = text.split()
    stop_words = {"the", "a", "is", "in", "it", "of", "and", "to", "was"}
    return " ".join(t for t in tokens if t not in stop_words and len(t) > 2)

# TF-IDF vectorisation
corpus = [preprocess_text(doc) for doc in documents]
vectorizer = TfidfVectorizer(max_features=10_000, ngram_range=(1, 2), min_df=2)
X = vectorizer.fit_transform(corpus)

# Named Entity Recognition with spaCy
import spacy
nlp = spacy.load("en_core_web_sm")

doc = nlp("Apple acquired Beats for $3 billion in May 2014.")
for ent in doc.ents:
    print(ent.text, ent.label_)

# Sentiment analysis with transformers
from transformers import pipeline

sentiment = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
result = sentiment("This course is absolutely fantastic!")
print(result)  # [{'label': 'POSITIVE', 'score': 0.9998}]
```

## Big Data Tools

### PySpark

```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

spark = SparkSession.builder \
    .appName("LuminaAnalytics") \
    .config("spark.sql.shuffle.partitions", "200") \
    .getOrCreate()

df = spark.read.parquet("s3://data-lake/events/")

# Transformations (lazy)
result = (
    df
    .filter(F.col("event_type") == "course_view")
    .withColumn("date", F.to_date("timestamp"))
    .groupBy("user_id", "date")
    .agg(
        F.count("*").alias("daily_views"),
        F.countDistinct("course_id").alias("unique_courses"),
    )
)

# Window function – rolling 7-day average
window = Window.partitionBy("user_id").orderBy("date").rowsBetween(-6, 0)
result = result.withColumn("rolling_avg", F.avg("daily_views").over(window))

result.write.mode("overwrite").parquet("s3://output/daily_activity/")
spark.stop()
```

## Data Pipelines and ETL

```python
import luigi
import pandas as pd
from datetime import date

class ExtractData(luigi.Task):
    run_date = luigi.DateParameter(default=date.today())

    def output(self):
        return luigi.LocalTarget(f"data/raw/{self.run_date}.parquet")

    def run(self):
        df = fetch_from_api(self.run_date)
        df.to_parquet(self.output().path, index=False)


class TransformData(luigi.Task):
    run_date = luigi.DateParameter(default=date.today())

    def requires(self):
        return ExtractData(self.run_date)

    def output(self):
        return luigi.LocalTarget(f"data/processed/{self.run_date}.parquet")

    def run(self):
        df = pd.read_parquet(self.input().path)
        df = clean_and_transform(df)
        df.to_parquet(self.output().path, index=False)

# Apache Airflow DAG
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

with DAG(
    "lumina_etl",
    start_date=datetime(2024, 1, 1),
    schedule_interval="@daily",
    default_args={"retries": 3, "retry_delay": timedelta(minutes=5)},
) as dag:
    extract = PythonOperator(task_id="extract", python_callable=extract_fn)
    transform = PythonOperator(task_id="transform", python_callable=transform_fn)
    load = PythonOperator(task_id="load", python_callable=load_fn)

    extract >> transform >> load
```

## Dashboard Creation with Streamlit

```python
import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="Lumina Analytics", layout="wide")

@st.cache_data(ttl=3600)
def load_data():
    return pd.read_parquet("data/processed/latest.parquet")

df = load_data()

st.title("📊 Lumina Learning Analytics")

col1, col2, col3 = st.columns(3)
col1.metric("Total Users", f"{df['user_id'].nunique():,}", "+12%")
col2.metric("Courses Completed", f"{df['completed'].sum():,}", "+8%")
col3.metric("Avg Quiz Score", f"{df['score'].mean():.1f}%", "+3.2%")

topic_filter = st.multiselect("Filter by Topic", df["topic"].unique())
filtered = df[df["topic"].isin(topic_filter)] if topic_filter else df

fig = px.line(
    filtered.groupby("date")["active_users"].sum().reset_index(),
    x="date", y="active_users", title="Daily Active Learners"
)
st.plotly_chart(fig, use_container_width=True)
```

## Causal Inference

```python
from dowhy import CausalModel
import pandas as pd

# Define causal graph
model = CausalModel(
    data=df,
    treatment="received_mentoring",
    outcome="course_completion",
    common_causes=["age", "prior_education", "hours_per_week"],
    instruments=["assigned_to_program"],
)

identified = model.identify_effect(proceed_when_unidentifiable=True)

# Propensity Score Matching (PSM)
from sklearn.linear_model import LogisticRegression

ps_model = LogisticRegression()
ps_model.fit(df[["age", "prior_education", "hours_per_week"]], df["received_mentoring"])
df["propensity_score"] = ps_model.predict_proba(
    df[["age", "prior_education", "hours_per_week"]]
)[:, 1]

# Nearest-neighbour matching
from sklearn.neighbors import NearestNeighbors

treated = df[df["received_mentoring"] == 1]
control = df[df["received_mentoring"] == 0]

nn = NearestNeighbors(n_neighbors=1)
nn.fit(control[["propensity_score"]])
_, indices = nn.kneighbors(treated[["propensity_score"]])
matched_control = control.iloc[indices.flatten()]

ate = treated["course_completion"].mean() - matched_control["course_completion"].mean()
print(f"Estimated ATE of mentoring: {ate:.3f}")
```

## Advanced Statistics

```python
from scipy import stats
import statsmodels.api as sm
import statsmodels.formula.api as smf

# Multiple regression with statsmodels
model = smf.ols("course_completion ~ hours_studied + prior_score + C(topic)", data=df)
result = model.fit()
print(result.summary())

# Survival analysis (time-to-completion)
from lifelines import KaplanMeierFitter, CoxPHFitter

kmf = KaplanMeierFitter()
kmf.fit(df["days_to_complete"], event_observed=df["completed"])
kmf.plot_survival_function()

cox = CoxPHFitter()
cox.fit(df[["days_to_complete", "completed", "hours_per_week", "prior_score"]],
        duration_col="days_to_complete", event_col="completed")
cox.print_summary()

# Bayesian statistics with PyMC
import pymc as pm
import arviz as az

with pm.Model() as model:
    alpha = pm.Normal("alpha", mu=0, sigma=10)
    beta = pm.Normal("beta", mu=0, sigma=2, shape=X.shape[1])
    sigma = pm.HalfNormal("sigma", sigma=1)

    mu = alpha + pm.math.dot(X, beta)
    y_obs = pm.Normal("y_obs", mu=mu, sigma=sigma, observed=y)

    trace = pm.sample(1000, tune=500, target_accept=0.9, return_inferencedata=True)

az.plot_posterior(trace, var_names=["alpha", "beta"])
```
