import pandas as pd

# Load the data
df = pd.read_csv("train.csv")

# Rename columns (optional but helpful)
df = df.rename(columns={"tweets": "comment", "class": "label"})

# Map string labels to binary
df["label"] = df["label"].map({
    "figurative": 1,
    "non-figurative": 0
})

# Drop rows with missing or unmapped labels
df = df.dropna(subset=["comment", "label"])

# Drop duplicates (optional)
df = df.drop_duplicates()

# Save cleaned data
df.to_csv("cleaned_sarcasm_dataset_2.csv", index=False)

print("Cleaned dataset saved as cleaned_sarcasm_dataset_2.csv")
