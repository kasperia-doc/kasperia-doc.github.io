// Header underline animation
(function(){
  const nav = document.querySelector('.nav-links')
  if(!nav) return
  const underline = document.querySelector('.nav-underline')
  if(!underline) return
  function moveUnderline(el){
    const r = el.getBoundingClientRect()
    const parent = nav.getBoundingClientRect()
    underline.style.width = r.width + 'px'
    underline.style.left = (r.left - parent.left) + 'px'
    underline.style.opacity = 1
  }
  const active = nav.querySelector('a.active') || nav.querySelector('a')
  if(active) moveUnderline(active)
  nav.addEventListener('mouseover', e => { const a = e.target.closest('a'); if(a) moveUnderline(a) })
  nav.addEventListener('mouseleave', () => { const a = nav.querySelector('a.active') || nav.querySelector('a'); if(a) moveUnderline(a) })
  window.addEventListener('resize', () => { const a = nav.querySelector('a.active') || nav.querySelector('a'); if(a) moveUnderline(a) })
})();

// Docs left nav active by scroll. Scoped to docs pages only.
(function () {
  const toc = document.querySelector('.docs nav');
  const article = document.querySelector('.docs article');
  if (!toc || !article) return;
  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  if (!links.length) return;

  const sectionMap = new Map();
  let clickLock = false;
  let clickTimer = null;

  function setActive(link) {
    if (!link) return;
    links.forEach(item => item.classList.remove('active'));
    link.classList.add('active');
    const details = link.closest('details');
    if (details) {
      details.open = true;
    }

    // Optional: make active item visible inside sidebar
    const sidebar = link.closest('nav');
    if (sidebar) {
      const linkTop = link.offsetTop;
      const linkBottom = linkTop + link.offsetHeight;
      const viewTop = sidebar.scrollTop;
      const viewBottom = viewTop + sidebar.clientHeight;
      if (linkTop < viewTop) {
        sidebar.scrollTop = linkTop - 12;
      } else if (linkBottom > viewBottom) {
        sidebar.scrollTop = linkBottom - sidebar.clientHeight + 12;
      }
    }
  }

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const id = decodeURIComponent(href.slice(1));
    const section = document.getElementById(id);
    if (section) {
      sectionMap.set(section, link);
    }

    link.addEventListener('click', event => {
      event.preventDefault();
      setActive(link);
      clickLock = true;
      clearTimeout(clickTimer);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        history.replaceState(null, '', `#${id}`);
      }

      clickTimer = setTimeout(() => {
        clickLock = false;
      }, 700);
    });
  });

  const observer = new IntersectionObserver(
    entries => {
      if (clickLock) return;
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const link = sectionMap.get(visible[0].target);
      setActive(link);
    },
    {
      root: null,
      rootMargin: '-18% 0px -70% 0px',
      threshold: [0, 0.2, 1],
    }
  );

  sectionMap.forEach((link, section) => {
    observer.observe(section);
  });

  // Initial hash active state
  const initialHash = decodeURIComponent(location.hash || '').replace(/^#/, '');
  if (initialHash) {
    const initialLink = toc.querySelector(`a[href="#${CSS.escape(initialHash)}"]`);
    if (initialLink) {
      setActive(initialLink);
    }
  } else {
    setActive(links[0]);
  }
})();

// Docs syntax highlight and copy buttons only. Scoped to docs pages.
(function(){
  const article = document.querySelector('.docs article')
  if(!article) return

  function esc(text){
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function paintPlain(segment){
    let html = esc(segment)
    html = html.replace(/\b(0x[\da-fA-F]+|\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>')
    html = html.replace(/\b(const|let|var|function|async|await|return|if|else|for|while|switch|case|break|continue|try|catch|throw|new|class|extends|super|import|from|export|default|undefined|null|true|false)\b/g, '<span class="hl-kw">$1</span>')
    html = html.replace(/\b([a-zA-Z_$][\w$]*)\s*(?=\()/g, '<span class="hl-fn">$1</span>')
    return html
  }

  function highlightJS(raw){
    let out = ''
    let plain = ''
    let i = 0

    function flush(){
      if(plain){
        out += paintPlain(plain)
        plain = ''
      }
    }

    while(i < raw.length){
      const ch = raw[i]
      const next = raw[i + 1]

      // String literals. This protects URLs such as "kasperia://bridge" from being parsed as comments.
      if(ch === '"' || ch === "'" || ch === '`'){
        flush()
        const quote = ch
        let j = i + 1
        let escaped = false
        while(j < raw.length){
          const c = raw[j]
          if(escaped){
            escaped = false
          }else if(c === '\\'){
            escaped = true
          }else if(c === quote){
            j++
            break
          }
          j++
        }
        out += '<span class="hl-str">' + esc(raw.slice(i, j)) + '</span>'
        i = j
        continue
      }

      // Line comments.
      if(ch === '/' && next === '/'){
        flush()
        let j = i + 2
        while(j < raw.length && raw[j] !== '\n') j++
        out += '<span class="hl-cmt">' + esc(raw.slice(i, j)) + '</span>'
        i = j
        continue
      }

      // Block comments.
      if(ch === '/' && next === '*'){
        flush()
        let j = i + 2
        while(j < raw.length && !(raw[j] === '*' && raw[j + 1] === '/')) j++
        j = Math.min(raw.length, j + 2)
        out += '<span class="hl-cmt">' + esc(raw.slice(i, j)) + '</span>'
        i = j
        continue
      }

      plain += ch
      i++
    }
    flush()
    return out
  }

  article.querySelectorAll('code.language-js').forEach(el => {
    if(el.querySelector('.hl-kw, .hl-str, .hl-num, .hl-cmt, .hl-fn')) return
    const raw = el.textContent
    el.innerHTML = highlightJS(raw)
  })

  function getCopyText(button){
    const explicit = button.getAttribute('data-copy')
    if(explicit) return explicit

    const qrBox = button.closest('.qr-example-left')
    if(qrBox){
      const value = qrBox.querySelector('.qr-copy-value')
      if(value) return value.textContent.trim()
    }

    const pre = button.closest('pre')
    if(pre){
      const code = pre.querySelector('code')
      if(code) return code.textContent.trim()
    }

    const parent = button.parentElement
    const value = parent ? parent.querySelector('.qr-copy-value, code') : null
    return value ? value.textContent.trim() : ''
  }

  async function copyText(text){
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(text)
      return
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    if(!ok) throw new Error('copy failed')
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('.docs article .copy-btn, .docs article .qr-copy-btn')
    if(!button) return
    event.preventDefault()
    event.stopPropagation()

    const text = getCopyText(button)
    if(!text) return

    const old = button.textContent || 'Copy'
    try{
      await copyText(text)
      button.textContent = 'Copied!'
      button.classList.add('copied')
      setTimeout(() => {
        button.textContent = old
        button.classList.remove('copied')
      }, 1400)
    }catch(err){
      button.textContent = 'Copy failed'
      setTimeout(() => { button.textContent = old }, 1400)
    }
  })
})();
