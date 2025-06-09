const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

async function generarWord(datos, carpeta) {
  const agregar = (label, valor) =>
    new Paragraph({ children: [new TextRun(`${label}: ${valor || "-"}`)] });

  const contenido = [
    new Paragraph({ children: [new TextRun({ text: "Formulario de Datos", bold: true, size: 28 })] }),
    agregar("Nombre completo", datos.nombreCompleto),
    agregar("Calle", datos.calle),
    agregar("Número", datos.numero),
    agregar("Piso", datos.piso),
    agregar("Depto", datos.depto),
    agregar("CP", datos.cp),
    agregar("Barrio", datos.barrio),
    agregar("Localidad", datos.localidad),
    agregar("Provincia", datos.provincia),
    agregar("Entre calles", datos.entreCalles),
    agregar("Estado civil", datos.estadoCivil),
    agregar("Celular", datos.celular),
    agregar("Email", datos.email),
    agregar("Tel. emergencia", datos.emergenciaNumero),
    agregar("Nombre de contacto", datos.emergenciaNombre),
    agregar("Parentesco", datos.emergenciaParentesco),
    new Paragraph(""),
    new Paragraph("Familiares:"),
    ...(datos.familiares || []).map(f => {
      const nombre = f.nombre || "-";
      const parentesco = f.parentesco || "-";
      const fechaNacimiento = f.fechaNacimiento || "-";
      const dni = f.dni || "-";
      return new Paragraph(`${nombre} (${parentesco}) - Nac: ${fechaNacimiento}, DNI: ${dni}`);
    }),
    new Paragraph(""),
    agregar("Primario", datos.primario ? "Sí" : "No"),
    agregar("Título primario", datos.tituloPrimario),
    agregar("Secundario", datos.secundario ? "Sí" : "No"),
    agregar("Título secundario", datos.tituloSecundario),
    agregar("Terciario", datos.terciario ? "Sí" : "No"),
    agregar("Título terciario", datos.tituloTerciario),
    agregar("Universitario", datos.universitario ? "Sí" : "No"),
    agregar("Título universitario", datos.tituloUniversitario),
    agregar("Otros cursos", datos.otrosCursos),
    agregar("Habilidades", datos.habilidades),
    agregar("Firma", datos.firma),
    agregar("Aclaración", datos.aclaracion),
    agregar("Fecha", datos.fecha),
  ];

  const doc = new Document({
    creator: "Mi Aplicación",
    title: "Formulario de Datos",
    description: "Documento generado con docx",
    sections: [
      {
        children: contenido
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const nombreLimpio = datos.nombreCompleto ? datos.nombreCompleto.replace(/\s+/g, "_").toLowerCase() : "sin_nombre";
  const ruta = path.join(carpeta, `${nombreLimpio}_${Date.now()}.docx`);

  fs.writeFileSync(ruta, buffer);
  return ruta;
}

async function generarPDF(datos, carpeta) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // Fuente y tamaño
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSizeTitle = 18;
  const fontSize = 12;
  const lineHeight = 18;

  // Función para escribir texto y bajar la línea
  function escribirLinea(text, bold = false) {
    const usedFont = bold ? fontBold : font;
    page.drawText(text, {
      x: margin,
      y: y,
      size: fontSize,
      font: usedFont,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }

  // Título
  page.drawText("Formulario de Datos", {
    x: margin,
    y: y,
    size: fontSizeTitle,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight * 2;

  // Función para agregar etiqueta y valor
  function agregar(label, valor) {
    escribirLinea(`${label}: ${valor || "-"}`, true);
  }

  agregar("Nombre completo", datos.nombreCompleto);
  agregar("Calle", datos.calle);
  agregar("Número", datos.numero);
  agregar("Piso", datos.piso);
  agregar("Depto", datos.depto);
  agregar("CP", datos.cp);
  agregar("Barrio", datos.barrio);
  agregar("Localidad", datos.localidad);
  agregar("Provincia", datos.provincia);
  agregar("Entre calles", datos.entreCalles);
  agregar("Estado civil", datos.estadoCivil);
  agregar("Celular", datos.celular);
  agregar("Email", datos.email);
  agregar("Tel. emergencia", datos.emergenciaNumero);
  agregar("Nombre de contacto", datos.emergenciaNombre);
  agregar("Parentesco", datos.emergenciaParentesco);
  y -= lineHeight;

  escribirLinea("Familiares:", true);
  y -= lineHeight / 2;

  (datos.familiares || []).forEach((f) => {
    escribirLinea(
      `${f.nombre || "-"} (${f.parentesco || "-"}) - Nac: ${
        f.fechaNacimiento || "-"
      }, DNI: ${f.dni || "-"}`
    );
  });

  y -= lineHeight;

  agregar("Primario", datos.primario ? "Sí" : "No");
  agregar("Título primario", datos.tituloPrimario);
  agregar("Secundario", datos.secundario ? "Sí" : "No");
  agregar("Título secundario", datos.tituloSecundario);
  agregar("Terciario", datos.terciario ? "Sí" : "No");
  agregar("Título terciario", datos.tituloTerciario);
  agregar("Universitario", datos.universitario ? "Sí" : "No");
  agregar("Título universitario", datos.tituloUniversitario);
  agregar("Otros cursos", datos.otrosCursos);
  agregar("Habilidades", datos.habilidades);
  agregar("Firma", datos.firma);
  agregar("Aclaración", datos.aclaracion);
  agregar("Fecha", datos.fecha);

  // Guardar el PDF
  const pdfBytes = await pdfDoc.save();
  const nombreLimpio = datos.nombreCompleto
    ? datos.nombreCompleto.replace(/\s+/g, "_").toLowerCase()
    : "sin_nombre";
  const ruta = path.join(carpeta, `${nombreLimpio}_${Date.now()}.pdf`);

  fs.writeFileSync(ruta, pdfBytes);

  return ruta;
}

module.exports = { generarWord, generarPDF };
