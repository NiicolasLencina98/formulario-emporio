document.getElementById("formulario").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());

  const familiares = [0,1,2].map(i => ({
    nombre: data[`familiares[${i}].nombre`],
    parentesco: data[`familiares[${i}].parentesco`],
    fechaNacimiento: data[`familiares[${i}].fechaNacimiento`],
    dni: data[`familiares[${i}].dni`]
  })).filter(f => f.nombre);

  data.familiares = familiares;

  const res = await fetch("/enviar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    alert("Formulario enviado correctamente");
    form.reset();
  } else {
    alert("Ocurrió un error al enviar");
  }
});
