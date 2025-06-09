const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { generarWord } = require("./wordGenerator");
const nodemailer = require("nodemailer");
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const RUTA_JSON = path.join(__dirname, "datos.json");
const CARPETA_DOCS = path.join(__dirname, "documentos");

// Crear carpeta documentos si no existe
if (!fs.existsSync(CARPETA_DOCS)) {
  fs.mkdirSync(CARPETA_DOCS);
}
// Crear datos.json si no existe
if (!fs.existsSync(RUTA_JSON)) {
  fs.writeFileSync(RUTA_JSON, "[]");
}

// Función para generar PDF con pdf-lib
async function generarPDF(datos, carpeta) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 750]);
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  const { width, height } = page.getSize();
  let y = height - 40;
  const fontSize = 12;

  function escribir(text) {
    page.drawText(text, {
      x: 50,
      y,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    y -= fontSize + 5;
  }

  escribir("Formulario de Datos");
  escribir("--------------------");
  escribir(`Nombre completo: ${datos.nombreCompleto || "-"}`);
  escribir(`Calle: ${datos.calle || "-"}`);
  escribir(`Número: ${datos.numero || "-"}`);
  escribir(`Piso: ${datos.piso || "-"}`);
  escribir(`Depto: ${datos.depto || "-"}`);
  escribir(`CP: ${datos.cp || "-"}`);
  escribir(`Barrio: ${datos.barrio || "-"}`);
  escribir(`Localidad: ${datos.localidad || "-"}`);
  escribir(`Provincia: ${datos.provincia || "-"}`);
  escribir(`Entre calles: ${datos.entreCalles || "-"}`);
  escribir(`Estado civil: ${datos.estadoCivil || "-"}`);
  escribir(`Celular: ${datos.celular || "-"}`);
  escribir(`Email: ${datos.email || "-"}`);
  escribir(`Tel. emergencia: ${datos.emergenciaNumero || "-"}`);
  escribir(`Nombre de contacto: ${datos.emergenciaNombre || "-"}`);
  escribir(`Parentesco: ${datos.emergenciaParentesco || "-"}`);

  if (datos.familiares && datos.familiares.length) {
    y -= 15;
    escribir("Familiares:");
    datos.familiares.forEach(f => {
      escribir(`- ${f.nombre || "-"} (${f.parentesco || "-"}) - Nac: ${f.fechaNacimiento || "-"}, DNI: ${f.dni || "-"}`);
    });
  }

  y -= 10;
  escribir(`Primario: ${datos.primario ? "Sí" : "No"}`);
  escribir(`Título primario: ${datos.tituloPrimario || "-"}`);
  escribir(`Secundario: ${datos.secundario ? "Sí" : "No"}`);
  escribir(`Título secundario: ${datos.tituloSecundario || "-"}`);
  escribir(`Terciario: ${datos.terciario ? "Sí" : "No"}`);
  escribir(`Título terciario: ${datos.tituloTerciario || "-"}`);
  escribir(`Universitario: ${datos.universitario ? "Sí" : "No"}`);
  escribir(`Título universitario: ${datos.tituloUniversitario || "-"}`);
  escribir(`Otros cursos: ${datos.otrosCursos || "-"}`);
  escribir(`Habilidades: ${datos.habilidades || "-"}`);
  escribir(`Firma: ${datos.firma || "-"}`);
  escribir(`Aclaración: ${datos.aclaracion || "-"}`);
  escribir(`Fecha: ${datos.fecha || "-"}`);

  const pdfBytes = await pdfDoc.save();
  const nombreLimpio = datos.nombreCompleto ? datos.nombreCompleto.replace(/\s+/g, "_").toLowerCase() : "sin_nombre";
  const ruta = path.join(carpeta, `${nombreLimpio}_${Date.now()}.pdf`);
  fs.writeFileSync(ruta, pdfBytes);
  return ruta;
}

// Función para generar Excel con xlsx
function generarExcel(datos, carpeta) {
  const wb = XLSX.utils.book_new();

  const familiares = (datos.familiares || []).map(f => ({
    Nombre: f.nombre || "-",
    Parentesco: f.parentesco || "-",
    'Fecha Nacimiento': f.fechaNacimiento || "-",
    DNI: f.dni || "-"
  }));

  const mainData = [{
    "Nombre completo": datos.nombreCompleto || "-",
    "Calle": datos.calle || "-",
    "Número": datos.numero || "-",
    "Piso": datos.piso || "-",
    "Depto": datos.depto || "-",
    "CP": datos.cp || "-",
    "Barrio": datos.barrio || "-",
    "Localidad": datos.localidad || "-",
    "Provincia": datos.provincia || "-",
    "Entre calles": datos.entreCalles || "-",
    "Estado civil": datos.estadoCivil || "-",
    "Celular": datos.celular || "-",
    "Email": datos.email || "-",
    "Tel. emergencia": datos.emergenciaNumero || "-",
    "Nombre de contacto": datos.emergenciaNombre || "-",
    "Parentesco contacto": datos.emergenciaParentesco || "-",
    "Primario": datos.primario ? "Sí" : "No",
    "Título primario": datos.tituloPrimario || "-",
    "Secundario": datos.secundario ? "Sí" : "No",
    "Título secundario": datos.tituloSecundario || "-",
    "Terciario": datos.terciario ? "Sí" : "No",
    "Título terciario": datos.tituloTerciario || "-",
    "Universitario": datos.universitario ? "Sí" : "No",
    "Título universitario": datos.tituloUniversitario || "-",
    "Otros cursos": datos.otrosCursos || "-",
    "Habilidades": datos.habilidades || "-",
    "Firma": datos.firma || "-",
    "Aclaración": datos.aclaracion || "-",
    "Fecha": datos.fecha || "-"
  }];

  const wsDatos = XLSX.utils.json_to_sheet(mainData);
  XLSX.utils.book_append_sheet(wb, wsDatos, "Datos Principales");

  if (familiares.length > 0) {
    const wsFam = XLSX.utils.json_to_sheet(familiares);
    XLSX.utils.book_append_sheet(wb, wsFam, "Familiares");
  }

  const nombreLimpio = datos.nombreCompleto ? datos.nombreCompleto.replace(/\s+/g, "_").toLowerCase() : "sin_nombre";
  const ruta = path.join(carpeta, `${nombreLimpio}_${Date.now()}.xlsx`);
  XLSX.writeFile(wb, ruta);
  return ruta;
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

    // Generar archivos
    const archivoWord = await generarWord(datos, CARPETA_DOCS);
    const archivoPDF = await generarPDF(datos, CARPETA_DOCS);
    const archivoExcel = generarExcel(datos, CARPETA_DOCS);

    // Enviar correo con adjuntos
    await enviarCorreoConAdjuntos([archivoWord, archivoPDF, archivoExcel], datos);

    res.status(200).send({ mensaje: "Datos recibidos y archivos generados correctamente" });
  } catch (error) {
    console.error("Error al procesar formulario:", error);
    res.status(500).send({ error: "Ocurrió un error en el servidor" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Enviar correo con múltiples adjuntos
async function enviarCorreoConAdjuntos(archivos, datos) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "niicolas.emporiio@gmail.com",
      pass: "jibw tbsk uwlh wgdj" // App Password
    }
  });

  const adjuntos = archivos.map(ruta => ({
    filename: path.basename(ruta),
    path: ruta
  }));

  await transporter.sendMail({
    from: `"Formulario Web" <niicolas.emporiio@gmail.com>`,
    to: "niicolas.emporiio@gmail.com",
    subject: `Nuevo formulario: ${datos.nombreCompleto || "Sin nombre"}`,
    text: "Adjunto encontrarás el formulario completado en varios formatos.",
    attachments: adjuntos
  });
}
