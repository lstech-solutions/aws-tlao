(function () {
  'use strict';

  const FOOTER_ID = 'tlao-login-footer';
  const UI_VERSION = '1.0.0';
  const LANDING_URL = 'https://xn--tlo-fla.com';
  const LANDING_LABEL = 'tláo.com';
  const TAGLINE = 'Secure webmail for hosted mission domains';
  let footer = null;

  function footerMarkup() {
    const year = String(new Date().getFullYear());
    return [
      '<div class="tlao-login-footer__version">TLÁO Mail Core v' + UI_VERSION + '</div>',
      '<div class="tlao-login-footer__tagline">' + TAGLINE + '</div>',
      '<div class="tlao-login-footer__meta">',
      '<span>&copy; ' + year + ' TLÁO. All rights reserved.</span>',
      '<span class="tlao-login-footer__dot" aria-hidden="true">•</span>',
      '<a href="' + LANDING_URL + '" target="_blank" rel="noreferrer noopener">Visit ' + LANDING_LABEL + '</a>',
      '</div>'
    ].join('');
  }

  function loginView() {
    return document.getElementById('V-Login');
  }

  function popupsRoot() {
    return document.getElementById('rl-popups');
  }

  function ensureFooter() {
    if (footer && footer.isConnected) {
      return footer;
    }

    const popups = popupsRoot();
    if (!popups) {
      return null;
    }

    footer = document.getElementById(FOOTER_ID);
    if (!footer) {
      footer = document.createElement('div');
      footer.id = FOOTER_ID;
      footer.hidden = true;
      footer.innerHTML = footerMarkup();
      popups.appendChild(footer);
    }

    return footer;
  }

  function syncFooter() {
    const login = loginView();
    const active = !!login && !login.hidden;

    const nextFooter = ensureFooter();
    if (!nextFooter) {
      return;
    }

    if (active && nextFooter.innerHTML !== footerMarkup()) {
      nextFooter.innerHTML = footerMarkup();
    }

    nextFooter.hidden = !active;
  }

  function start() {
    syncFooter();
    window.setInterval(syncFooter, 600);
    window.addEventListener('pageshow', syncFooter);
    window.addEventListener('load', syncFooter);
    document.addEventListener('visibilitychange', syncFooter);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
