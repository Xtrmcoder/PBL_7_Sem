import pandas as pd

# Load both cleaned sarcasm datasets
df1 = pd.read_csv("cleaned_sarcasm.csv")              # From your original dataset
df2 = pd.read_csv("cleaned_sarcasm_dataset_2.csv")    # From your second figurative dataset

# Combine the datasets
combined = pd.concat([df1, df2], ignore_index=True)

# Remove any duplicate rows
combined = combined.drop_duplicates()

# Save the combined dataset
combined.to_csv("final_combined_sarcasm.csv", index=False)

# Print confirmation (without Unicode symbols)
print("Combined dataset saved as final_combined_sarcasm.csv")
