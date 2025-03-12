import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import paypal from '@paypal/checkout-server-sdk';

// Importamos desde los submódulos específicos
const { SandboxEnvironment, PayPalHttpClient } = paypal.core;
const { OrdersCreateRequest, OrdersCaptureRequest } = paypal.orders;

const app = express();

app.use(cors());
app.use(express.json());

// Configurar transporte SMTP con Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Almacenar códigos OTP con expiración
const otpStore = {};

// Generar un código OTP de 6 dígitos
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Ruta 1: Enviar OTP por correo con HTML
app.post('/2fa/send', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email requerido' });
  }

  const otp = generateOTP();
  otpStore[email] = { code: otp, expires: Date.now() + 5 * 60 * 1000 }; // Expira en 5 minutos

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Tu código de verificación',
    text: `Tu código OTP es: ${otp}. Válido por 5 minutos.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <h2 style="color: #333;">Verificación en Dos Pasos</h2>
        <p style="color: #666;">Hola, aquí está tu código de verificación para acceder a tu cuenta:</p>
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h3 style="color: #007bff; font-size: 24px; margin: 0;">${otp}</h3>
          <p style="color: #666; font-size: 14px;">Este código es válido por 5 minutos.</p>
        </div>
        <p style="color: #666; margin-top: 20px;">Si no solicitaste este código, ignora este correo.</p>
        <div style="margin-top: 20px;">
          <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Verificar Ahora</a>
        </div>
        <footer style="margin-top: 20px; font-size: 12px; color: #999;">
          <p>© 2025 Tu Aplicación. Todos los derechos reservados.</p>
        </footer>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Código enviado al correo' });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta 2: Verificar el OTP
app.post('/2fa/verify', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email y código requeridos' });
  }

  const storedOtp = otpStore[email];
  if (!storedOtp) {
    return res.status(400).json({ success: false, message: 'No hay código generado para este email' });
  }

  if (Date.now() > storedOtp.expires) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'Código expirado' });
  }

  if (storedOtp.code === code) {
    delete otpStore[email];
    res.json({ success: true, message: 'Verificación exitosa' });
  } else {
    res.json({ success: false, message: 'Código inválido' });
  }
});

// Configuración de PayPal
const environment = new SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new PayPalHttpClient(environment);

// Ruta 3: Crear una orden de PayPal
app.post('/api/create-order', async (req, res) => {
  const request = new OrdersCreateRequest();
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: '10.00',
        },
      },
    ],
  });

  try {
    const response = await client.execute(request);
    res.json({ orderID: response.result.id });
  } catch (error) {
    console.error('Error al crear orden de PayPal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta 4: Capturar la orden de PayPal
app.post('/api/capture-order', async (req, res) => {
  const { orderID } = req.body;
  if (!orderID) {
    return res.status(400).json({ error: 'OrderID requerido' });
  }

  const request = new OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const response = await client.execute(request);
    res.json({ status: response.result.status });
  } catch (error) {
    console.error('Error al capturar orden de PayPal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});