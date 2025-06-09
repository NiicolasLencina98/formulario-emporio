const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { generarWord } = require("./wordGenerator");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const RUTA_JSON = path.join(__dirname, "datos.json");
const CARPETA_DOCS = path.join(__dirname, "documentos");

// Crear carpeta de documentos si no existe
if (!fs.existsSync(CARPETA_DOCS)) {
  fs.mkdirSync(CARPETA_DOCS);
}

// Crear datos.json si no existe
if (!fs.existsSync(RUTA_JSON)) {
  fs.writeFileSync(RUTA_JSON, "[]");
}

app.post("/enviar", async (req, res) => {
  const datos = req.body;

  try {
    let existentes = [];

    // Leer y validar JSON
    if (fs.existsSync(RUTA_JSON)) {
      try {
        const contenido = fs.readFileSync(RUTA_JSON, "utf8");
        existentes = JSON.parse(contenido);
      } catch (err) {
        console.error("JSON inválido, se reinicia:", err);
        existentes = [];
      }
    }

    // Agregar nuevo dato y guardar
    existentes.push(datos);
    fs.writeFileSync(RUTA_JSON, JSON.stringify(existentes, null, 2));

    // Generar Word y enviar por mail
    const archivoWord = await generarWord(datos, CARPETA_DOCS);
    await enviarCorreo(archivoWord, datos);

    res.status(200).send({ mensaje: "Datos recibidos correctamente" });
  } catch (error) {
    console.error("Error al procesar formulario:", error);
    res.status(500).send({ error: "Ocurrió un error en el servidor" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Función para enviar el correo
async function enviarCorreo(archivoWord, datos) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "niicolas.emporiio@gmail.com",
      pass: "CLAVE_GENERADA" // Reemplazá con tu App Password
    }
  });

  await transporter.sendMail({
    from: `"Formulario Web" <niicolas.emporiio@gmail.com>`,
    to: "niicolas.emporiio@gmail.com",
    subject: `Nuevo formulario: ${datos.nombreCompleto}`,
    text: "Adjunto encontrarás el formulario completado.",
    attachments: [{
      filename: path.basename(archivoWord),
      path: archivoWord
    }]
  });
}
