import pickle
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- Initialize Flask App and CORS ---
# This sets up the server
app = Flask(__name__)
# CORS is needed to allow the React frontend to communicate with this backend
CORS(app)

# --- Load Pre-trained Model and Vectorizer ---
# These files must be in the same directory as this script
try:
    with open('model.pkl', 'rb') as model_file:
        model = pickle.load(model_file)
    with open('vectorizer.pkl', 'rb') as vectorizer_file:
        vectorizer = pickle.load(vectorizer_file)
except FileNotFoundError:
    print("Error: model.pkl or vectorizer.pkl not found.")
    print("Please make sure these files are in the 'api' directory.")
    # In a real deployment, you might want to handle this more gracefully
    exit()

# --- Text Preprocessing Function ---
# IMPORTANT: This function must be identical to the one used during training
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def clean_text(text):
    """
    Cleans text data for prediction, mirroring the training preprocessing.
    """
    text = str(text)
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    # Remove user @ references and # from tweet
    text = re.sub(r'\@\w+|\#','', text)
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # Convert to lowercase
    text = text.lower()
    # Tokenize and remove stopwords, then lemmatize
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return " ".join(tokens)

# --- API Endpoints ---

@app.route('/', methods=['GET'])
def home():
    """A simple route to confirm the API is running."""
    return "Sarcasm Detection API is live!"

@app.route('/predict', methods=['POST'])
def predict():
    """
    The main prediction endpoint.
    Expects a JSON payload with a "text" key.
    e.g., {"text": "This is just what I needed today."}
    """
    if not request.json or 'text' not in request.json:
        return jsonify({'error': 'Missing "text" key in request body'}), 400

    # Get text from the request
    user_text = request.json['text']
    
    # Clean the text
    cleaned_text = clean_text(user_text)
    
    # Vectorize the text using the loaded TF-IDF vectorizer
    vectorized_text = vectorizer.transform([cleaned_text])
    
    # Make a prediction using the loaded model
    prediction = model.predict(vectorized_text)
    probability = model.predict_proba(vectorized_text)
    
    # The model outputs 0 or 1. We convert this to a meaningful label.
    result_label = 'Sarcastic' if prediction[0] == 1 else 'Not Sarcastic'
    confidence = float(probability[0][prediction[0]])
    
    # Return the result as JSON
    return jsonify({
        'prediction': result_label,
        'confidence': f"{confidence:.2f}"
    })

# This is for local development. Vercel will use Gunicorn automatically.
if __name__ == '__main__':
    app.run(debug=True)
