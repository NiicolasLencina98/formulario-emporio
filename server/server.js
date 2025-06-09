const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = require("docx");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const RUTA_JSON = path.join(__dirname, "datos.json");
const CARPETA_DOCS = path.join(__dirname, "documentos");

if (!fs.existsSync(CARPETA_DOCS)) fs.mkdirSync(CARPETA_DOCS);
if (!fs.existsSync(RUTA_JSON)) fs.writeFileSync(RUTA_JSON, "[]");

// --- Generar Word con estilo ---
async function generarWord(datos, carpeta) {
  const agregarTitulo = (texto) =>
    new Paragraph({
      children: [new TextRun({ text: texto, bold: true, size: 32, color: "2E74B5" })],
      spacing: { after: 300 },
    });

  const agregarCampo = (label, valor) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, color: "1F4E79" }),
        new TextRun(valor || "-"),
      ],
      spacing: { after: 150 },
    });

  function tablaFamiliares(familiares) {
    if (!familiares || familiares.length === 0) return [];
    const filas = familiares.map(f =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(f.nombre || "-")], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph(f.parentesco || "-")], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph(f.fechaNacimiento || "-")], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph(f.dni || "-")], width: { size: 25, type: WidthType.PERCENTAGE } }),
        ],
      })
    );
    return [
      new Paragraph({ text: "Familiares", bold: true, spacing: { after: 200 } }),
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Nombre")], shading: { fill: "D9E1F2" } }),
              new TableCell({ children: [new Paragraph("Parentesco")], shading: { fill: "D9E1F2" } }),
              new TableCell({ children: [new Paragraph("Fecha Nac.")], shading: { fill: "D9E1F2" } }),
              new TableCell({ children: [new Paragraph("DNI")], shading: { fill: "D9E1F2" } }),
            ],
          }),
          ...filas,
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph(""),
    ];
  }

  const contenido = [
    agregarTitulo("Formulario de Datos"),
    agregarCampo("Nombre completo", datos.nombreCompleto),
    agregarCampo("Calle", datos.calle),
    agregarCampo("Número", datos.numero),
    agregarCampo("Piso", datos.piso),
    agregarCampo("Depto", datos.depto),
    agregarCampo("CP", datos.cp),
    agregarCampo("Barrio", datos.barrio),
    agregarCampo("Localidad", datos.localidad),
    agregarCampo("Provincia", datos.provincia),
    agregarCampo("Entre calles", datos.entreCalles),
    agregarCampo("Estado civil", datos.estadoCivil),
    agregarCampo("Celular", datos.celular),
    agregarCampo("Email", datos.email),
    agregarCampo("Tel. emergencia", datos.emergenciaNumero),
    agregarCampo("Nombre de contacto", datos.emergenciaNombre),
    agregarCampo("Parentesco", datos.emergenciaParentesco),
    ...tablaFamiliares(datos.familiares),
    agregarCampo("Primario", datos.primario ? "Sí" : "No"),
    agregarCampo("Título primario", datos.tituloPrimario),
    agregarCampo("Secundario", datos.secundario ? "Sí" : "No"),
    agregarCampo("Título secundario", datos.tituloSecundario),
    agregarCampo("Terciario", datos.terciario ? "Sí" : "No"),
    agregarCampo("Título terciario", datos.tituloTerciario),
    agregarCampo("Universitario", datos.universitario ? "Sí" : "No"),
    agregarCampo("Título universitario", datos.tituloUniversitario),
    agregarCampo("Otros cursos", datos.otrosCursos),
    agregarCampo("Habilidades", datos.habilidades),
    agregarCampo("Firma", datos.firma),
    agregarCampo("Aclaración", datos.aclaracion),
    agregarCampo("Fecha", datos.fecha),
  ];

  const doc = new Document({
    creator: "Mi Aplicación",
    title: "Formulario de Datos",
    description: "Documento generado con docx",
    sections: [{ children: contenido }],
  });

  const buffer = await Packer.toBuffer(doc);
  const nombreLimpio = datos.nombreCompleto ? datos.nombreCompleto.replace(/\s+/g, "_").toLowerCase() : "sin_nombre";
  const ruta = path.join(carpeta, `${nombreLimpio}_${Date.now()}.docx`);
  fs.writeFileSync(ruta, buffer);
  return ruta;
}

