import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
# --- UPDATED: Switched to a more powerful model and added correct callback import ---
from lightgbm import LGBMClassifier, early_stopping
from sklearn.metrics import accuracy_score, classification_report
import pickle

# --- Download NLTK data (only needs to be done once) ---
try:
    stopwords.words('english')
except LookupError:
    print("Downloading NLTK stopwords...")
    nltk.download('stopwords')
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    print("Downloading NLTK wordnet...")
    nltk.download('wordnet')

# --- 1. Load and Inspect the Dataset ---
print("Loading dataset...")
try:
    df = pd.read_csv('final_combined_sarcasm.csv')
except FileNotFoundError:
    print("Error: 'final_combined_sarcasm.csv' not found.")
    print("Please make sure the CSV file is in the same directory as this script.")
    exit()

TEXT_COLUMN = 'comment'
LABEL_COLUMN = 'label'

if TEXT_COLUMN not in df.columns or LABEL_COLUMN not in df.columns:
    print(f"Error: Make sure your CSV has columns named '{TEXT_COLUMN}' and '{LABEL_COLUMN}'.")
    print(f"Current columns are: {df.columns.tolist()}")
    exit()
    
df.dropna(subset=[TEXT_COLUMN, LABEL_COLUMN], inplace=True)

# --- 2. Convert Labels to Binary (0 or 1) ---
print("Converting labels to integers (0 and 1)...")
df[LABEL_COLUMN] = df[LABEL_COLUMN].astype(int)

label_counts = df[LABEL_COLUMN].value_counts()
print("Label counts (0=Not Sarcastic, 1=Sarcastic):")
print(label_counts)
print("------------------------\n")

if len(label_counts) < 2:
    print("ERROR: The dataset still contains only one class after processing.")
    exit()


# --- 3. Preprocess and Clean the Text Data ---
print("Cleaning and preprocessing text data...")
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def clean_text(text):
    text = str(text)
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\@\w+|\#','', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = text.lower()
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return " ".join(tokens)

df['cleaned_text'] = df[TEXT_COLUMN].apply(clean_text)


# --- 4. Feature Extraction (TF-IDF with N-grams) ---
print("Vectorizing text with TF-IDF (including bigrams)...")
vectorizer = TfidfVectorizer(
    max_features=10000, # Increased features
    ngram_range=(1, 2)    # Using unigrams and bigrams
)
X = vectorizer.fit_transform(df['cleaned_text'])
y = df[LABEL_COLUMN]


# --- 5. Split Data and Train the Model ---
print("Splitting data and training the tuned LGBM model...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# --- UPDATED: Using LGBMClassifier with tuned hyperparameters for better accuracy ---
model = LGBMClassifier(
    objective='binary',      # Specifies the task is binary classification
    n_estimators=1000,       # Builds 1000 trees (more learning)
    learning_rate=0.05,      # How quickly the model learns
    num_leaves=31,           # Number of leaves in one tree
    class_weight='balanced', # Helps with slightly imbalanced data
    random_state=42,
    n_jobs=-1,               # Use all available CPU cores
    colsample_bytree=0.8,    # Subsample columns for each tree to prevent overfitting
    subsample=0.8            # Subsample rows for each tree
)
# Adding a validation set to stop training early if performance stops improving
# --- FIXED: Using the correct early_stopping callback from lightgbm ---
model.fit(X_train, y_train,
          eval_set=[(X_test, y_test)],
          eval_metric='accuracy',
          callbacks=[early_stopping(stopping_rounds=10, verbose=False)])


# --- 6. Evaluate the Model ---
print("Evaluating model performance...")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Not Sarcastic', 'Sarcastic']))


# --- 7. Save the Model and Vectorizer ---
print("Saving the trained model and vectorizer to disk...")
with open('model.pkl', 'wb') as model_file:
    pickle.dump(model, model_file)

with open('vectorizer.pkl', 'wb') as vectorizer_file:
    pickle.dump(vectorizer, vectorizer_file)

print("\nSuccess! 'model.pkl' and 'vectorizer.pkl' have been recreated with the new model.")
print("You are now ready for Part 2: Building the Backend API.")
