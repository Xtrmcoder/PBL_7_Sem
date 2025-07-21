import pandas as pd


df = pd.read_csv("train-balanced-sarcasm.csv", low_memory=False)


df = df.dropna(subset=['comment'])


if 'label' in df.columns:
    df = df[['comment', 'label']]


df = df.drop_duplicates()

# Save cleaned data
df.to_csv("cleaned_sarcasm.csv", index=False)

print("Cleaned data saved as cleaned_sarcasm.csv")
