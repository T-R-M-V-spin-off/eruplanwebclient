// login.js
// Comportamento client per il form di login.
// NOTE: il server dovrebbe impostare cookie HttpOnly/Secure SameSite per la sessione.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const submitBtn = document.getElementById('submitBtn');
  const formMessage = document.getElementById('formMessage');
  const usernameError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  const togglePassword = document.getElementById('togglePassword');

  // Imposta stato iniziale del bottone (quando la pagina viene caricata)
  if (togglePassword) {
    togglePassword.setAttribute('aria-pressed', 'false');
    togglePassword.textContent = 'Mostra';
    togglePassword.classList.remove('open');
  }

  // --- Toggle password con testo Mostra/Nascondi ---
  if (togglePassword && password) {
    togglePassword.addEventListener('click', () => {
      const willShow = password.type === 'password';

      // cambia tipo campo
      password.type = willShow ? 'text' : 'password';

      // aggiorna attributi ARIA, testo e classe per lo stile
      togglePassword.setAttribute('aria-pressed', String(willShow));
      togglePassword.classList.toggle('open', willShow);
      togglePassword.textContent = willShow ? 'Nascondi' : 'Mostra';
      togglePassword.setAttribute('aria-label', willShow ? 'Nascondi password' : 'Mostra password');

      // micro-animazione: breve pop sul bottone
      togglePassword.classList.add('animate');
      setTimeout(() => togglePassword.classList.remove('animate'), 140);
    });
  }

  // Validazione semplice client-side (migliora UX)
  function validate() {
    let ok = true;
    usernameError.textContent = '';
    passwordError.textContent = '';
    if (!username.value.trim()) {
      usernameError.textContent = 'Inserisci la matricola.';
      ok = false;
    }
    if (!password.value || password.value.length < 8) {
      passwordError.textContent = 'La password deve avere almeno 8 caratteri.';
      ok = false;
    }
    return ok;
  }

  // Utility: mostra messaggio di stato
  function showMessage(text, type = 'error') {
    formMessage.textContent = text;
    formMessage.className = 'form-message ' + (type === 'success' ? 'success' : 'error');
  }

  // Submit handler - invia dati al backend via fetch
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    formMessage.textContent = '';
    if (!validate()) return;

    // Disabilita per impedire double submit
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connessione...';

    // ENDPOINT esterno richiesto
    const endpoint = 'https://eruplanserver.azurewebsites.net/gestoreUtentiWeb/login';

    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const headers = { 'Content-Type': 'application/json' };
    if (csrfMeta) headers['X-CSRF-Token'] = csrfMeta.getAttribute('content');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s

    try {
      const payload = {
        username: username.value.trim(),
        password: password.value
        // NOTE: remember rimosso dal payload
      };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',   // mantiene cookie/sessioni cross-site (richiede CORS lato server configurato)
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();

        showMessage('Accesso effettuato. Reindirizzamento...', 'success');

        if (data.redirect) {
          setTimeout(() => { window.location.href = data.redirect; }, 600);
          return;
        }

        if (data.token) {
          sessionStorage.setItem('auth_token', data.token);
          if (data.redirect) window.location.href = data.redirect;
          else window.location.reload();
          return;
        }

        window.location.reload();
      } else {
        let errText = 'Errore di autenticazione.';
        try {
          const problem = await resp.json();
          if (problem?.message) errText = problem.message;
        } catch (e) {
          errText = `Server risponde con stato ${resp.status}`;
        }
        showMessage(errText, 'error');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        showMessage('Timeout: il server non risponde. Riprova più tardi.', 'error');
      } else {
        showMessage('Errore di rete. Controlla la connessione.', 'error');
        console.error(err);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Accedi';
    }
  });
});