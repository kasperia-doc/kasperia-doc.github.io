function $(id) { return document.getElementById(id); }

function safeStringify(value) {
  try { return JSON.stringify(value, null, 2); } catch (_) { return String(value); }
}

function logTo(id, title, value) {
  const el = $(id);
  const time = new Date().toLocaleTimeString();
  el.textContent = `[${time}] ${title}\n${typeof value === 'string' ? value : safeStringify(value)}\n\n` + el.textContent;
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (button) {
      const old = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => button.textContent = old, 1000);
    }
  } catch (e) {
    alert('Copy failed: ' + e.message);
  }
}

document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-copy]');
  if (!btn) return;
  copyText(btn.getAttribute('data-copy'), btn);
});

function getKasperia() {
  if (window.kasperia && window.kasperia.isKasperia) return window.kasperia;
  if (window.kasperia) return window.kasperia;
  return null;
}

function getKasperiaEthereum() {
  const wallet = getKasperia();
  return wallet && wallet.ethereum ? wallet.ethereum : null;
}

function toHexWei(decimalText) {
  const value = String(decimalText || '0').trim();
  const [wholeRaw, fractionRaw = ''] = value.split('.');
  const whole = BigInt(wholeRaw || '0');
  const fraction = (fractionRaw + '000000000000000000').slice(0, 18);
  const wei = whole * 1000000000000000000n + BigInt(fraction || '0');
  return '0x' + wei.toString(16);
}

function buildPayload(method, params, callback) {
  return {
    id: 'kasperia_test_' + Date.now(),
    origin: location.origin === 'null' ? 'local-test-page' : location.origin,
    method,
    params,
    callback: callback || ''
  };
}

function buildWalletRequestLink(payload, useUniversalLink) {
  const encoded = encodeURIComponent(JSON.stringify(payload));
  const base = useUniversalLink ? 'https://link.kasperia.app/wallet/request' : 'kasperia://wallet/request';
  return `${base}?payload=${encoded}`;
}

function qrUrl(text) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(text);
}
