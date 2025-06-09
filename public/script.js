// Función para manejar el estado habilitado/deshabilitado según checkbox
document.querySelectorAll('input[type=checkbox][name^="nivel"]').forEach(chk => {
  chk.addEventListener('change', e => {
    const id = e.target.id; // Ej: nivelPrimario
    const nivel = id.replace('nivel', ''); // Primario, Secundario, Terciario, Universitario

    const estadoSelect = document.getElementById('estado' + nivel);
    const tituloInput = document.getElementById('titulo' + nivel);

    if (e.target.checked) {
      estadoSelect.disabled = false;
      tituloInput.disabled = false;
      estadoSelect.setAttribute('required', 'required');
    } else {
      estadoSelect.disabled = true;
      tituloInput.disabled = true;
      estadoSelect.removeAttribute('required');
      estadoSelect.value = '';
      tituloInput.value = '';
    }
  });
});

// Manejo del envío del formulario
document.getElementById("formulario").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  // Construir objeto con datos del formulario
  const data = Object.fromEntries(formData.entries());

  // Manejar familiares: crear array con datos sólo si nombre no está vacío
  const familiares = [0,1,2].map(i => ({
    nombre: formData.get(`familiares[${i}].nombre`),
    parentesco: formData.get(`familiares[${i}].parentesco`),
    fechaNacimiento: formData.get(`familiares[${i}].fechaNacimiento`),
    dni: formData.get(`familiares[${i}].dni`)
  })).filter(f => f.nombre && f.nombre.trim() !== '');

  data.familiares = familiares;

  // Convertir checkbox de niveles en booleanos para facilitar uso
  ['Primario','Secundario','Terciario','Universitario'].forEach(nivel => {
    data[`nivel${nivel}`] = formData.get(`nivel${nivel}`) === 'on';
  });

  // Guardar en localStorage (JSON)
  try {
    localStorage.setItem('datosFormulario', JSON.stringify(data));
    console.log("Datos guardados en localStorage");
  } catch (error) {
    console.error("Error guardando en localStorage:", error);
  }

  try {
    const res = await fetch("/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert("Formulario enviado correctamente");
      form.reset();

      // Después del reset, deshabilitar selects e inputs de niveles
      document.querySelectorAll('select[id^="estado"]').forEach(s => s.disabled = true);
      document.querySelectorAll('input[id^="titulo"]').forEach(i => i.disabled = true);
    } else {
      alert("Ocurrió un error al enviar");
    }
  } catch (error) {
    alert("Error de red o servidor: " + error.message);
  }
});

// Al cargar la página, si hay datos en localStorage, rellenar el formulario automáticamente
window.addEventListener('load', () => {
  const datosGuardados = localStorage.getItem('datosFormulario');
  if (datosGuardados) {
    const datos = JSON.parse(datosGuardados);
    const form = document.getElementById('formulario');

    // Rellenar campos simples
    for (const [key, value] of Object.entries(datos)) {
      if (typeof value === 'boolean') {
        const checkbox = form.querySelector(`input[type=checkbox][name="${key}"]`);
        if (checkbox) {
          checkbox.checked = value;
          checkbox.dispatchEvent(new Event('change')); // activar/desactivar selects e inputs
        }
      } else if (typeof value === 'string') {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
          input.value = value;
        }
      }
    }

    // Rellenar familiares
    if (datos.familiares && Array.isArray(datos.familiares)) {
      datos.familiares.forEach((f, i) => {
        form.querySelector(`[name="familiares[${i}].nombre"]`).value = f.nombre || '';
        form.querySelector(`[name="familiares[${i}].parentesco"]`).value = f.parentesco || '';
        form.querySelector(`[name="familiares[${i}].fechaNacimiento"]`).value = f.fechaNacimiento || '';
        form.querySelector(`[name="familiares[${i}].dni"]`).value = f.dni || '';
      });
    }
  }
});

///////////////////////////////
// NUEVAS FUNCIONES PARA EXPORTAR WORD Y PDF
///////////////////////////////

import { Document, Packer, Paragraph, TextRun } from "https://cdn.jsdelivr.net/npm/docx@7.1.2/build/docx.mjs";
import { saveAs } from "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
import jsPDF from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

document.getElementById('btnExportarWord').addEventListener('click', exportarWord);
document.getElementById('btnExportarPDF').addEventListener('click', exportarPDF);

function exportarWord() {
  const datos = JSON.parse(localStorage.getItem('datosFormulario') || '{}');

  // Crear párrafos para cada dato
  const contenido = [];

  // Datos simples
  for (const [key, value] of Object.entries(datos)) {
    if (key === 'familiares' || key.startsWith('nivel')) continue;
    if (value && value !== '') {
      contenido.push(new Paragraph({
        children: [new TextRun({ text: `${key}: ${value}`, size: 22 })]
      }));
    }
  }

  // Checkbox niveles y sus detalles
  ['Primario', 'Secundario', 'Terciario', 'Universitario'].forEach(nivel => {
    if (datos[`nivel${nivel}`]) {
      const estado = datos[`estado${nivel}`] || '';
      const titulo = datos[`titulo${nivel}`] || '';
      contenido.push(new Paragraph({
        children: [new TextRun({ text: `Nivel ${nivel}: Sí`, bold: true, size: 22 })]
      }));
      contenido.push(new Paragraph({ text: `Estado: ${estado}`, spacing: { after: 100 } }));
      contenido.push(new Paragraph({ text: `Título: ${titulo}`, spacing: { after: 200 } }));
    }
  });

  // Familiares
  if (datos.familiares && datos.familiares.length) {
    contenido.push(new Paragraph({ text: "Familiares:", bold: true, size: 24, spacing: { before: 400, after: 200 } }));
    datos.familiares.forEach((f, i) => {
      contenido.push(new Paragraph({
        children: [
          new TextRun({ text: `Nombre: ${f.nombre} | Parentesco: ${f.parentesco} | Fecha Nac.: ${f.fechaNacimiento} | DNI: ${f.dni}`, size: 20 }),
        ],
        spacing: { after: 100 }
      }));
    });
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: contenido
    }]
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, "formulario.docx");
  });
}

async function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'a4');
  pdf.setFontSize(10);
  const datos = JSON.parse(localStorage.getItem('datosFormulario') || '{}');

  let y = 20;

  // Función para escribir texto y manejar salto de línea
  function escribirLinea(text) {
    const lineHeight = 14;
    const pageHeight = pdf.internal.pageSize.height;
    if (y + lineHeight > pageHeight - 20) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(text, 20, y);
    y += lineHeight;
  }

  // Datos simples
  for (const [key, value] of Object.entries(datos)) {
    if (key === 'familiares' || key.startsWith('nivel')) continue;
    if (value && value !== '') {
      escribirLinea(`${key}: ${value}`);
    }
  }

  // Checkbox niveles y detalles
  ['Primario', 'Secundario', 'Terciario', 'Universitario'].forEach(nivel => {
    if (datos[`nivel${nivel}`]) {
      escribirLinea(`Nivel ${nivel}: Sí`);
      escribirLinea(`  Estado: ${datos[`estado${nivel}`] || ''}`);
      escribirLinea(`  Título: ${datos[`titulo${nivel}`] || ''}`);
    }
  });

  // Familiares
  if (datos.familiares && datos.familiares.length) {
    escribirLinea('Familiares:');
    datos.familiares.forEach((f, i) => {
      escribirLinea(`  Nombre: ${f.nombre} | Parentesco: ${f.parentesco} | Fecha Nac.: ${f.fechaNacimiento} | DNI: ${f.dni}`);
    });
  }

  pdf.save("formulario.pdf");
}
