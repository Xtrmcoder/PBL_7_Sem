import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Mic, Send, Server, BarChart2, Loader, Alert, AlertIcon } from 'lucide-react';

// --- Import Chakra UI Components ---
import {
  ChakraProvider,
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Grid,
  GridItem,
  Textarea,
  Button,
  Spinner,
  useToast,
  Tag,
  Flex,
  IconButton,
  Icon,
  extendTheme
} from '@chakra-ui/react';

// --- Smart API URL ---
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://127.0.0.1:5000';

// --- Data for Visualization ---
const chartData = [
  { name: 'Sarcastic', value: 507520 },
  { name: 'Not Sarcastic', value: 479653 },
];
const COLORS = ['#6B46C1', '#48BB78']; // Purple and Green theme

// Custom theme to match our colors
const theme = extendTheme({
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
});

const App = () => {
  return (
    // Wrap the entire app in the ChakraProvider
    <ChakraProvider theme={theme}>
      <SarcasmDetector />
    </ChakraProvider>
  );
};

const SarcasmDetector = () => {
  // --- State Management ---
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const toast = useToast();

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
      recognition.onerror = (event) => toast({ title: "Voice Error", description: event.error, status: "error", duration: 5000, isClosable: true });
      
      recognitionRef.current = recognition;

      return () => recognition.stop();
    }
  }, [toast]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast({ title: "Input required", description: "Please enter text to analyze.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setIsLoading(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, { text });
      setResult(response.data);
    } catch (err) {
      toast({ title: "Connection Error", description: "Failed to connect to the model.", status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
        toast({ title: "Unsupported", description: "Speech recognition is not supported in this browser.", status: "error", duration: 5000, isClosable: true });
        return;
    }
    isRecording ? recognition.stop() : recognition.start();
  };

  return (
    <Box bg="gray.50" minH="100vh" py={10}>
      <Container maxW="container.xl">
        <VStack spacing={4} textAlign="center" mb={10}>
          <Heading as="h1" size="2xl" color="gray.700">
            Sarcasm Detector
          </Heading>
          <Text fontSize="lg" color="gray.500">
            Analyze text with a machine learning model, now with a more beautiful UI.
          </Text>
        </VStack>

        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={8}>
          <GridItem>
            <Box bg="white" p={6} borderRadius="xl" boxShadow="md">
              <Heading as="h2" size="lg" mb={4}>Enter Text</Heading>
              <VStack spacing={4}>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type or paste your text here..."
                  size="lg"
                  h="150px"
                  focusBorderColor="purple.500"
                />
                <Flex w="100%" justify="space-between">
                  <IconButton
                    aria-label="Record voice"
                    icon={<Icon as={Mic} />}
                    isRound
                    size="lg"
                    colorScheme={isRecording ? "red" : "gray"}
                    onClick={handleVoiceRecording}
                    isLoading={isRecording}
                  />
                  <Button
                    rightIcon={<Icon as={Send} />}
                    colorScheme="purple"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                  >
                    Analyze
                  </Button>
                </Flex>
              </VStack>
              {result && (
                <Box
                  mt={6} p={4} borderRadius="lg"
                  bg={result.prediction === 'Sarcastic' ? 'purple.100' : 'green.100'}
                >
                  <Heading size="md" color={result.prediction === 'Sarcastic' ? 'purple.800' : 'green.800'}>
                    Result: {result.prediction}
                  </Heading>
                  <Text color={result.prediction === 'Sarcastic' ? 'purple.600' : 'green.600'}>
                    Confidence: {Math.round(parseFloat(result.confidence) * 100)}%
                  </Text>
                </Box>
              )}
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="white" p={6} borderRadius="xl" boxShadow="md" h="100%">
              <Heading as="h2" size="lg" mb={4} display="flex" alignItems="center">
                <Icon as={BarChart2} mr={2} color="purple.500" />
                Dataset Overview
              </Heading>
              <Box w="100%" h="300px">
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
             </Box>
            </Box>
          </GridItem>
        </Grid>
        
        <Tag position="absolute" top={4} right={4} colorScheme={apiStatus === 'online' ? 'green' : 'red'}>
          <Icon as={apiStatus === 'checking' ? Loader : Server} mr={2} />
          API: {apiStatus}
        </Tag>
      </Container>
    </Box>
  );
};

export default App;