// --- Generar PDF con pdfkit ---
function generarPDF(datos, carpeta) {
  return new Promise((resolve, reject) => {
    const nombreLimpio = datos.nombreCompleto ? datos.nombreCompleto.replace(/\s+/g, "_").toLowerCase() : "sin_nombre";
    const ruta = path.join(carpeta, `${nombreLimpio}_${Date.now()}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(ruta);
    doc.pipe(stream);

    doc.fillColor("#2E74B5").fontSize(20).text("Formulario de Datos", { align: "center" }).moveDown();

    function campo(label, valor) {
      doc.fillColor("#1F4E79").font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.fillColor("black").font("Helvetica").text(valor || "-").moveDown(0.5);
    }

    campo("Nombre completo", datos.nombreCompleto);
    campo("Calle", datos.calle);
    campo("Número", datos.numero);
    campo("Piso", datos.piso);
    campo("Depto", datos.depto);
    campo("CP", datos.cp);
    campo("Barrio", datos.barrio);
    campo("Localidad", datos.localidad);
    campo("Provincia", datos.provincia);
    campo("Entre calles", datos.entreCalles);
    campo("Estado civil", datos.estadoCivil);
    campo("Celular", datos.celular);
    campo("Email", datos.email);
    campo("Tel. emergencia", datos.emergenciaNumero);
    campo("Nombre de contacto", datos.emergenciaNombre);
    campo("Parentesco", datos.emergenciaParentesco);

    if (datos.familiares && datos.familiares.length > 0) {
      doc.fillColor("#2E74B5").fontSize(16).text("Familiares", { underline: true });
      datos.familiares.forEach(f => {
        doc.fillColor("black").fontSize(12).text(`${f.nombre || "-"} (${f.parentesco || "-"}) - Nac: ${f.fechaNacimiento || "-"}, DNI: ${f.dni || "-"}`);
      });
      doc.moveDown();
    }

    campo("Primario", datos.primario ? "Sí" : "No");
    campo("Título primario", datos.tituloPrimario);
    campo("Secundario", datos.secundario ? "Sí" : "No");
    campo("Título secundario", datos.tituloSecundario);
    campo("Terciario", datos.terciario ? "Sí" : "No");
    campo("Título terciario", datos.tituloTerciario);
    campo("Universitario", datos.universitario ? "Sí" : "No");
    campo("Título universitario", datos.tituloUniversitario);
    campo("Otros cursos", datos.otrosCursos);
    campo("Habilidades", datos.habilidades);
    campo("Firma", datos.firma);
    campo("Aclaración", datos.aclaracion);
    campo("Fecha", datos.fecha);

    doc.end();
    stream.on("finish", () => resolve(ruta));
    stream.on("error", reject);
  });
}

// --- Enviar correo con adjuntos ---
async function enviarCorreo(archivos, datos) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "niicolas.emporiio@gmail.com",
      pass: "jibw tbsk uwlh wgdj", // tu app password
    },
  });

  await transporter.sendMail({
    from: `"Formulario Web" <niicolas.emporiio@gmail.com>`,
    to: "niicolas.emporiio@gmail.com",
    subject: `Nuevo formulario: ${datos.nombreCompleto}`,
    text: "Adjunto encontrarás los documentos generados del formulario completado.",
    attachments: archivos.map((archivo) => ({
      filename: path.basename(archivo),
      path: archivo,
    })),
  });
}

// --- Endpoint para recibir datos ---
app.post("/enviar", async (req, res) => {
  const datos = req.body;

  try {
    let existentes = [];

    if (fs.existsSync(RUTA_JSON)) {
      try {
        const contenido = fs.readFileSync(RUTA_JSON, "utf8");
        existentes = JSON.parse(contenido);
      } catch (e) {
        existentes = [];
      }
    }

    existentes.push(datos);
    fs.writeFileSync(RUTA_JSON, JSON.stringify(existentes, null, 2));

    // Generar documentos
    const wordPath = await generarWord(datos, CARPETA_DOCS);
    const pdfPath = await generarPDF(datos, CARPETA_DOCS);

    // Enviar email con ambos documentos
    await enviarCorreo([wordPath, pdfPath], datos);

    res.json({ success: true, message: "Datos recibidos, documentos generados y enviados." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al procesar los datos." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
