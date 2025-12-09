/* ---------- MAPPA ---------- */
const map = L.map('map').setView([40.83, 14.43], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

let circles = [];

/* Modal & mode variables */
let mode = null;
let currentDraw = null;

const editToolbar = new L.EditToolbar.Edit(map, { featureGroup: drawnItems });
const deleteToolbar = new L.EditToolbar.Delete(map, { featureGroup: drawnItems });

function setMode(newMode) {
  mode = newMode;

  // rimuovi classi 'active' e reset aria-pressed su tutti i tool-btn
  document.querySelectorAll('.tool-btn').forEach(b => {
    b.classList.remove('active');
    // aggiorna aria-pressed solo per i bottoni che corrispondono agli strumenti (hanno id specifico)
    if (['btn-pericolo','btn-sicura','btn-edit','btn-delete'].includes(b.id)) {
      b.setAttribute('aria-pressed', 'false');
    }
  });

  // disabilita eventuale currentDraw (se presente)
  if (currentDraw) {
    try { currentDraw.disable(); } catch(e){}
    currentDraw = null;
  }

  // disabilita toolbar edit/delete
  try { editToolbar.disable(); } catch(e){}
  try { deleteToolbar.disable(); } catch(e){}

  // se abbiamo una nuova modalità, abilita la corrispondente UI e setta aria-pressed
  if (newMode) {
    const id = {
      pericolo: "btn-pericolo",
      sicura: "btn-sicura",
      edit: "btn-edit",
      delete: "btn-delete"
    }[newMode];

    const el = document.getElementById(id);
    if (el) {
      el.classList.add("active");
      el.setAttribute('aria-pressed', 'true');
    }
  }

  // abilita strumenti specifici dopo aver aggiornato l'UI
  if (newMode === "edit") editToolbar.enable();
  if (newMode === "delete") deleteToolbar.enable();
}

/* Utility: toggle mode (se è attiva -> disattiva, altrimenti attiva) */
function toggleMode(toolName) {
  if (mode === toolName) {
    setMode(null);
  } else {
    setMode(toolName);
  }
}

/* Pulsanti strumenti: ora fanno toggle se premuti di nuovo */

/* Disegna Zona Pericolo (poligoni) */
const btnPericolo = document.getElementById("btn-pericolo");
btnPericolo.addEventListener('click', () => {
  if (mode === "pericolo") { setMode(null); return; }

  setMode("pericolo");

  // abilita il drawing polygon
  currentDraw = new L.Draw.Polygon(map, {
    allowIntersection: false,
    showArea: true,
    shapeOptions: { color:"red", fillColor:"red", fillOpacity:0.35 }
  });
  currentDraw.enable();
});
btnPericolo.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); btnPericolo.click(); } });

/* Disegna Zona Sicura (cerchi sul click) */
const btnSicura = document.getElementById("btn-sicura");
btnSicura.addEventListener('click', () => {
  toggleMode("sicura");
});
btnSicura.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); btnSicura.click(); } });

/* Modifica / Seleziona (Edit toolbar) */
const btnEdit = document.getElementById("btn-edit");
btnEdit.addEventListener('click', () => {
  toggleMode("edit");
});
btnEdit.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); btnEdit.click(); } });

/* Elimina Zona (Delete toolbar) */
const btnDelete = document.getElementById("btn-delete");
btnDelete.addEventListener('click', () => {
  toggleMode("delete");
});
btnDelete.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); btnDelete.click(); } });

/* Gestione Genera Piano (apre modal) - rimane invariata */
const btnGenera = document.getElementById("btn-genera");
const overlay = document.getElementById("overlay-modal");
const inputNome = document.getElementById("nome-piano");
const btnCancel = document.getElementById("modal-cancel");
const btnCreate = document.getElementById("modal-create");

btnGenera.addEventListener('click', openModal);
btnGenera.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openModal(); } });

function openModal() {
  // disable drawing/editing modes so the UI is consistent
  setMode(null);
  overlay.classList.remove('overlay-hidden');
  overlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => inputNome.focus(), 80);
  try { map.dragging.disable(); } catch(e){}
  try { map.doubleClickZoom.disable(); } catch(e){}
  try { map.scrollWheelZoom.disable(); } catch(e){}
}

function closeModal() {
  overlay.classList.add('overlay-hidden');
  overlay.setAttribute('aria-hidden', 'true');
  inputNome.value = '';
  try { map.dragging.enable(); } catch(e){}
  try { map.doubleClickZoom.enable(); } catch(e){}
  try { map.scrollWheelZoom.enable(); } catch(e){}
}

/* Modal actions */
btnCancel.addEventListener('click', () => closeModal());
overlay.addEventListener('click', (ev) => {
  if (ev.target === overlay) closeModal();
});
document.addEventListener('keydown', (ev) => {
  if (overlay.getAttribute('aria-hidden') === 'false' && ev.key === 'Escape') {
    closeModal();
  }
});

/* Simula la creazione del piano (puoi sostituire con fetch later) */
btnCreate.addEventListener('click', () => {
  const nome = inputNome.value.trim();
  if (!nome) { inputNome.focus(); return; }

  console.log('Creazione nuovo piano:', nome);
  closeModal();
});

/* Creazione poligoni (Leaflet Draw) */
map.on("draw:created", e => drawnItems.addLayer(e.layer));

/* Creazione cerchi: solo se siamo in modalità "sicura" */
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

/* Rimozione cerchi (quando usi la toolbar delete di Leaflet.draw) */
map.on("draw:deleted", e => {
  e.layers.eachLayer(layer => {
    circles = circles.filter(c => c !== layer);
  });
});

/* Mostra coordinate SOLO quando premi il pulsante */
document.getElementById("btn-coords").onclick = () => {
  const out = document.getElementById("output");
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
document.getElementById('btn-logout').onclick = async () => {
  try {
    await fetch('/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.warn('Logout endpoint non raggiungibile o non presente.', e);
  }
  try { localStorage.clear(); } catch(e){}
  try { sessionStorage.clear(); } catch(e){}
  window.location.href = 'login.html';
};