/* ---------------------------------- */
/* dashboard.js              */
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
    shapeOptions: { 
      color:"red", 
      fillColor:"red", 
      fillOpacity:0.35,
      type: 'danger' // <-- AGGIUNTA IDENTIFICATIVA DEL TIPO
    }
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

/* Gestione Genera Piano (apre modal) */
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

/* ------------------------------------------------------------- */
/* LOGICA DI VALIDAZIONE E CREAZIONE PIANO (RICHIESTA DELL'UTENTE)*/
/* ------------------------------------------------------------- */
btnCreate.addEventListener('click', () => {
    const nome = inputNome.value.trim();

    // 1. VALIDAZIONE

    // 1.1 Validazione del Nome
    if (nome === '') {
        alert('❌ Il nome del Piano non può essere vuoto.');
        inputNome.focus();
        return;
    }
    if (nome.length < 3 || nome.length > 35) {
        alert('❌ Il nome del Piano deve avere tra 3 e 35 caratteri (attuali: ' + nome.length + ').');
        inputNome.focus();
        return;
    }

    // 1.2 Validazione delle Zone
    let zonePericoloCount = 0;
    let zoneSicureCount = 0;
    
    // Itera su tutti gli strati disegnati in drawnItems
    drawnItems.eachLayer(function(layer) {
        // Accediamo all'opzione type. Se l'utente disegna un poligono con Draw,
        // Leaflet Draw copierà le shapeOptions definite nel currentDraw.
        const layerType = layer.options ? layer.options.type : null;

        if (layerType === 'danger') {
            // Verifica che sia un Poligono (che per definizione ha >= 3 punti chiusi)
            if (layer instanceof L.Polygon) { 
                zonePericoloCount++;
            }
        }
        
        if (layerType === 'safe') {
            zoneSicureCount++;
        }
    });

    if (zonePericoloCount === 0) {
        alert('❌ Devi disegnare almeno una Zona di Pericolo (Poligono).');
        return;
    }
    if (zoneSicureCount === 0) {
        alert('❌ Devi disegnare almeno una Zona Sicura (Cerchio).');
        return;
    }

    // Se la validazione è OK, prepara i dati
    const geometrie = [];
    drawnItems.eachLayer(function(layer) {
        const geoJsonData = layer.toGeoJSON();
        // Aggiunge il tipo (danger/safe) alle proprietà GeoJSON per il server
        geoJsonData.properties.type = layer.options ? layer.options.type : 'unknown';
        geometrie.push(geoJsonData);
    });

    const datiPiano = {
        nome: nome,
        geometrie: geometrie
    };

    // 2. SALVATAGGIO DEL PIANO (SIMULAZIONE CHIAMATA ASINCRONA)
    
    // Sostituire questa logica di simulazione con la vera chiamata fetch al server:
    // fetch('/api/salva-piano', { method: 'POST', body: JSON.stringify(datiPiano), ... })
    const simulaSalvataggio = new Promise(resolve => {
        setTimeout(() => {
            console.log("Dati inviati per il salvataggio:", datiPiano);
            // Simula un ID restituito dal server
            resolve({ newPlanId: Date.now() }); 
        }, 1000); 
    });

    simulaSalvataggio
        .then(data => {
            // 3. CHIUSURA MODALE E MESSAGGIO DI CONFERMA
            closeModal();
            alert(`✅ Piano "${nome}" (ID: ${data.newPlanId}) salvato con successo!`);
            
            // 4. AVVIO PROCESSO DI NOTIFICA UR (SIMULAZIONE)
            
            // Sostituire questa logica di simulazione con la vera chiamata fetch al server:
            // fetch('/api/avvia-notifica', { method: 'POST', body: JSON.stringify({ pianoId: data.newPlanId }), ... })
            return new Promise(resolve => {
                setTimeout(() => {
                    alert('🔔 Notifica per gli Utenti Registrati avviata in background.');
                    resolve();
                }, 500);
            });
        })
        .catch(error => {
            // Gestione degli errori (es. fallimento della chiamata fetch)
            alert(`⚠️ Errore critico durante l'operazione: ${error.message}`);
            console.error('Errore durante il salvataggio/notifica:', error);
        });
});

/* ------------------------------------------------------------- */
/* FINE LOGICA DI VALIDAZIONE E CREAZIONE PIANO                  */
/* ------------------------------------------------------------- */


/* Creazione poligoni (Leaflet Draw) */
map.on("draw:created", e => {
  // Quando un poligono/layer viene disegnato, aggiungiamo l'opzione type anche se non è definita nell'oggetto layer creato dall'utente
  if (!e.layer.options.type && currentDraw) {
    // Questa logica è fondamentale per recuperare il tipo per i poligoni disegnati da L.Draw.
    e.layer.options.type = currentDraw.options.shapeOptions.type;
  }
  drawnItems.addLayer(e.layer);
  setMode(null); // Disabilita lo strumento dopo aver disegnato
});

/* Creazione cerchi: solo se siamo in modalità "sicura" */
map.on("click", e => {
  if (mode !== "sicura") return;

  const c = L.circle(e.latlng, {
    radius: 60,
    color: "green",
    fillColor: "green",
    fillOpacity: 0.35,
    type: 'safe' // <-- AGGIUNTA IDENTIFICATIVA DEL TIPO
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
  // Filtra per assicurarsi che siano solo i cerchi ancora sulla mappa
  circles = circles.filter(c => drawnItems.hasLayer(c)); 
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