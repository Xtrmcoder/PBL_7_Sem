import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Mic, Send, Server, BarChart2, Activity, AlertTriangle } from 'lucide-react';

// Import React-Bootstrap components
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';

// --- Smart API URL ---
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://127.0.0.1:5000';

// --- Data for Visualization ---
const chartData = [
  { name: 'Sarcastic', value: 507520 },
  { name: 'Not Sarcastic', value: 479653 },
];
const COLORS = ['#6f42c1', '#198754']; // Bootstrap Purple and Green

const App = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  const recognitionRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/`)
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event) => setText(event.results[0][0].transcript);
      recognition.onerror = (event) => setError(`Voice recognition error: ${event.error}`);
      
      recognitionRef.current = recognition;
      return () => recognition.stop();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please enter text to analyze.");
      return;
    }
    setIsLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, { text });
      setResult(response.data);
    } catch (err) {
      setError("Failed to connect to the model. Please ensure the API is running and refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    isRecording ? recognition.stop() : recognition.start();
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold">Sarcasm Detector</h1>
          <p className="lead text-muted">A new look with React-Bootstrap</p>
        </div>

        <Row className="g-4">
          <Col lg={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-4">
                <Card.Title as="h2" className="mb-4">Enter Text</Card.Title>
                <Form onSubmit={handleSubmit}>
                  <Form.Group>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type or paste text here..."
                      className="mb-3"
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-between">
                    <Button variant={isRecording ? "danger" : "secondary"} onClick={handleVoiceRecording} className="rounded-circle p-2 lh-1">
                      {isRecording ? <Spinner as="span" animation="grow" size="sm" /> : <Mic size={20} />}
                    </Button>
                    <Button variant="primary" type="submit" disabled={isLoading}>
                      {isLoading ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : <Send size={20} className="me-2" />}
                      Analyze
                    </Button>
                  </div>
                </Form>
                {error && <Alert variant="danger" className="mt-4 d-flex align-items-center"><AlertTriangle size={20} className="me-2"/>{error}</Alert>}
                {result && (
                  <Alert variant={result.prediction === 'Sarcastic' ? 'warning' : 'success'} className="mt-4">
                    <Alert.Heading>Result: {result.prediction}</Alert.Heading>
                    <p>Confidence: {Math.round(parseFloat(result.confidence) * 100)}%</p>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-4">
                <Card.Title as="h2" className="mb-4 d-flex align-items-center">
                  <BarChart2 size={24} className="text-primary me-2" />
                  Dataset Overview
                </Card.Title>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <div className="position-absolute top-0 end-0 p-3">
          <Badge bg={apiStatus === 'online' ? 'success' : 'danger'}>
            <div className="d-flex align-items-center">
              {apiStatus === 'checking' ? <Activity size={16} className="me-1"/> : <Server size={16} className="me-1" />}
              API: {apiasiStatus}
            </div>
          </Badge>
        </div>
      </Container>
    </div>
  );
};

export default App;
