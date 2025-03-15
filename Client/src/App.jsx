import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import './App.css';

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
        setMessage('✅ Código enviado a tu correo. Revisa tu bandeja de entrada o spam.');
      }
    } catch (error) {
      setMessage('❌ Error al enviar el código: ' + (error.response?.data?.error || error.message));
    }
  };

  // Verificar el código OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('http://localhost:3000/2fa/verify', { email, code });
      if (response.data.success) {
        setMessage('🎉 ¡Verificación exitosa! Bienvenido.');
      } else {
        setMessage('⚠️ Código inválido. Intenta de nuevo.');
      }
    } catch (error) {
      setMessage('❌ Error al verificar: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <Container fluid className="app-container">
      <Row>
        <Col md={6} lg={4}>
          <Card className="auth-card">
            <Card.Body>
              <Card.Title className="auth-card-title">
                🔒 Verificación en Dos Pasos
              </Card.Title>

              {step === 'email' ? (
                <Form onSubmit={handleSendOTP} className="auth-form">
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label className="auth-form-label">Correo Electrónico</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu_correo@example.com"
                      required
                      className="auth-form-input"
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100 auth-button">
                    📩 Enviar Código
                  </Button>
                </Form>
              ) : (
                <Form onSubmit={handleVerifyOTP} className="auth-form">
                  <Form.Group className="mb-3" controlId="code">
                    <Form.Label className="auth-form-label">Código OTP</Form.Label>
                    <Form.Control
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ingresa el código"
                      required
                      className="auth-form-input"
                    />
                  </Form.Group>
                  <Button variant="success" type="submit" className="w-100 auth-button">
                    ✅ Verificar
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
                  className="auth-alert"
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