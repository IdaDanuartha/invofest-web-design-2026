/**
 * FoodLoop Footer Component (PRD Section 7.11)
 */

import { openModal } from './modal.js';
import { t, getLanguage } from '../services/i18nService.js';

export function renderFooter() {
  const footerContainer = document.getElementById('app-footer');
  if (!footerContainer) return;

  const year = new Date().getFullYear();
  const lang = getLanguage();

  footerContainer.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="#/" data-link="/" class="brand-logo" style="color: var(--color-paper);">
              <img src="assets/images/logo.png" alt="FoodLoop Logo" class="brand-logo-img" width="34" height="34" />
              <span>FoodLoop</span>
            </a>
            <p>${t('footer_about')}</p>
            <p style="margin-top: 12px; font-size: 0.75rem; color: #9DA59D;">
              ${lang === 'id' 
                ? 'Prototipe Bali - Denpasar & Badung. Seluruh data mitra dan persediaan makanan merupakan simulasi untuk demonstrasi kompetisi.' 
                : 'Bali Prototype - Denpasar & Badung. All sample partner locations and inventory are clearly labelled for competition demonstration.'}
            </p>
          </div>

          <div class="footer-col">
            <h4>${lang === 'id' ? 'Temukan Makanan' : 'Discover'}</h4>
            <ul class="footer-links">
              <li><a href="#/discover" data-link="/discover">${t('nav_discover')}</a></li>
              <li><a href="#/how-it-works" data-link="/how-it-works">${t('nav_howItWorks')}</a></li>
              <li><a href="#/partners" data-link="/partners">${t('nav_partners')}</a></li>
              <li><a href="#/assistant" data-link="/assistant">${t('nav_assistant')}</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>${lang === 'id' ? 'Partisipasi' : 'Participate'}</h4>
            <ul class="footer-links">
              <li><a href="#/donate" data-link="/donate">${t('nav_listSurplus')}</a></li>
              <li><a href="#/signup" data-link="/signup">${lang === 'id' ? 'Daftar sebagai penerima' : 'Join as recipient'}</a></li>
              <li><a href="#/login" data-link="/login">${t('nav_signIn')}</a></li>
              <li><a href="#/dashboard" data-link="/dashboard">${t('nav_dashboard')}</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>${lang === 'id' ? 'Pelajari' : 'Learn'}</h4>
            <ul class="footer-links">
              <li><a href="#/impact" data-link="/impact">${t('nav_impact')}</a></li>
              <li><a href="#/how-it-works" data-link="/how-it-works">${lang === 'id' ? 'Tanggung Jawab & FAQ' : 'Food responsibility & FAQ'}</a></li>
              <li><button type="button" data-footer-modal="contact">${lang === 'id' ? 'Hubungi tim FoodLoop' : 'Contact FoodLoop team'}</button></li>
              <li><button type="button" data-footer-modal="privacy">${lang === 'id' ? 'Privasi & Ketentuan' : 'Privacy & terms'}</button></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div>&copy; ${year} FoodLoop Prototype. ${lang === 'id' ? 'Dibuat dengan HTML Semantik, CSS Murni, dan ES Modules.' : 'Built with semantic HTML, CSS, and vanilla ES Modules.'}</div>
          <div style="display:flex; gap:16px; flex-wrap:wrap;">
            <button type="button" data-footer-modal="privacy" style="color:#9DA59D; text-decoration:underline;">${lang === 'id' ? 'Pemberitahuan Privasi' : 'Privacy Notice'}</button>
            <button type="button" data-footer-modal="terms" style="color:#9DA59D; text-decoration:underline;">${lang === 'id' ? 'Ketentuan & Tanggung Jawab Pangan' : 'Terms & Food Responsibility'}</button>
          </div>
        </div>
      </div>
    </footer>
  `;

  footerContainer.querySelectorAll('[data-footer-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-footer-modal');
      if (type === 'contact') {
        openModal({
          title: 'Contact FoodLoop (Bali Prototype)',
          bodyHtml: `
            <p style="margin-bottom: 12px;">
              FoodLoop is a competition prototype demonstrating structured surplus-food discovery, reservation, and handoff tracking across Denpasar and Badung.
            </p>
            <div class="info-spec-box" style="margin-bottom: 12px;">
              <div style="font-size: 0.78rem; color: var(--color-muted);">Prototype Inquiries</div>
              <div style="font-weight: 600;">hello@foodloop.example.test</div>
            </div>
            <p style="font-size: 0.82rem; color: var(--color-muted);">
              Want to test partner onboarding? Visit the <a href="#/partners" data-link="/partners" data-modal-close style="color:var(--color-forest); text-decoration:underline;">Partners page</a> to submit a sample organization profile.
            </p>
          `,
          footerHtml: `<button type="button" class="btn btn-primary btn-sm" data-modal-close>Close</button>`
        });
      } else {
        openModal({
          title: 'Prototype Privacy & Food Responsibility Terms',
          bodyHtml: `
            <p style="margin-bottom: 12px;">
              <strong>1. Prototype Data Storage:</strong> This competition prototype stores demo state in your browser's <code>localStorage</code>. No personal data or passwords are transmitted to external servers.
            </p>
            <p style="margin-bottom: 12px;">
              <strong>2. Food Safety &amp; Disclosure:</strong> FoodLoop facilitates discovery and coordination but does not certify food safety. Food providers remain responsible for accurate allergen disclosure, chilling/storage compliance, and food suitability. Recipients always retain the right to inspect and decline food at handoff.
            </p>
            <p style="font-size: 0.82rem; color: var(--color-muted);">
              <strong>3. AI Assistance:</strong> FoodLoop Assist outputs are structured drafts and transparent match rankings. Humans verify and approve every decision.
            </p>
          `,
          footerHtml: `<button type="button" class="btn btn-primary btn-sm" data-modal-close>Understood</button>`
        });
      }
    });
  });
}

