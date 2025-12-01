/* ---------- MAPPA ---------- */
const map = L.map('map').setView([40.83, 14.43], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

let circles = [];

/* Modalità */
let mode = null;
let currentDraw = null;

const editToolbar = new L.EditToolbar.Edit(map, { featureGroup: drawnItems });
const deleteToolbar = new L.EditToolbar.Delete(map, { featureGroup: drawnItems });

function setMode(newMode) {
  mode = newMode;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));

  if (newMode) {
    const id = {
      pericolo: "btn-pericolo",
      sicura: "btn-sicura",
      edit: "btn-edit",
      delete: "btn-delete"
    }[newMode];
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }

  if (currentDraw) { try { currentDraw.disable(); } catch(e){} }
  currentDraw = null;

  try { editToolbar.disable(); } catch(e){}
  try { deleteToolbar.disable(); } catch(e){}

  if (newMode === "edit") editToolbar.enable();
  if (newMode === "delete") deleteToolbar.enable();
}

/* Pulsanti strumenti */
document.getElementById("btn-pericolo").onclick = () => {
  setMode("pericolo");

  currentDraw = new L.Draw.Polygon(map, {
    allowIntersection: false,
    showArea: true,
    shapeOptions: { color:"red", fillColor:"red", fillOpacity:0.35 }
  });
  currentDraw.enable();
};

// Modalità cerchi "zona sicura" -> aggiunge cerchi al click sulla mappa
document.getElementById("btn-sicura").onclick = () => setMode("sicura");
document.getElementById("btn-edit").onclick = () => setMode("edit");
document.getElementById("btn-delete").onclick = () => setMode("delete");

/* Creazione poligoni */
map.on("draw:created", e => drawnItems.addLayer(e.layer));

/* Creazione cerchi */
map.on("click", e => {
  if (mode !== "sicura") return;

  const c = L.circle(e.latlng, {
    radius: 60,
    color: "green",
    fillColor: "green",
    fillOpacity: 0.35
  });

  drawnItems.addLayer(c);
  circles.push(c);
});

/* Rimozione cerchi */
map.on("draw:deleted", e => {
  e.layers.eachLayer(layer => {
    circles = circles.filter(c => c !== layer);
  });
});

/* Mostra coordinate SOLO quando premi il pulsante */
document.getElementById("btn-coords").onclick = () => {
  const out = document.getElementById("output");

  // Rimuove eventuali cerchi che non sono più presenti sulla mappa
  circles = circles.filter(c => map.hasLayer(c));

  if (circles.length === 0) {
    out.textContent = "Nessun cerchio.";
    return;
  }

  out.textContent = circles
    .map((c,i) => `Cerchio ${i+1}: ${c.getLatLng().lat.toFixed(6)}, ${c.getLatLng().lng.toFixed(6)}`)
    .join("\n");
};

/* ---------- LOGOUT ---------- */
// Il bottone di logout è stato aggiunto nella sidebar (id: btn-logout).
// Comportamento:
// 1) Cerca di chiamare un endpoint '/logout' (POST) per invalidare la sessione server-side (se presente).
// 2) Pulisce localStorage / sessionStorage.
// 3) Reindirizza a 'login.html' (modifica la destinazione se necessario).

document.getElementById('btn-logout').onclick = async () => {
  // Se hai un endpoint server per il logout, puoi usarlo qui.
  try {
    await fetch('/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {
    // Ignora errori di rete: il redirect avverrà comunque (utile per sviluppo locale senza backend)
    console.warn('Logout endpoint non raggiungibile o non presente.', e);
  }

  try { localStorage.clear(); } catch(e){}
  try { sessionStorage.clear(); } catch(e){}

  // Se vuoi rimuovere cookie lato client, è necessario conoscere il nome del cookie e il dominio.
  // document.cookie = 'session=; Max-Age=0; path=/;';

  // Redirect alla pagina di login — modifica se il path è diverso (es: /auth/login)
  window.location.href = 'login.html';
};
