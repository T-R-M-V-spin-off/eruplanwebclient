/* ---------------------------------- */
/* dashboard.js                       */
/* ---------------------------------- */

/* ---------- MAPPA ---------- */
const map = L.map('map').setView([40.83, 14.43], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

let circles = []; // Mantenuto per compatibilità con la funzione Mostra Coordinate

/* Modal & mode variables */
let mode = null;
let currentDraw = null;

const editToolbar = new L.EditToolbar.Edit(map, { featureGroup: drawnItems });
const deleteToolbar = new L.EditToolbar.Delete(map, { featureGroup: drawnItems });

function setMode(newMode) {
  mode = newMode;

  document.querySelectorAll('.tool-btn').forEach(b => {
    b.classList.remove('active');
    if (['btn-pericolo','btn-sicura','btn-edit','btn-delete'].includes(b.id)) {
      b.setAttribute('aria-pressed', 'false');
    }
  });

  if (currentDraw) { try { currentDraw.disable(); } catch(e){} currentDraw = null; }
  try { editToolbar.disable(); } catch(e){}
  try { deleteToolbar.disable(); } catch(e){}

  if (newMode) {
    const id = { pericolo: "btn-pericolo", sicura: "btn-sicura", edit: "btn-edit", delete: "btn-delete" }[newMode];
    const el = document.getElementById(id);
    if (el) { el.classList.add("active"); el.setAttribute('aria-pressed', 'true'); }
  }

  if (newMode === "edit") editToolbar.enable();
  if (newMode === "delete") deleteToolbar.enable();
}

function toggleMode(toolName) {
  if (mode === toolName) { setMode(null); } else { setMode(toolName); }
}

/* ---------- BUTTONS ---------- */
const btnPericolo = document.getElementById("btn-pericolo");
btnPericolo.addEventListener('click', () => {
  if (mode === "pericolo") { setMode(null); return; }
  setMode("pericolo");
  currentDraw = new L.Draw.Polygon(map, {
    allowIntersection: false,
    showArea: true,
    shapeOptions: { color:"red", fillColor:"red", fillOpacity:0.35, type: 'danger' }
  });
  currentDraw.enable();
});
btnPericolo.addEventListener('keydown', ev => { if (ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); btnPericolo.click(); } });

const btnSicura = document.getElementById("btn-sicura");
btnSicura.addEventListener('click', () => toggleMode("sicura"));
btnSicura.addEventListener('keydown', ev => { if (ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); btnSicura.click(); } });

const btnEdit = document.getElementById("btn-edit");
btnEdit.addEventListener('click', () => toggleMode("edit"));
btnEdit.addEventListener('keydown', ev => { if (ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); btnEdit.click(); } });

const btnDelete = document.getElementById("btn-delete");
btnDelete.addEventListener('click', () => toggleMode("delete"));
btnDelete.addEventListener('keydown', ev => { if (ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); btnDelete.click(); } });

/* ---------- MODAL ---------- */
const btnGenera = document.getElementById("btn-genera");
const overlay = document.getElementById("overlay-modal");
const inputNome = document.getElementById("nome-piano");
const btnCancel = document.getElementById("modal-cancel");
const btnCreate = document.getElementById("modal-create");

btnGenera.addEventListener('click', openModal);
btnGenera.addEventListener('keydown', ev => { if (ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); openModal(); } });

function openModal() {
  setMode(null);
  overlay.classList.remove('overlay-hidden');
  overlay.setAttribute('aria-hidden','false');
  setTimeout(()=>inputNome.focus(),80);
  try{ map.dragging.disable(); }catch(e){}
  try{ map.doubleClickZoom.disable(); }catch(e){}
  try{ map.scrollWheelZoom.disable(); }catch(e){}
}

function closeModal() {
  overlay.classList.add('overlay-hidden');
  overlay.setAttribute('aria-hidden','true');
  inputNome.value='';
  try{ map.dragging.enable(); }catch(e){}
  try{ map.doubleClickZoom.enable(); }catch(e){}
  try{ map.scrollWheelZoom.enable(); }catch(e){}
}

btnCancel.addEventListener('click', ()=>closeModal());
overlay.addEventListener('click', ev => { if(ev.target===overlay) closeModal(); });
document.addEventListener('keydown', ev => { if(overlay.getAttribute('aria-hidden')==='false' && ev.key==='Escape') closeModal(); });

