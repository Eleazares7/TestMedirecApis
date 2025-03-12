import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

function App() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' o 'verify'
  const [message, setMessage] = useState('');

  // Enviar el email para recibir el OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('http://localhost:3000/2fa/send', { email });
      if (response.data.success) {
        setStep('verify');
        setMessage('Código enviado a tu correo. Revisa tu bandeja de entrada o spam.');
      }
    } catch (error) {
      setMessage('Error al enviar el código: ' + (error.response?.data?.error || error.message));
    }
  };

  // Verificar el código OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('http://localhost:3000/2fa/verify', { email, code });
      if (response.data.success) {
        setMessage('¡Verificación exitosa! Bienvenido.');
      } else {
        setMessage('Código inválido. Intenta de nuevo.');
      }
    } catch (error) {
      setMessage('Error al verificar: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Row>
        <Col md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="text-center mb-4">Verificación en Dos Pasos</Card.Title>

              {step === 'email' ? (
                <Form onSubmit={handleSendOTP}>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Correo Electrónico</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu_correo@example.com"
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100">
                    Enviar Código
                  </Button>
                </Form>
              ) : (
                <Form onSubmit={handleVerifyOTP}>
                  <Form.Group className="mb-3" controlId="code">
                    <Form.Label>Código OTP</Form.Label>
                    <Form.Control
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ingresa el código"
                      required
                    />
                  </Form.Group>
                  <Button variant="success" type="submit" className="w-100">
                    Verificar
                  </Button>
                </Form>
              )}

              {message && (
                <Alert
                  variant={
                    message.includes('Error') || message.includes('inválido')
                      ? 'danger'
                      : 'success'
                  }
                  className="mt-3"
                >
                  {message}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;