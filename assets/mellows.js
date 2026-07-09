/* MELLOWS - front-end demo interactions (no server / localStorage based) */
(function () {
  var CART_KEY = 'mellows_cart', USER_KEY = 'mellows_user';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function readJSON(k, f) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } }
  function getCart() { return readJSON(CART_KEY, []); }
  function setCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateBadge(); }
  function getUser() { return readJSON(USER_KEY, null); }
  function setUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
  function logout() { localStorage.removeItem(USER_KEY); }
  function won(n) { return (n || 0).toLocaleString('ko-KR') + '원'; }
  function num(s) { return parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function page() { return (location.pathname.split('/').pop() || 'index.html').toLowerCase() || 'index.html'; }
  function getParam(k) { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } }

  /* product catalog (keyed by image file, e.g. product-05) */
  var CATALOG = {
    'product-01': { en: 'Soft Tailored Jacket', ko: '오트 베이지 자켓', cat: '아우터', price: 89000, original: 109000, badge: 'NEW' },
    'product-02': { en: 'Ribbon Shirring Blouse', ko: '아이보리 블라우스', cat: '블라우스', price: 49000 },
    'product-03': { en: 'Pleated Midi Skirt', ko: '크림 플리츠', cat: '스커트', price: 59000, badge: 'BEST' },
    'product-04': { en: 'Classic Trench Coat', ko: '베이지 트렌치', cat: '아우터', price: 129000 },
    'product-05': { en: 'Cable Knit Cardigan', ko: '로즈 니트', cat: '니트', price: 69000 },
    'product-06': { en: 'Daily Wide Denim', ko: '라이트 블루', cat: '데님', price: 54000, original: 64000, badge: '15%' },
    'product-07': { en: 'Satin Slip Dress', ko: '로즈 브라운', cat: '원피스', price: 79000 },
    'product-08': { en: 'Tweed Crop Jacket', ko: '밀크 트위드', cat: '아우터', price: 98000 },
    'product-09': { en: 'Cotton Logo Tee', ko: '크림 화이트', cat: '티셔츠', price: 29000 },
    'product-10': { en: 'Stripe Knit Top', ko: '소프트 스트라이프', cat: '니트', price: 42000 },
    'product-11': { en: 'Pintuck Straight Slacks', ko: '모카 베이지', cat: '팬츠', price: 62000 },
    'product-12': { en: 'Lace Collar Blouse', ko: '빈티지 아이보리', cat: '블라우스', price: 52000 },
    'product-13': { en: 'Feminine Mini Dress', ko: '더스티 로즈', cat: '원피스', price: 74000 },
    'product-14': { en: 'Suede Mary Jane', ko: '브라운', cat: '슈즈', price: 68000 },
    'product-15': { en: 'Half Moon Shoulder Bag', ko: '카멜', cat: '백', price: 58000 },
    'product-16': { en: 'Soft Wool Muffler', ko: '오트밀', cat: '액세서리', price: 35000 }
  };
  function keyFromSrc(src) { var m = String(src || '').match(/(product-\d+)/); return m ? m[1] : null; }

  /* shared styles injected once */
  var css =
    '.cart-badge{position:absolute;top:-8px;right:-10px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--point,#9f6f62);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;font-family:var(--font-ko)}'
    + '.toast{position:fixed;left:50%;bottom:34px;transform:translateX(-50%) translateY(20px);background:#111;color:#fff;padding:14px 22px;border-radius:10px;font-size:14px;font-weight:700;z-index:200;opacity:0;pointer-events:none;transition:.3s;box-shadow:0 10px 30px rgba(0,0,0,.25);max-width:88vw;text-align:center}'
    + '.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}'
    + '.swatch.sel{border-color:var(--point,#9f6f62);box-shadow:0 0 0 1px var(--point,#9f6f62) inset}'
    + '.thumbs button.sel{border-color:var(--point,#9f6f62)}'
    + '.field-err{border-color:#d64545 !important}'
    + '.addcart{margin-top:12px;width:100%;height:40px;border:1px solid var(--line,#eadbd2);background:#fff;border-radius:8px;font-weight:800;cursor:pointer;font-family:var(--font-ko);position:relative;z-index:3}'
    + '.addcart:hover{background:var(--point,#9f6f62);color:#fff;border-color:var(--point,#9f6f62)}'
    + '.cart-empty{padding:60px 0;text-align:center}'
    + '.cart-line{display:grid;grid-template-columns:1fr 150px 140px 70px;gap:20px;padding:20px 24px;border-bottom:1px solid var(--line,#eadbd2);align-items:center}'
    + '.cart-line .rm{background:none;border:0;color:#999;cursor:pointer;font-size:13px;text-decoration:underline}'
    + '.stepper{display:inline-flex;align-items:center;gap:8px}'
    + '.stepper button{width:30px;height:30px;border:1px solid var(--line,#eadbd2);background:#fff;border-radius:6px;cursor:pointer;font-weight:800}'
    + '.stepper span{min-width:24px;text-align:center;font-weight:700}'
    + '@media(max-width:900px){.cart-line{grid-template-columns:1fr;gap:8px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  function updateBadge() {
    var count = getCart().reduce(function (a, i) { return a + i.qty; }, 0);
    $$('a[href="cart.html"]').forEach(function (a) {
      if (a.classList.contains('logo')) return;
      a.style.position = 'relative';
      var b = a.querySelector('.cart-badge');
      if (count > 0) { if (!b) { b = document.createElement('span'); b.className = 'cart-badge'; a.appendChild(b); } b.textContent = count; }
      else if (b) { b.remove(); }
    });
  }

  function addToCart(item) {
    var cart = getCart();
    var found = cart.filter(function (i) { return i.name === item.name && i.color === item.color; })[0];
    if (found) { found.qty += item.qty; } else { cart.push(item); }
    setCart(cart);
  }

  /* header: cart badge + login state */
  function initHeader() {
    updateBadge();
    var user = getUser();
    var uicon = $('a[href="login.html"]');
    if (!uicon) return;
    if (user) {
      uicon.title = user.name + '님 · 클릭 시 로그아웃';
      uicon.addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm(user.name + '님, 로그아웃 하시겠어요?')) {
          logout(); toast('로그아웃 되었습니다'); setTimeout(function () { location.reload(); }, 600);
        }
      });
    } else {
      uicon.title = '로그인';
    }
  }

  /* product listing: add "장바구니 담기" to each card */
  function initListing() {
    $$('.products .item').forEach(function (li) {
      var nameEl = li.querySelector('.name'), priceEl = li.querySelector('.price');
      if (!nameEl || !priceEl) return;
      var img = li.querySelector('img');
      /* point the card at its own product detail */
      var link = li.querySelector('a');
      var key = keyFromSrc(img ? img.getAttribute('src') : '');
      if (link && key) link.setAttribute('href', 'product-detail.html?p=' + key);
      if (li.querySelector('.addcart')) return;
      var price = num(priceEl.textContent);
      var info = li.querySelector('.info') || li;
      var btn = document.createElement('button');
      btn.className = 'addcart'; btn.type = 'button'; btn.textContent = '장바구니 담기';
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        addToCart({ name: nameEl.textContent.trim(), price: price, color: '', qty: 1, img: img ? img.getAttribute('src') : '' });
        toast('장바구니에 담았습니다');
      });
      info.appendChild(btn);
    });
  }

  /* product detail: thumbs, swatches, qty, add/buy, tabs */
  function applyProduct() {
    var key = getParam('p');
    var prod = key && CATALOG[key];
    if (!prod) return; /* no param -> keep default sample product */
    var img = 'assets/images/' + key + '.jpg';
    var main = $('.main-photo img');
    if (main) { main.src = img; main.alt = prod.en; }
    var firstThumb = $('.thumbs button img');
    if (firstThumb) { firstThumb.src = img; firstThumb.alt = prod.en + ' 썸네일'; }
    var h1 = $('.summary h1'); if (h1) h1.textContent = prod.en;
    var bcCat = $$('.breadcrumb span')[2]; if (bcCat) bcCat.textContent = prod.cat;
    var bcName = $('.breadcrumb b'); if (bcName) bcName.textContent = prod.en;
    document.title = prod.en + ' - MELLOWS';
    var priceEl = $('.price-main .price'); if (priceEl) priceEl.textContent = won(prod.price);
    var del = $('.price-main del'), sale = $('.price-main .sale');
    if (prod.original) {
      if (del) { del.textContent = won(prod.original); del.style.display = ''; }
      if (sale) { sale.textContent = Math.round((1 - prod.price / prod.original) * 100) + '%'; sale.style.display = ''; }
    } else {
      if (del) del.style.display = 'none';
      if (sale) sale.style.display = 'none';
    }
    var optLabel = $('.option-block .option-title .muted'); if (optLabel) optLabel.textContent = prod.ko;
  }

  function initDetail() {
    applyProduct();
    var main = $('.main-photo img');
    $$('.thumbs button').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.querySelector('img'); if (t && main) { main.src = t.getAttribute('src'); }
        $$('.thumbs button').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel');
      });
    });
    var selColor = '';
    var optLabel = $('.option-block .option-title .muted');
    $$('.swatch').forEach(function (s) {
      s.addEventListener('click', function () {
        $$('.swatch').forEach(function (x) { x.classList.remove('sel'); }); s.classList.add('sel');
        selColor = s.textContent.trim();
        if (optLabel) optLabel.textContent = selColor;
      });
    });
    var qtyInput = $('.qty input');
    function getQty() { var v = parseInt(qtyInput ? qtyInput.value : '1', 10); if (isNaN(v) || v < 1) { v = 1; if (qtyInput) qtyInput.value = 1; } return v; }
    if (qtyInput) qtyInput.addEventListener('change', getQty);
    var name = (($('.summary h1') || {}).textContent || '상품').trim();
    var price = num((($('.price-main .price') || {}).textContent) || '0');
    var actions = $$('.actions .btn'); /* [0]=구매하기, [1]=장바구니 */
    function buildItem() { return { name: name, price: price, color: selColor || '기본', qty: getQty(), img: main ? main.getAttribute('src') : '' }; }
    if (actions[1]) actions[1].addEventListener('click', function () { addToCart(buildItem()); toast('장바구니에 담았습니다'); });
    if (actions[0]) actions[0].addEventListener('click', function () { addToCart(buildItem()); location.href = 'cart.html'; });
    $$('.tabs a').forEach(function (a) {
      a.addEventListener('click', function () { $$('.tabs a').forEach(function (x) { x.classList.remove('on'); }); a.classList.add('on'); });
    });
  }

  /* cart page */
  function initCart() {
    var root = $('#cart-root'); if (!root) return;
    function render() {
      var cart = getCart();
      var sm = $('#cart-summary');
      if (!cart.length) {
        root.innerHTML = '<div class="cart-empty"><p class="muted" style="font-size:18px">장바구니가 비어 있습니다.</p><p style="margin-top:18px"><a class="btn" href="products.html">쇼핑 계속하기</a></p></div>';
        if (sm) sm.innerHTML = '';
        return;
      }
      var html = '<div class="row headrow"><span>상품</span><span>수량</span><span>합계</span><span></span></div>';
      cart.forEach(function (it, idx) {
        var colorTxt = (it.color && it.color !== '기본' && it.color !== '') ? ' <small class="muted">(' + esc(it.color) + ')</small>' : '';
        html += '<div class="cart-line"><span>' + esc(it.name) + colorTxt + '</span>'
          + '<span class="stepper"><button data-a="dec" data-i="' + idx + '">−</button><span>' + it.qty + '</span><button data-a="inc" data-i="' + idx + '">+</button></span>'
          + '<b>' + won(it.price * it.qty) + '</b>'
          + '<span><button class="rm" data-a="rm" data-i="' + idx + '">삭제</button></span></div>';
      });
      root.innerHTML = html;
      var total = cart.reduce(function (a, i) { return a + i.price * i.qty; }, 0);
      var ship = (total === 0 || total >= 50000) ? 0 : 3000;
      if (sm) sm.innerHTML = '<p class="muted">상품금액 ' + won(total) + ' + 배송비 ' + won(ship) + '</p><a class="btn" href="#" id="checkout-btn">주문하기 · ' + won(total + ship) + '</a>';
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return;
      var i = +b.getAttribute('data-i'), a = b.getAttribute('data-a'); var cart = getCart();
      if (a === 'inc') cart[i].qty++;
      else if (a === 'dec') { cart[i].qty--; if (cart[i].qty < 1) cart.splice(i, 1); }
      else if (a === 'rm') cart.splice(i, 1);
      setCart(cart); render();
    });
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'checkout-btn') {
        e.preventDefault();
        if (!getCart().length) { toast('장바구니가 비어 있습니다'); return; }
        if (!getUser()) { if (confirm('로그인이 필요합니다. 로그인 페이지로 이동할까요?')) location.href = 'login.html'; return; }
        toast('주문이 완료되었습니다. 감사합니다!');
        setCart([]); render();
      }
    });
    render();
  }

  /* login */
  function initLogin() {
    var box = $('.box'); if (!box) return;
    var id = box.querySelector('input[type="text"]'), pw = box.querySelector('input[type="password"]');
    var btn = box.querySelector('button'); if (!btn || !id || !pw) return;
    function submit() {
      var ok = true;
      [id, pw].forEach(function (f) { if (!f.value.trim()) { f.classList.add('field-err'); ok = false; } else f.classList.remove('field-err'); });
      if (!ok) { toast('아이디와 비밀번호를 입력해 주세요'); return; }
      setUser({ id: id.value.trim(), name: id.value.trim() });
      toast(id.value.trim() + '님, 환영합니다!');
      setTimeout(function () { location.href = 'index.html'; }, 700);
    }
    btn.addEventListener('click', submit);
    [id, pw].forEach(function (f) { f.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); }); });
  }

  /* signup */
  function initSignup() {
    var box = $('.box'); if (!box) return;
    var inputs = $$('input', box);
    var btn = box.querySelector('button'); if (!btn) return;
    btn.addEventListener('click', function () {
      var id = inputs[0], name = inputs[1], pw = inputs[2], pw2 = inputs[3], phone = inputs[4], email = inputs[5];
      var agree = box.querySelector('input[type="checkbox"]');
      var ok = true;
      [id, name, pw, pw2, phone, email].forEach(function (f) { if (!f || !f.value.trim()) { if (f) f.classList.add('field-err'); ok = false; } else f.classList.remove('field-err'); });
      if (!ok) { toast('모든 항목을 입력해 주세요'); return; }
      if (pw.value !== pw2.value) { pw2.classList.add('field-err'); toast('비밀번호가 일치하지 않습니다'); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) { email.classList.add('field-err'); toast('이메일 형식을 확인해 주세요'); return; }
      if (agree && !agree.checked) { toast('약관에 동의해 주세요'); return; }
      setUser({ id: id.value.trim(), name: name.value.trim() });
      toast('회원가입이 완료되었습니다!');
      setTimeout(function () { location.href = 'index.html'; }, 800);
    });
  }

  /* shop: pagination + sort */
  function initShop() {
    var list = $('.products'); if (!list) return;
    var items = $$('.products .item');
    var perPage = 6;
    var pager = $('.pager'), sortSel = $('.sortbar select');
    var orig = items.slice(), pg = 1;
    function priceOf(li) { return num(((li.querySelector('.price') || {}).textContent) || '0'); }
    function renderPage() {
      items.forEach(function (li, idx) { li.style.display = (idx >= (pg - 1) * perPage && idx < pg * perPage) ? '' : 'none'; });
      if (pager) $$('.pager a').forEach(function (a, i) { a.classList.toggle('on', i === pg - 1); });
    }
    function applySort() {
      var v = sortSel ? sortSel.value : '', arr = orig.slice();
      if (/낮은가격/.test(v)) arr.sort(function (a, b) { return priceOf(a) - priceOf(b); });
      else if (/신상/.test(v)) arr.reverse();
      arr.forEach(function (li) { list.appendChild(li); });
      items = arr; pg = 1; renderPage();
    }
    if (pager) $$('.pager a').forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); pg = i + 1; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); });
    if (sortSel) sortSel.addEventListener('change', applySort);
    renderPage();
  }

  /* board (notice/qna): expand title on click */
  function initBoard() {
    $$('.board .row').forEach(function (row) {
      var link = row.querySelector('a[href="#"]'); if (!link) return;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var next = row.nextElementSibling;
        if (next && next.classList.contains('row-detail')) { next.remove(); return; }
        $$('.row-detail').forEach(function (n) { n.remove(); });
        var d = document.createElement('div');
        d.className = 'row row-detail'; d.style.background = 'var(--soft,#fbf2ec)';
        d.innerHTML = '<span></span><p class="muted" style="grid-column:2/-1;margin:0;line-height:1.7">' + esc(link.textContent) + ' — 상세 내용은 준비 중입니다. 자세한 사항은 고객센터로 문의해 주세요.</p>';
        row.parentNode.insertBefore(d, row.nextSibling);
      });
    });
  }

  function boot() {
    var p = page();
    initHeader();
    initListing();
    if (p === 'product-detail.html') initDetail();
    else if (p === 'cart.html') initCart();
    else if (p === 'login.html') initLogin();
    else if (p === 'signup.html') initSignup();
    else if (p === 'products.html') initShop();
    else if (p === 'notice.html' || p === 'qna.html') initBoard();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
