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
