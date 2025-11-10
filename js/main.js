
// Header underline animation
(function(){
  const nav = document.querySelector('.nav-links')
  if(!nav) return
  const underline = document.querySelector('.nav-underline')
  function moveUnderline(el){
    const r = el.getBoundingClientRect()
    const parent = nav.getBoundingClientRect()
    underline.style.width = r.width + 'px'
    underline.style.left = (r.left - parent.left) + 'px'
    underline.style.opacity = 1
  }
  const active = nav.querySelector('a.active') || nav.querySelector('a')
  if(active) moveUnderline(active)
  nav.addEventListener('mouseover', e => { const a = e.target.closest('a'); if(a) moveUnderline(a)})
  nav.addEventListener('mouseleave', () => { const a = nav.querySelector('a.active') || nav.querySelector('a'); if(a) moveUnderline(a)})
  window.addEventListener('resize', () => { const a = nav.querySelector('a.active') || nav.querySelector('a'); if(a) moveUnderline(a)})
})();

// Docs left nav active by scroll
(function(){
  const toc = document.querySelector('.docs nav')
  const article = document.querySelector('.docs article')
  if(!toc || !article) return
  const links = toc.querySelectorAll('a[href^="#"]')
  const map = new Map()
  let clickLock = false
  let clickTimer = null

  links.forEach(a => {
    const id = a.getAttribute('href').slice(1)
    const sec = document.getElementById(id)
    if(sec) map.set(sec, a)

    a.addEventListener('click', e => {
      links.forEach(l => l.classList.remove('active'))
      a.classList.add('active')
      clickLock = true
      clearTimeout(clickTimer)
      clickTimer = setTimeout(() => {
        clickLock = false
      }, 1000)
    })
  })
  const io = new IntersectionObserver((entries)=>{
    if (clickLock) return 
    entries.forEach(e=>{
      if(e.isIntersecting){
        links.forEach(l=>l.classList.remove('active'))
        const a = map.get(e.target)
        if(a) a.classList.add('active')
      }
    })
  },{rootMargin:'-20% 0px -70% 0px', threshold:[0,1]})
  map.forEach((a,sec)=>io.observe(sec))
})();

// Simple JS highlighter
(function(){
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function highlightJS(code){
    code = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, m=>`<span class="hl-cmt">${esc(m)}</span>`)
    // code = code.replace(/(['"\`])(?:(?!\1|\\).|\\.|\n)*\1/gm, m=>`<span class="hl-str">${esc(m)}</span>`)
    // code = code.replace(/\b(0x[\da-fA-F]+|\d+\.?\d*)\b/g, m=>`<span class="hl-num">${m}</span>`)
    const kw = '\\b(const|let|var|function|async|await|return|if|else|for|while|switch|case|break|continue|try|catch|throw|new|class|extends|super|import|from|export|default)\\b'
    code = code.replace(new RegExp(kw,'g'), m=>`<span class="hl-kw">${m}</span>`)
    code = code.replace(/(\b[a-zA-Z_\$][\w\$]*)\s*(?=\()/g, m=>`<span class="hl-fn">${m}</span>`)
    return code
  }
  document.querySelectorAll('code.language-js').forEach(el=>{
    const raw = el.textContent
    el.innerHTML = highlightJS(raw)
  })
  document.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const codeBlock = button.nextElementSibling.innerText.trim();
        try {
          await navigator.clipboard.writeText(codeBlock);
          button.textContent = 'Copied!';
          button.classList.add('copied');
          setTimeout(() => {
            button.textContent = 'Copy';
            button.classList.remove('copied');
          }, 1500);
        } catch (err) {
          button.textContent = 'Error';
        }
      });
    });
})();
