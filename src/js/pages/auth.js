/**
 * FoodLoop Authentication & Profile Pages - /login, /signup, /profile (PRD Section 15)
 * Uses lightweight local demo sessions. Never stores passwords in localStorage.
 */

import { appState } from '../state.js';
import { router } from '../router.js';
import { BALI_AREAS } from '../data/seed.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, isValidEmail } from '../../utils/validation.js';
import { icon } from '../components/icons.js';
import { getLanguage } from '../services/i18nService.js';

export function renderLoginPage(container) {
  const { users } = appState.getState();
  const currentUser = appState.getCurrentUser();
  let showPassword = false;
  let errorMsg = '';

  function renderView() {
    const isId = getLanguage() === 'id';

    container.innerHTML = `
      <section class="section">
        <div class="container-narrow">
          <div class="grid-2" style="align-items:start;">
            <!-- Left: Quick Demo Role Selector (PRD Section 15) -->
            <div style="background:var(--color-paper); border:1px solid var(--color-line-strong); border-radius:var(--radius-lg); padding: var(--space-6);">
              <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">${isId ? 'Pemilih Peran Prototipe' : 'Prototype Demo Selector'}</span>
              <h1 style="font-size:1.6rem; margin-top:8px; margin-bottom:8px;">${isId ? 'Masuk Instan Sesuai Peran' : 'Instant demo role sign-in'}</h1>
              <p style="font-size:0.875rem; margin-bottom: var(--space-4);">
                ${isId
                  ? 'Pilih salah satu akun demo Bali di bawah ini untuk langsung merasakan sudut pandang mitra penyedia, komunitas, warga individu, atau admin.'
                  : 'Select any seeded Bali demo account below to experience the provider, recipient organization, individual, or admin perspective immediately.'
                }
              </p>

              <div style="display:flex; flex-direction:column; gap:10px;">
                ${users
                  .map(
                    (u) => `
                      <button
                        type="button"
                        class="info-spec-box"
                        style="text-align:left; display:flex; align-items:center; justify-content:space-between; border-color:${currentUser?.id === u.id ? 'var(--color-forest)' : 'var(--color-line)'}; background:${currentUser?.id === u.id ? 'var(--color-forest-subtle)' : 'var(--color-cream)'};"
                        data-quick-login="${escapeHtml(u.id)}"
                      >
                        <div>
                          <div style="font-weight:700; color:var(--color-ink);">${escapeHtml(u.name)}</div>
                          <div style="font-size:0.78rem; color:var(--color-muted);">
                            ${escapeHtml(u.email)} • ${icon('mapPin', 13)} ${escapeHtml(u.area)}
                          </div>
                        </div>
                        <span class="badge badge-forest" style="text-transform:capitalize;">${escapeHtml(
                          isId
                            ? u.role === 'provider' ? 'Penyedia'
                              : u.role === 'recipient' ? 'Komunitas'
                              : u.role === 'individual' ? 'Warga'
                              : 'Admin'
                            : u.role
                        )}</span>
                      </button>
                    `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Right: Standard Email / Password Login Form -->
            <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-lg); padding: var(--space-6);">
              <h2 style="font-size:1.45rem; margin-bottom:6px;">${isId ? 'Masuk dengan Email' : 'Sign in with email'}</h2>
              <p style="font-size:0.85rem; color:var(--color-muted); margin-bottom: var(--space-4);">
                ${isId ? 'Gunakan salah satu email akun demo di samping. Password tidak disimpan di localStorage.' : 'Enter a demo email (e.g., provider@example.test). Passwords are never saved to localStorage.'}
              </p>

              <form id="login-email-form" novalidate>
                <div class="form-group">
                  <label for="login-email" class="form-label">${isId ? 'Alamat Email *' : 'Email address *'}</label>
                  <input
                    type="email"
                    id="login-email"
                    class="form-input"
                    value="recipient@example.test"
                    placeholder="nama@contoh.test"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="login-password" class="form-label">
                    <span>${isId ? 'Kata Sandi (Demo) *' : 'Password (Demo) *'}</span>
                    <button type="button" id="toggle-pwd-btn" style="font-size:0.78rem; color:var(--color-forest); font-weight:600;">
                      ${showPassword ? (isId ? 'Sembunyikan sandi' : 'Hide password') : (isId ? 'Tampilkan sandi' : 'Show password')}
                    </button>
                  </label>
                  <input
                    type="${showPassword ? 'text' : 'password'}"
                    id="login-password"
                    class="form-input"
                    value="foodloop-demo-2026"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="login-remember" checked />
                    <span>${isId ? 'Ingat sesi demo di peramban ini' : 'Remember demo session in this browser'}</span>
                  </label>
                </div>

                ${errorMsg ? `<div class="form-error" style="margin-bottom:10px;">${escapeHtml(errorMsg)}</div>` : ''}

                <button type="submit" class="btn btn-primary btn-block">${isId ? 'Masuk ke FoodLoop' : 'Sign in to FoodLoop'}</button>
              </form>

              <div style="margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--color-line); font-size:0.85rem; text-align:center;">
                ${isId ? 'Baru pertama kali di FoodLoop?' : 'New to FoodLoop?'}
                <a href="#/signup" data-link="/signup" style="color:var(--color-forest); font-weight:600; text-decoration:underline; margin-left:4px;">
                  ${isId ? 'Buat akun demo baru' : 'Create a demo account'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    container.querySelectorAll('[data-quick-login]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-quick-login');
        appState.setCurrentUser(userId);
        const u = appState.getCurrentUser();
        showToast(isId ? `Masuk sebagai ${u.name} (${u.role})` : `Signed in as ${u.name} (${u.role})`, 'success');
        router.navigate('/dashboard');
      });
    });

    const pwdToggle = container.querySelector('#toggle-pwd-btn');
    if (pwdToggle) {
      pwdToggle.addEventListener('click', () => {
        showPassword = !showPassword;
        renderView();
      });
    }

    const form = container.querySelector('#login-email-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = container.querySelector('#login-email').value.trim().toLowerCase();
        const pwd = container.querySelector('#login-password').value;

        if (!isValidEmail(email)) {
          errorMsg = isId ? 'Silakan masukkan alamat email yang valid.' : 'Please enter a valid email address.';
          renderView();
          return;
        }
        if (!pwd || pwd.length < 4) {
          errorMsg = isId ? 'Silakan masukkan kata sandi demo (minimal 4 karakter).' : 'Please enter a demo password (at least 4 characters).';
          renderView();
          return;
        }

        const matchedUser = users.find((u) => u.email.toLowerCase() === email) || users[0];
        appState.setCurrentUser(matchedUser.id);
        showToast(isId ? `Masuk sebagai ${matchedUser.name}` : `Signed in as ${matchedUser.name}`, 'success');
        router.navigate('/dashboard');
      });
    }
  }

  renderView();
}

export function renderSignupPage(container) {
  let selectedRole = 'recipient';
  let errorMsg = '';
  let createdAccount = null;

  function renderView() {
    const isId = getLanguage() === 'id';

    if (createdAccount) {
      container.innerHTML = `
        <section class="section">
          <div class="container-narrow">
            <div class="state-panel" style="background:var(--color-paper); border-style:solid; border-color:var(--color-leaf);">
              <span class="badge badge-success">${icon('check', 12)} ${isId ? 'Akun demo berhasil dibuat' : 'Demo account created'}</span>
              <h1>${isId ? `Selamat datang di FoodLoop, ${escapeHtml(createdAccount.name)}!` : `Welcome to FoodLoop, ${escapeHtml(createdAccount.name)}!`}</h1>
              <p>
                ${isId
                  ? `Sesi prototipe Anda aktif sebagai <strong>${escapeHtml(createdAccount.role === 'provider' ? 'Penyedia Makanan' : createdAccount.role === 'recipient' ? 'Organisasi Komunitas' : 'Warga / Individu')}</strong> di wilayah <strong>${escapeHtml(createdAccount.area)}</strong>.`
                  : `Your prototype session is active as a <strong>${escapeHtml(createdAccount.role)}</strong> in <strong>${escapeHtml(createdAccount.area)}</strong>.`
                }
              </p>
              <div style="display:flex; gap:12px; margin-top:12px;">
                <a href="#/dashboard" data-link="/dashboard" class="btn btn-primary">${isId ? 'Buka Dashboard' : 'Go to Dashboard'}</a>
                <a href="#/discover" data-link="/discover" class="btn btn-secondary">${isId ? 'Jelajahi Makanan' : 'Discover surplus'}</a>
              </div>
            </div>
          </div>
        </section>
      `;
      return;
    }

    container.innerHTML = `
      <section class="section-sm">
        <div class="container-narrow">
          <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-lg); padding: var(--space-6);">
            <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">${isId ? 'Pendaftaran Prototipe' : 'Prototype Registration'}</span>
            <h1 style="font-size:1.85rem; margin-top:8px; margin-bottom:6px;">${isId ? 'Daftar Akun FoodLoop' : 'Create a FoodLoop account'}</h1>
            <p style="margin-bottom: var(--space-5);">
              ${isId
                ? 'Pilih peran Anda dalam jejaring redistribusi makanan di Bali.'
                : 'Choose your role in the Bali redistribution network.'
              }
            </p>

            <form id="signup-form" novalidate>
              <div class="form-group">
                <span class="form-label">${isId ? 'Pilih peran Anda *' : 'Select your role *'}</span>
                <div class="grid-3" style="gap:10px;">
                  ${[
                    {
                      id: 'provider',
                      title: isId ? 'Penyedia Makanan' : 'Food provider',
                      sub: isId ? 'Restoran, bakery, hotel, pasar swalayan' : 'Restaurant, bakery, hotel, grocer'
                    },
                    {
                      id: 'recipient',
                      title: isId ? 'Organisasi Komunitas' : 'Recipient organization',
                      sub: isId ? 'Dapur umum, panti asuhan, yayasan' : 'Community kitchen, charity, pantry'
                    },
                    {
                      id: 'individual',
                      title: isId ? 'Warga / Individu' : 'Individual recipient',
                      sub: isId ? 'Akses surplus makanan publik komunitas' : 'Access public community surplus'
                    }
                  ]
                    .map(
                      (r) => `
                        <button
                          type="button"
                          class="info-spec-box"
                          style="text-align:left; border-color:${selectedRole === r.id ? 'var(--color-forest)' : 'var(--color-line)'}; background:${selectedRole === r.id ? 'var(--color-forest-subtle)' : 'var(--color-cream)'};"
                          data-select-role="${r.id}"
                        >
                          <div style="font-weight:700; font-size:0.9rem;">${escapeHtml(r.title)}</div>
                          <div style="font-size:0.75rem; color:var(--color-muted); margin-top:2px;">${escapeHtml(r.sub)}</div>
                        </button>
                      `
                    )
                    .join('')}
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label for="su-name" class="form-label">
                    ${selectedRole === 'individual'
                      ? (isId ? 'Nama Lengkap *' : 'Full name *')
                      : (isId ? 'Nama Usaha / Organisasi *' : 'Organization / business name *')
                    }
                  </label>
                  <input type="text" id="su-name" class="form-input" placeholder="${isId ? 'Contoh: Dapur Komunitas Canggu' : 'e.g., Canggu Community Table'}" required />
                </div>

                <div class="form-group">
                  <label for="su-email" class="form-label">${isId ? 'Alamat Email *' : 'Email address (.example.test recommended) *'}</label>
                  <input type="email" id="su-email" class="form-input" placeholder="coordinator@example.test" required />
                </div>
              </div>

              <div class="grid-3">
                <div class="form-group">
                  <label for="su-password" class="form-label">${isId ? 'Kata Sandi (Demo) *' : 'Password (Demo) *'}</label>
                  <input type="password" id="su-password" class="form-input" placeholder="${isId ? 'Minimal 4 karakter' : 'At least 6 characters'}" required />
                </div>

                <div class="form-group">
                  <label for="su-org-type" class="form-label">${isId ? 'Tipe Organisasi' : 'Organization type'}</label>
                  <select id="su-org-type" class="form-select">
                    ${
                      selectedRole === 'provider'
                        ? `
                          <option value="Restaurant">${isId ? 'Restoran' : 'Restaurant'}</option>
                          <option value="Bakery">Bakery</option>
                          <option value="Café">Kafe</option>
                          <option value="Hotel">Hotel / Resort</option>
                          <option value="Grocery">${isId ? 'Pasar Swalayan / Toko' : 'Grocery'}</option>
                        `
                        : selectedRole === 'recipient'
                        ? `
                          <option value="Community kitchen">${isId ? 'Dapur Komunitas' : 'Community kitchen'}</option>
                          <option value="Food bank / pantry">${isId ? 'Bank Makanan' : 'Food bank / pantry'}</option>
                          <option value="Charity / shelter">${isId ? 'Yayasan / Panti Asuhan' : 'Charity / shelter'}</option>
                        `
                        : `<option value="Individual recipient">${isId ? 'Penerima Individu' : 'Individual recipient'}</option>`
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label for="su-area" class="form-label">${isId ? 'Wilayah Utama di Bali *' : 'Primary Bali area *'}</label>
                  <select id="su-area" class="form-select">
                    ${BALI_AREAS.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="su-consent" required />
                  <span>
                    ${isId
                      ? 'Saya menyetujui ketentuan prototipe dan memahami bahwa penyedia bertanggung jawab atas keterbukaan informasi makanan dan penerima memeriksa kondisi fisik makanan saat serah terima.'
                      : 'I agree to the prototype terms and understand that providers are responsible for accurate food disclosure and recipients inspect food at handoff.'
                    }
                  </span>
                </label>
              </div>

              ${errorMsg ? `<div class="form-error" style="margin-bottom:10px;">${escapeHtml(errorMsg)}</div>` : ''}

              <button type="submit" class="btn btn-primary btn-block btn-lg">${isId ? 'Buat Akun Demo' : 'Create demo account'}</button>
            </form>

            <div style="margin-top: var(--space-4); text-align:center; font-size:0.85rem;">
              ${isId ? 'Sudah memiliki akun demo?' : 'Already have a demo account?'}
              <a href="#/login" data-link="/login" style="color:var(--color-forest); font-weight:600; text-decoration:underline; margin-left:4px;">${isId ? 'Masuk sekarang' : 'Sign in'}</a>
            </div>
          </div>
        </div>
      </section>
    `;

    container.querySelectorAll('[data-select-role]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedRole = btn.getAttribute('data-select-role');
        renderView();
      });
    });

    const form = container.querySelector('#signup-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const isIdSubmit = getLanguage() === 'id';
        const name = container.querySelector('#su-name').value.trim();
        const email = container.querySelector('#su-email').value.trim();
        const pwd = container.querySelector('#su-password').value;
        const organizationType = container.querySelector('#su-org-type').value;
        const area = container.querySelector('#su-area').value;
        const consent = container.querySelector('#su-consent').checked;

        if (!name || name.length < 2) {
          errorMsg = isIdSubmit
            ? 'Masukkan nama atau nama organisasi yang valid.'
            : 'Please enter a valid name or organization title.';
          renderView();
          return;
        }
        if (!isValidEmail(email)) {
          errorMsg = isIdSubmit
            ? 'Masukkan alamat email yang valid.'
            : 'Please enter a valid email address.';
          renderView();
          return;
        }
        if (!pwd || pwd.length < 4) {
          errorMsg = isIdSubmit
            ? 'Masukkan kata sandi demo (minimal 4 karakter).'
            : 'Please enter a demo password.';
          renderView();
          return;
        }
        if (!consent) {
          errorMsg = isIdSubmit
            ? 'Harap setujui ketentuan dan pernyataan tanggung jawab makanan.'
            : 'Please accept the terms and food responsibility notice.';
          renderView();
          return;
        }

        errorMsg = '';
        createdAccount = appState.registerUser({
          name,
          email,
          role: selectedRole,
          organizationType,
          area
        });
        showToast(
          isIdSubmit
            ? `Berhasil membuat akun demo untuk ${createdAccount.name}`
            : `Created demo account for ${createdAccount.name}`,
          'success'
        );
        renderView();
      });
    }
  }

  renderView();
}

export function renderProfilePage(container) {
  const user = appState.getCurrentUser();
  if (!user) {
    router.navigate('/login');
    return;
  }

  const isId = getLanguage() === 'id';

  container.innerHTML = `
    <section class="section-sm">
      <div class="container-narrow">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom: var(--space-5);">
          <div>
            <span class="eyebrow">${isId ? 'Akun &amp; Organisasi' : 'Account &amp; Organization'}</span>
            <h1>${isId ? 'Pengaturan Profil' : 'Profile settings'}</h1>
          </div>
          <a href="#/dashboard" data-link="/dashboard" class="btn btn-secondary btn-sm">${icon('arrowLeft', 12)} ${isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}</a>
        </div>

        <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-lg); padding: var(--space-6);">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding-bottom: var(--space-4); margin-bottom: var(--space-4); border-bottom: 1px solid var(--color-line);">
            <div>
              <h2 style="font-size:1.35rem;">${escapeHtml(user.name)}</h2>
              <div style="font-size:0.85rem; color:var(--color-muted);">${escapeHtml(user.email)}</div>
            </div>
            <div style="display:flex; gap:8px;">
              <span class="badge badge-forest" style="text-transform:capitalize;">${isId ? 'Peran' : 'Role'}: ${escapeHtml(user.role === 'provider' ? 'Penyedia Makanan' : user.role === 'recipient' ? 'Organisasi Komunitas' : user.role === 'individual' ? 'Warga / Individu' : 'Admin')}</span>
              <span class="badge-demo" style="padding:3px 8px; border-radius:4px;">${isId ? 'Profil demo' : 'Demo profile'}</span>
            </div>
          </div>

          <form id="profile-update-form">
            <div class="grid-2">
              <div class="form-group">
                <label for="prof-name" class="form-label">${isId ? 'Nama / Organisasi' : 'Name / Organization'}</label>
                <input type="text" id="prof-name" class="form-input" value="${escapeHtml(user.name)}" required />
              </div>

              <div class="form-group">
                <label for="prof-org-type" class="form-label">${isId ? 'Tipe Organisasi' : 'Organization type'}</label>
                <input type="text" id="prof-org-type" class="form-input" value="${escapeHtml(user.organizationType || '')}" />
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label for="prof-area" class="form-label">${isId ? 'Wilayah Utama Bali' : 'Primary Bali area'}</label>
                <select id="prof-area" class="form-select">
                  ${BALI_AREAS.map(
                    (a) => `<option value="${escapeHtml(a)}" ${user.area === a ? 'selected' : ''}>${escapeHtml(a)}</option>`
                  ).join('')}
                </select>
              </div>

              <div class="form-group">
                <label for="prof-role" class="form-label">${isId ? 'Peran Demo Aktif' : 'Active demo role'}</label>
                <select id="prof-role" class="form-select">
                  <option value="provider" ${user.role === 'provider' ? 'selected' : ''}>${isId ? 'Penyedia Makanan' : 'Food provider'}</option>
                  <option value="recipient" ${user.role === 'recipient' ? 'selected' : ''}>${isId ? 'Organisasi Komunitas' : 'Recipient organization'}</option>
                  <option value="individual" ${user.role === 'individual' ? 'selected' : ''}>${isId ? 'Warga / Individu' : 'Individual recipient'}</option>
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>${isId ? 'Administrator Platform' : 'Platform administrator'}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <span class="form-label">${isId ? 'Preferensi Notifikasi (Demo)' : 'Notification preferences (Demo)'}</span>
              <label class="checkbox-label">
                <input type="checkbox" checked />
                <span>${isId ? 'Beri tahu saya saat reservasi dibuat atau jendela penjemputan tersisa kurang dari 60 menit' : 'Notify me when a reservation is created or collection window is within 60 minutes'}</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" checked />
                <span>${isId ? `Beri tahu saya saat ada surplus makanan baru di area saya (${escapeHtml(user.area)})` : `Notify me when new surplus listings match my area (${escapeHtml(user.area)})`}</span>
              </label>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-line);">
              <a href="#/login" data-link="/login" class="btn btn-danger-outline btn-sm">${isId ? 'Ganti akun / Keluar' : 'Switch account / Sign out'}</a>
              <button type="submit" class="btn btn-primary">${isId ? 'Simpan perubahan profil' : 'Save profile changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  const form = container.querySelector('#profile-update-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const isIdSave = getLanguage() === 'id';
      appState.updateCurrentUserProfile({
        name: container.querySelector('#prof-name').value.trim(),
        organizationType: container.querySelector('#prof-org-type').value.trim(),
        area: container.querySelector('#prof-area').value,
        role: container.querySelector('#prof-role').value
      });
      showToast(isIdSave ? 'Pengaturan profil berhasil diperbarui.' : 'Profile settings updated.', 'success');
      renderProfilePage(container);
    });
  }
}