/* ---------- GENERA PIANO ---------- */
const endpointGeneraPiano = 'https://eruplanserver.azurewebsites.net/gestorePiani/genera';
const endpointLogout = 'https://eruplanserver.azurewebsites.net/gestoreUtentiWeb/logout';

btnCreate.addEventListener('click', async () => {
  const nome = inputNome.value.trim();

  if(nome===''){ alert('❌ Il nome del Piano non può essere vuoto.'); inputNome.focus(); return; }
  if(nome.length<3 || nome.length>35){ alert('❌ Il nome del Piano deve avere tra 3 e 35 caratteri.'); inputNome.focus(); return; }

  let zonePericoloCount=0, zoneSicureCount=0;
  drawnItems.eachLayer(layer => {
    const type = layer.options?.type;
    if(type==='danger' && layer instanceof L.Polygon) zonePericoloCount++;
    if(type==='safe') zoneSicureCount++;
  });

  if(zonePericoloCount===0){ alert('❌ Devi disegnare almeno una Zona di Pericolo (Poligono).'); return; }
  if(zoneSicureCount===0){ alert('❌ Devi disegnare almeno una Zona Sicura (Cerchio).'); return; }

  const geometrie=[];
  drawnItems.eachLayer(layer=>{
    const geoJson=layer.toGeoJSON();
    geoJson.properties = geoJson.properties || {};
    geoJson.properties.type = layer.options?.type || 'unknown';
    geometrie.push(geoJson);
  });

  const datiPiano = { nome, geometrie };

  try {
    const resp = await fetch(endpointGeneraPiano,{
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      credentials:'include',
      body: JSON.stringify(datiPiano)
    });

    if(!resp.ok){
      let serverMsg='';
      try{ serverMsg = await resp.text(); }catch(e){}
      throw new Error(`Server risponde con ${resp.status} ${resp.statusText}${serverMsg?' — '+serverMsg:''}`);
    }

    let result=null;
    try{ result = await resp.json(); }catch(e){ result=null; }

    closeModal();

    const id = result && (result.id||result.newPlanId||result.pianoId) ? (result.id||result.newPlanId||result.pianoId) : null;
    alert(`✅ Piano "${nome}" salvato con successo!${id?' ID: '+id:''}`);

  } catch (error) {
    console.error('Errore durante la chiamata al server:', error);
    alert(`⚠️ Errore durante il salvataggio: ${error.message}`);
  }
});

/* ---------- DRAW EVENTS ---------- */
map.on("draw:created", e=>{
  if(!e.layer.options.type && currentDraw?.options?.shapeOptions){
    e.layer.options.type = currentDraw.options.shapeOptions.type;
  }
  drawnItems.addLayer(e.layer);
  setMode(null);
});

map.on("click", e=>{
  if(mode!=="sicura") return;
  const c=L.circle(e.latlng,{ radius:60, color:"green", fillColor:"green", fillOpacity:0.35, type:'safe' });
  drawnItems.addLayer(c);
  circles.push(c);
});

map.on("draw:deleted", e=>{
  e.layers.eachLayer(layer=>{ circles = circles.filter(c=>c!==layer); });
});

document.getElementById("btn-coords").onclick = () => {
  const out = document.getElementById("output");
  circles = circles.filter(c=>drawnItems.hasLayer(c));
  if(circles.length===0){ out.textContent="Nessun cerchio."; return; }
  out.textContent = circles.map((c,i)=>`Cerchio ${i+1}: ${c.getLatLng().lat.toFixed(6)}, ${c.getLatLng().lng.toFixed(6)}`).join("\n");
};

/* ---------- LOGOUT ---------- */
document.getElementById('btn-logout').onclick = async () => {
  try {
    const resp = await fetch(endpointLogout,{ method:'POST', credentials:'include' });
    if(!resp.ok) throw new Error(`Server logout risponde ${resp.status} ${resp.statusText}`);
  } catch(e){
    console.warn('Logout endpoint non raggiungibile o errore.', e);
  }
  try{ localStorage.clear(); }catch(e){}
  try{ sessionStorage.clear(); }catch(e){}
  window.location.href = 'login.html';
};