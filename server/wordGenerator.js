const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun } = require("docx");

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

module.exports = { generarWord };
