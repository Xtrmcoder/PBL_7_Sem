import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# --- NLTK Setup ---
# These downloads are only needed the first time you run the script.
try:
    stopwords.words("english")
except LookupError:
    nltk.download("stopwords")
try:
    # This is needed for the lemmatizer
    nltk.data.find('corpora/wordnet.zip')
except LookupError:
    nltk.download("wordnet")

# --- Data and Function Definition ---
stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

def clean_text(text):
    """A function to clean raw text data."""
    text = str(text).lower()  # Ensure input is a string and lowercase
    text = re.sub(r"http\S+|www\S+|@\S+|#\S+", "", text)  # Remove links, mentions, hashtags
    text = re.sub(r"[^a-zA-Z\s]", "", text)  # Keep only letters and whitespace
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return " ".join(tokens)

# --- Create a DataFrame and Apply the Function ---
# Create a sample DataFrame for demonstration
data = {'comment': [
    "This is a GREAT product! I love it. Check it out at www.example.com #awesome",
    "Useless item, @company should be ashamed. 10/10 would NOT recommend.",
    "I've been using this for weeks and the results are amazing.",
    "The customer service was running late and wasn't helpful."
]}
df = pd.DataFrame(data)

# Apply your function to the 'comment' column
df["cleaned_comment"] = df["comment"].apply(clean_text)

# Display the result
print(df)