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

// Crea la carpeta documentos si no existe
if (!fs.existsSync(CARPETA_DOCS)) {
  fs.mkdirSync(CARPETA_DOCS);
}

app.post("/enviar", async (req, res) => {
  const datos = req.body;

  try {
    let existentes = [];

    // ✅ Lectura del JSON con codificación UTF-8
    if (fs.existsSync(RUTA_JSON)) {
      existentes = JSON.parse(fs.readFileSync(RUTA_JSON, "utf-8"));
    }

    existentes.push(datos);
    fs.writeFileSync(RUTA_JSON, JSON.stringify(existentes, null, 2));

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

async function enviarCorreo(archivoWord, datos) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "niicolas.emporiio@gmail.com",
      pass: "CLAVE_GENERADA" // Usa tu App Password real
    }
  });

  await transporter.sendMail({
    from: `"Formulario Web" <niicolas.emporiio@gmail.com>`,
    to: "niicolas.emporiio@gmail.com",
    subject: `Nuevo formulario: ${datos.nombreCompleto}`,
    text: "Adjunto encontrarás el formulario completado.",
    attachments: [
      {
        filename: path.basename(archivoWord),
        path: archivoWord
      }
    ]
  });
}
