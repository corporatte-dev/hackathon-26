from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.neighbors import KNeighborsClassifier

app = Flask(__name__)
CORS(app)

df = pd.read_csv('Crop_recommendation.csv')
X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y = df['label']

model = KNeighborsClassifier(n_neighbors=3)
model.fit(X, y)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    input_data = [[
        data['N'], data['P'], data['K'], 
        data['temperature'], data['humidity'], 
        data['ph'], data['rainfall']
    ]]
    prediction = model.predict(input_data)
    return jsonify({'crop': prediction[0]})

if __name__ == '__main__':
    app.run(debug=True, port=5000)