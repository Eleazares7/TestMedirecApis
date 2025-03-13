import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

function App() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' o 'verify'
  const [message, setMessage] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');

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

  // Cargar el SDK de PayPal y configurar los botones
  useEffect(() => {
    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!paypalClientId) {
      setPaymentMessage('Error: El Client ID de PayPal no está configurado en el archivo .env');
      return;
    }

    const existingScript = document.querySelector('script[src^="https://www.paypal.com/sdk/js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
      script.async = true;
      script.onload = () => {
        if (!window.paypal) {
          setPaymentMessage('Error: No se pudo cargar el SDK de PayPal');
          return;
        }

        window.paypal
          .Buttons({
            createOrder: async () => {
              try {
                const response = await axios.post('http://localhost:3000/api/create-order');
                return response.data.orderID || ''; // Retorna un string vacío si falla
              } catch (error) {
                setPaymentMessage('Error al crear la orden: ' + (error.response?.data?.error || error.message));
                return '';
              }
            },
            onApprove: async (data) => {
              try {
                const response = await axios.post('http://localhost:3000/api/capture-order', {
                  orderID: data.orderID,
                });
                if (response.data.status === 'COMPLETED') {
                  setPaymentMessage('¡Pago exitoso! Gracias por tu compra.');
                } else {
                  setPaymentMessage('Error al procesar el pago: ' + response.data.status);
                }
              } catch (error) {
                setPaymentMessage('Error al capturar el pago: ' + (error.response?.data?.error || error.message));
              }
            },
            onError: (err) => {
              setPaymentMessage('Error en el proceso de pago: ' + err.message);
            },
          })
          .render('#paypal-button-container')
          .catch((err) => {
            setPaymentMessage('Error al renderizar los botones de PayPal: ' + err.message);
          });
      };
      script.onerror = () => {
        setPaymentMessage('Error al cargar el script del SDK de PayPal');
      };
      document.body.appendChild(script);
    }

    return () => {
      const paypalScript = document.querySelector('script[src^="https://www.paypal.com/sdk/js"]');
      if (paypalScript) {
        paypalScript.remove();
      }
    };
  }, []);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        {/* Sección de Verificación 2FA */}
        <Col md={6} lg={4}>
          <Card className="shadow-sm mb-4">
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
                  variant={message.includes('Error') || message.includes('inválido') ? 'danger' : 'success'}
                  className="mt-3"
                >
                  {message}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sección de Pago con PayPal */}
        <Col md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="text-center mb-4">Pagar con PayPal</Card.Title>
              <p className="text-center">Realiza un pago de $10 USD</p>
              <div id="paypal-button-container" className="text-center"></div>
              {paymentMessage && (
                <Alert
                  variant={paymentMessage.includes('Error') ? 'danger' : 'success'}
                  className="mt-3"
                >
                  {paymentMessage}
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
