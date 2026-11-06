/**
 * FoodLoop Header & Demo Context Switcher Component (PRD Section 7.1 & 23)
 */

import { appState } from '../state.js';
import { router } from '../router.js';
import { escapeHtml } from '../../utils/validation.js';
import { showToast } from './toast.js';
import { openModal, closeModal } from './modal.js';
import { icon } from './icons.js';
import { openQuickGuideModal } from './quickGuideModal.js';
import { t, getLanguage, toggleLanguage } from '../services/i18nService.js';

let scrollListenerBound = false;

export function renderHeader(currentPathname = '/') {
  const headerContainer = document.getElementById('app-header');
  if (!headerContainer) return;

  const user = appState.getCurrentUser();
  const currentLang = getLanguage();
  const isLargeText = document.documentElement.classList.contains('large-text-mode');
  const isActive = (path) => {
    if (path === '/') return currentPathname === '/';
    return currentPathname === path || currentPathname.startsWith(`${path}/`);
  };

  const roleBadgeLabel = user
    ? `${user.name} (${user.role === 'provider' ? t('demo_role_provider') : user.role === 'recipient' ? t('demo_role_recipient') : user.role === 'individual' ? t('demo_role_individual') : 'Admin'})`
    : 'Tamu / Guest';

  const storedCollapse = localStorage.getItem('foodloop_demo_bar_collapsed');
  const isDemoBarCollapsed = storedCollapse !== null
    ? storedCollapse === 'true'
    : (typeof window !== 'undefined' && window.innerWidth <= 768);

  const toggleLabel = isDemoBarCollapsed
    ? (currentLang === 'id' ? 'Tampilkan' : 'Show')
    : (currentLang === 'id' ? 'Sembunyikan' : 'Hide');

  headerContainer.innerHTML = `
    <div class="demo-context-bar ${isDemoBarCollapsed ? 'is-collapsed' : ''}" id="demo-context-bar" role="region" aria-label="Prototype Demo Role Switcher">
      <div class="container demo-context-inner">
        <div class="demo-context-left">
          <div class="demo-context-info">
            <span class="demo-pill-indicator">
              ${icon('statusDot', 7)}
              <span class="hide-mobile">${t('demo_pill')}</span>
              <span class="show-mobile" style="display:none; font-weight:700;">DEMO</span>
            </span>
            <span class="demo-session-badge">${t('demo_session')}: <strong>${escapeHtml(roleBadgeLabel)}</strong></span>
          </div>
          <button type="button" class="demo-toggle-collapse-btn" id="demo-bar-toggle-btn" aria-expanded="${!isDemoBarCollapsed}" title="${isDemoBarCollapsed ? 'Tampilkan menu demo' : 'Sembunyikan menu demo'}">
            <span id="demo-bar-toggle-label">${toggleLabel}</span>
            <span id="demo-bar-toggle-icon" style="display:inline-flex; align-items:center;">
              ${isDemoBarCollapsed ? icon('chevronDown', 11) : icon('chevronUp', 11)}
            </span>
          </button>
        </div>
        <div class="demo-role-switcher ${isDemoBarCollapsed ? 'is-hidden' : ''}" id="demo-role-switcher" role="group" aria-label="Switch demo role and settings">
          <button type="button" class="demo-role-btn" id="header-lang-btn" title="Ganti Bahasa (Indonesia / English)">
            ${icon('globe', 11)} <strong>${currentLang === 'id' ? 'ID (Bahasa)' : 'EN (English)'}</strong>
          </button>
          <button type="button" class="demo-role-btn" id="header-guide-btn" title="Panduan Penggunaan Cepat untuk Pemula & Lansia">
            ${icon('info', 11)} ${t('nav_quickGuide')}
          </button>
          <button type="button" class="demo-role-btn ${isLargeText ? 'is-active' : ''}" id="header-text-toggle-btn" title="Ubah Ukuran Tulisan untuk Kemudahan Baca Lansia">
            ${icon('sparkles', 11)} <span id="header-text-toggle-label">${isLargeText ? `${t('nav_textSize')}: ${t('nav_textLarge')}` : `${t('nav_textSize')}: ${t('nav_textNormal')}`}</span>
          </button>
          <span style="color:#6A726A;" class="hide-mobile">|</span>
          <span style="color:#9DA59D;" class="hide-mobile">${t('demo_switchRole')}:</span>
          <button type="button" class="demo-role-btn ${user?.id === 'recipient_001' ? 'is-active' : ''}" data-switch-user="recipient_001">
            ${t('demo_role_recipient')}
          </button>
          <button type="button" class="demo-role-btn ${user?.id === 'provider_001' ? 'is-active' : ''}" data-switch-user="provider_001">
            ${t('demo_role_provider')}
          </button>
          <button type="button" class="demo-role-btn ${user?.id === 'individual_001' ? 'is-active' : ''}" data-switch-user="individual_001">
            ${t('demo_role_individual')}
          </button>
          <button type="button" class="demo-role-btn" id="header-reset-demo-btn" title="Restore initial seed listings and reservations">
            ${icon('refresh', 11)} ${t('demo_resetBtn')}
          </button>
        </div>
      </div>
    </div>

    <header class="site-header" id="sticky-site-header">
      <div class="container header-inner">
        <a href="#/" data-link="/" class="brand-logo" aria-label="FoodLoop Home">
          <img src="assets/images/logo.png" alt="FoodLoop Logo" class="brand-logo-img" width="34" height="34" />
          <span>FoodLoop</span>
        </a>

        <nav class="nav-links" aria-label="Primary navigation">
          <a href="#/discover" data-link="/discover" class="nav-link ${isActive('/discover') || isActive('/food') ? 'is-active' : ''}">${t('nav_discover')}</a>
          <a href="#/how-it-works" data-link="/how-it-works" class="nav-link ${isActive('/how-it-works') ? 'is-active' : ''}">${t('nav_howItWorks')}</a>
          <a href="#/assistant" data-link="/assistant" class="nav-link ${isActive('/assistant') ? 'is-active' : ''}">${t('nav_assistant')}</a>
          <a href="#/impact" data-link="/impact" class="nav-link ${isActive('/impact') ? 'is-active' : ''}">${t('nav_impact')}</a>
        </nav>

        <div class="header-actions">
          <button type="button" class="btn btn-ghost btn-sm" id="site-lang-btn" title="Ganti Bahasa (ID / EN)" aria-label="Ganti Bahasa">
            ${icon('globe', 15)} <span>${currentLang.toUpperCase()}</span>
          </button>
          <button type="button" class="btn btn-ghost btn-sm hide-tablet" id="site-guide-btn" title="Bantuan & Panduan Pakai" aria-label="Panduan dan Bantuan">
            ${icon('info', 15)} <span>${t('nav_quickGuide')}</span>
          </button>
          <a href="#/donate" data-link="/donate" class="btn btn-primary btn-sm hide-mobile">${t('nav_listSurplus')}</a>
          ${
            user
              ? `<a href="#/dashboard" data-link="/dashboard" class="btn btn-secondary btn-sm hide-tablet ${isActive('/dashboard') || isActive('/profile') ? 'is-active' : ''}">
                   ${t('nav_dashboard')}
                 </a>`
              : ''
          }
          <a href="#/login" data-link="/login" class="btn btn-ghost btn-sm hide-tablet ${isActive('/login') ? 'is-active' : ''}">
            ${user ? t('nav_switchAccount') : t('nav_signIn')}
          </a>
          <button type="button" class="mobile-menu-btn" id="mobile-menu-toggle" aria-expanded="false" aria-controls="mobile-nav-drawer" aria-label="Open navigation menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M4 7h16M4 12h16M4 17h16"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="mobile-drawer" id="mobile-nav-drawer" aria-label="Mobile navigation">
        <div style="display:flex; gap:8px; padding-bottom:12px; margin-bottom:12px; border-bottom:1px solid var(--color-line);">
          <button type="button" class="btn btn-secondary btn-sm" id="mobile-lang-btn" style="flex:1;">
            ${icon('globe', 13)} ${currentLang === 'id' ? 'ID (Bahasa)' : 'EN (English)'}
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="mobile-text-toggle-btn" style="flex:1;">
            ${icon('sparkles', 13)} ${isLargeText ? 'Teks: A' : 'Teks: A+'}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" id="mobile-guide-btn" style="flex:1;">
            ${icon('info', 13)} Panduan
          </button>
        </div>
        <nav class="mobile-nav-list">
          <a href="#/discover" data-link="/discover" class="nav-link ${isActive('/discover') ? 'is-active' : ''}">${t('nav_discover')}</a>
          <a href="#/how-it-works" data-link="/how-it-works" class="nav-link ${isActive('/how-it-works') ? 'is-active' : ''}">${t('nav_howItWorks')}</a>
          <a href="#/assistant" data-link="/assistant" class="nav-link ${isActive('/assistant') ? 'is-active' : ''}">${t('nav_assistant')}</a>
          <a href="#/partners" data-link="/partners" class="nav-link ${isActive('/partners') ? 'is-active' : ''}">${t('nav_partners')}</a>
          <a href="#/impact" data-link="/impact" class="nav-link ${isActive('/impact') ? 'is-active' : ''}">${t('nav_impact')}</a>
          <a href="#/dashboard" data-link="/dashboard" class="nav-link ${isActive('/dashboard') ? 'is-active' : ''}">${t('nav_dashboard')}</a>
          <a href="#/profile" data-link="/profile" class="nav-link ${isActive('/profile') ? 'is-active' : ''}">Profil & Pengaturan</a>
          <a href="#/login" data-link="/login" class="nav-link ${isActive('/login') ? 'is-active' : ''}">${user ? t('nav_switchAccount') : t('nav_signIn')}</a>
        </nav>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <a href="#/donate" data-link="/donate" class="btn btn-primary btn-block">${t('nav_listSurplus')}</a>
        </div>
      </div>
    </header>
  `;

  // Bind Demo bar collapse/expand toggle
  const demoToggleBtn = headerContainer.querySelector('#demo-bar-toggle-btn');
  const demoRoleSwitcher = headerContainer.querySelector('#demo-role-switcher');
  const demoBar = headerContainer.querySelector('#demo-context-bar');
  if (demoToggleBtn && demoRoleSwitcher) {
    demoToggleBtn.addEventListener('click', () => {
      const isCurrentlyHidden = demoRoleSwitcher.classList.contains('is-hidden');
      const labelEl = demoToggleBtn.querySelector('#demo-bar-toggle-label');
      const iconEl = demoToggleBtn.querySelector('#demo-bar-toggle-icon');

      if (isCurrentlyHidden) {
        demoRoleSwitcher.classList.remove('is-hidden');
        demoBar?.classList.remove('is-collapsed');
        demoToggleBtn.setAttribute('aria-expanded', 'true');
        if (labelEl) labelEl.textContent = currentLang === 'id' ? 'Sembunyikan' : 'Hide';
        if (iconEl) iconEl.innerHTML = icon('chevronUp', 11);
        localStorage.setItem('foodloop_demo_bar_collapsed', 'false');
      } else {
        demoRoleSwitcher.classList.add('is-hidden');
        demoBar?.classList.add('is-collapsed');
        demoToggleBtn.setAttribute('aria-expanded', 'false');
        if (labelEl) labelEl.textContent = currentLang === 'id' ? 'Tampilkan' : 'Show';
        if (iconEl) iconEl.innerHTML = icon('chevronDown', 11);
        localStorage.setItem('foodloop_demo_bar_collapsed', 'true');
      }
    });
  }

  // Bind Language switch triggers
  const langTriggers = headerContainer.querySelectorAll('#header-lang-btn, #site-lang-btn, #mobile-lang-btn');
  langTriggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextLang = toggleLanguage();
      showToast(nextLang === 'id' ? 'Bahasa diubah ke Bahasa Indonesia.' : 'Language changed to English.', 'info');
    });
  });

  // Bind Quick Guide modal triggers
  const guideTriggers = headerContainer.querySelectorAll('#header-guide-btn, #site-guide-btn, #mobile-guide-btn');
  guideTriggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      openQuickGuideModal();
    });
  });

  // Bind Large Text toggles (Elderly Accessibility)
  const toggleLargeText = () => {
    const nowLarge = document.documentElement.classList.toggle('large-text-mode');
    localStorage.setItem('foodloop_large_text', String(nowLarge));
    showToast(nowLarge ? 'Mode Tulisan Besar (A+) Diaktifkan.' : 'Mode Tulisan Normal Diaktifkan.', 'info');
    renderHeader(currentPathname);
  };

  const textToggleBtn = headerContainer.querySelector('#header-text-toggle-btn');
  if (textToggleBtn) {
    textToggleBtn.addEventListener('click', toggleLargeText);
  }
  const mobileTextToggleBtn = headerContainer.querySelector('#mobile-text-toggle-btn');
  if (mobileTextToggleBtn) {
    mobileTextToggleBtn.addEventListener('click', toggleLargeText);
  }

  // Bind role switcher buttons
  headerContainer.querySelectorAll('[data-switch-user]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetUserId = btn.getAttribute('data-switch-user');
      appState.setCurrentUser(targetUserId);
      const switchedUser = appState.getCurrentUser();
      showToast(`Switched demo session to ${switchedUser.name} (${switchedUser.role})`, 'success');
      router.resolve();
    });
  });

  // Bind reset demo data button
  const resetBtn = headerContainer.querySelector('#header-reset-demo-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      openModal({
        title: 'Reset Prototype Demo Data?',
        bodyHtml: `
          <p style="margin-bottom: 12px;">
            This will restore all surplus listings, reservations, completed handoffs, and impact metrics back to their initial seeded Bali demo state.
          </p>
          <div class="notice-banner">
            <span class="notice-banner-icon">${icon('info', 12)}</span>
            <span>Any custom listings or reservations created during this session will be cleared from browser localStorage.</span>
          </div>
        `,
        footerHtml: `
          <button type="button" class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
          <button type="button" class="btn btn-danger btn-sm" id="confirm-reset-seed-btn">Reset demo data</button>
        `,
        onMount(dialog) {
          const confirmBtn = dialog.querySelector('#confirm-reset-seed-btn');
          confirmBtn.addEventListener('click', () => {
            appState.resetToSeedData();
            closeModal();
            showToast('Demo data restored to initial state.', 'success');
            router.resolve();
          });
        }
      });
    });
  }

  // Bind mobile drawer toggle
  const mobileToggle = headerContainer.querySelector('#mobile-menu-toggle');
  const mobileDrawer = headerContainer.querySelector('#mobile-nav-drawer');
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!expanded));
      mobileDrawer.classList.toggle('is-open', !expanded);
    });

    // Close drawer when user taps a navigation link
    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileDrawer.classList.remove('is-open');
      });
    });
  }

  // Sticky scroll styling (Fixed on scroll)
  const updateScrollState = () => {
    const stickyEl = document.getElementById('sticky-site-header');
    if (stickyEl) {
      stickyEl.classList.toggle('is-scrolled', window.scrollY > 8);
    }
  };
  updateScrollState();

  if (!scrollListenerBound) {
    scrollListenerBound = true;
    window.addEventListener('scroll', updateScrollState, { passive: true });
  }
}

