(function(){
  // ---------- countdown ----------
  // Counts down to the Weekday Celebration (Wed, Nov 18, 2026, 7:00 PM) —
  // the first of the two real printed events, chronologically. Shabbos
  // Kodesh Parshas Vayeitzei (Sat, Nov 21) follows a few days after.
  var target = new Date('2026-11-18T19:00:00');
  var elD=document.getElementById('cdDays'), elH=document.getElementById('cdHours'),
      elM=document.getElementById('cdMins'), elS=document.getElementById('cdSecs');
  var lastVals = {d:null, h:null, m:null, s:null};
  function pad(n){ return String(n).padStart(2,'0'); }
  // Only the units that actually changed get the little "tick" roll — a
  // digit that hasn't moved shouldn't flicker every second.
  function setUnit(el, key, value){
    var text = pad(value);
    if(lastVals[key] !== null && lastVals[key] !== value){
      el.textContent = text;
      el.classList.remove('tick');
      void el.offsetWidth; // restart the animation
      el.classList.add('tick');
    } else if(lastVals[key] === null){
      el.textContent = text;
    }
    lastVals[key] = value;
  }
  function tick(){
    var diff = target - new Date();
    if(diff < 0) diff = 0;
    var d = Math.floor(diff/86400000);
    var h = Math.floor(diff%86400000/3600000);
    var m = Math.floor(diff%3600000/60000);
    var s = Math.floor(diff%60000/1000);
    setUnit(elD, 'd', d); setUnit(elH, 'h', h);
    setUnit(elM, 'm', m); setUnit(elS, 's', s);
  }
  tick();
  setInterval(tick, 1000);

  // ---------- scroll progress bar ----------
  // A faint always-visible sense of how far through the experience a
  // guest is, without needing a nav bar to explain "you are here."
  var progressFill = document.getElementById('progressFill');
  function onScrollProgress(){
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressFill.style.width = Math.min(Math.max(pct, 0), 100) + '%';
  }
  window.addEventListener('scroll', onScrollProgress, {passive:true});
  window.addEventListener('resize', onScrollProgress);
  onScrollProgress();

  // ---------- hero fade on scroll ----------
  // Fades (and fully hides) well before the invitation stage can appear,
  // so the countdown never visually overlaps the envelope during the
  // handoff between the two sticky-scroll sections.
  var heroInner = document.getElementById('heroInner');
  var hero = document.getElementById('hero');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onScroll(){
    var h = hero.offsetHeight || window.innerHeight;
    var p = Math.min(Math.max(window.scrollY / (h*0.5), 0), 1);
    heroInner.style.opacity = String(1-p);
    heroInner.style.transform = 'translateY(' + (-p*36) + 'px)';
    heroInner.style.visibility = p >= 1 ? 'hidden' : 'visible';
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // ---------- scroll-cue button: an easy way in for anyone unsure they
  // should scroll (or unable to scroll precisely) ----------
  document.getElementById('scrollCueBtn').addEventListener('click', function(){
    document.getElementById('inviteStage').scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  });

  // ---------- envelope appear + open, each once per visit ----------
  // Observing the (viewport-sized) envelope itself, rather than the tall
  // scroll-distance section around it, keeps the intersection ratio
  // meaningful: 0.45 means "about half the envelope is on screen",
  // not "half of a 175vh spacer".
  var envelope = document.getElementById('envelope');
  var envelopeWrap = document.getElementById('envelopeWrap');
  var cardsHint = document.getElementById('cardsHint');
  var continueHint = document.getElementById('continueHint');
  var revealed = false, opened = false;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var ratio = entry.intersectionRatio;
      if(ratio > 0.25 && !revealed){
        revealed = true;
        envelopeWrap.classList.add('is-visible');
      }
      if(ratio > 0.6 && !opened){
        opened = true;
        envelope.classList.add('is-open');
        // Each invitation is drawn out in two beats: '.is-rising' pulls it
        // straight up out of the pocket and holds it square to the viewer,
        // then '.is-out' lets it drift into its fanned resting place. The
        // Shabbos/weekend card completes BOTH beats before the weekday one
        // starts moving, so the two read as one-then-the-other rather than
        // overlapping. Timings track the .95s transform transition on
        // .invite-card — change one and the other has to follow.
        setTimeout(function(){ cardA.classList.add('is-rising'); },  550);
        setTimeout(function(){ cardA.classList.add('is-out');    }, 1600);
        setTimeout(function(){ cardB.classList.add('is-rising'); }, 2600);
        setTimeout(function(){ cardB.classList.add('is-out');    }, 3600);
        // The envelope shell only dissolves once both cards are clear of
        // it — that hand-off is timed in CSS (the 4.6s delays on .env-back
        // / .env-front / .envelope's own glide), not here.
        setTimeout(function(){ cardsHint.classList.add('ready'); }, 5200);
        // A quieter, later cue for a guest who isn't going to tap the
        // cards at all — they should still learn there is more below.
        setTimeout(function(){ continueHint.classList.add('ready'); }, 6600);
      }
      if(revealed && opened) io.disconnect();
    });
    // The inset root keeps the envelope from opening while it is still
    // creeping in at the edge of the screen — it waits until it is
    // properly in view.
  }, {threshold:[0,0.25,0.6,1], rootMargin:'-8% 0px -8% 0px'});
  io.observe(envelopeWrap);

  // ---------- two invitation cards: tap either to bring it forward, and
  // to open it full-screen ----------
  // Both cards fan out of the envelope on their own timers (above); after
  // that, a guest can tap/click or Enter/Space either one both to bring it
  // to the front (like shuffling two physical cards) AND to open it large
  // enough to actually read — the real artwork's printed text (bilingual
  // on the Shabbos card) is genuinely small at the card's on-page size.
  var cardA = document.getElementById('cardA');
  var cardB = document.getElementById('cardB');
  var cards = [cardA, cardB];
  cardA.classList.add('is-front');
  var hoverFine = window.matchMedia('(hover:hover) and (pointer:fine)');

  function bringToFront(card){
    cards.forEach(function(c){ c.classList.toggle('is-front', c === card); });
  }

  // Blur-up: each .card-art starts softly blurred (see .card-art.is-loading
  // in CSS) and resolves the instant it's actually decoded, rather than
  // popping in instantly at whatever moment the browser happens to finish —
  // a small "developing photo" beat that also masks a slow network.
  cards.forEach(function(card){
    var art = card.querySelector('.card-art');
    function clearLoading(){ art.classList.remove('is-loading'); }
    if(art.complete) clearLoading();
    else art.addEventListener('load', clearLoading);

    // The initial reveal (.card-art-reveal, played once via .is-rising) uses
    // fill:both so it holds its resting transform (and opacity) after
    // finishing — which means it keeps overriding this element's inline
    // style forever unless explicitly released. Clearing the animation the
    // moment it ends hands control back to plain CSS/inline styling, which
    // the tilt effect below depends on — but the instant it's cleared, the
    // element would otherwise fall back to ".invite-card > *{opacity:0}"
    // (nothing else pins opacity to 1 once the animation itself is gone),
    // so both have to be set together, in the same tick, or the card
    // visibly vanishes the moment its own reveal finishes.
    art.addEventListener('animationend', function(e){
      if(e.animationName !== 'card-art-reveal') return;
      art.style.animation = 'none';
      art.style.opacity = '1';
      art.style.transform = 'none';
    });

    // ---------- 3D tilt-follow, desktop only ----------
    // A physical card resting on a table catches the light differently as
    // you move around it; this is that, in miniature, on the artwork itself
    // (not the whole .invite-card, whose own transform is busy with the
    // fan/hover/front choreography already).
    // Raw mousemove can fire far faster than the screen can redraw (well
    // over 60/sec on a fast mouse) — every prior version of this handler
    // did a synchronous getBoundingClientRect() + style write on EVERY one
    // of those events, so on a slower device this was doing many times more
    // layout+paint work than a single frame budget actually allows for.
    // rAF-throttling coalesces any burst of events between two paints down
    // to exactly one update, which is the actual visual granularity a
    // person can perceive anyway.
    var tiltPending = null;
    var tiltRAF = null;
    card.addEventListener('mousemove', function(e){
      if(!hoverFine.matches || !card.classList.contains('is-out')) return;
      tiltPending = e;
      if(tiltRAF) return;
      tiltRAF = requestAnimationFrame(function(){
        tiltRAF = null;
        var r = card.getBoundingClientRect();
        var px = (tiltPending.clientX - r.left) / r.width - 0.5;
        var py = (tiltPending.clientY - r.top) / r.height - 0.5;
        art.style.transform = 'perspective(700px) rotateX(' + (py * -9).toFixed(2) + 'deg) rotateY(' + (px * 11).toFixed(2) + 'deg)';
      });
    });
    card.addEventListener('mouseleave', function(){
      if(!hoverFine.matches) return;
      if(tiltRAF){ cancelAnimationFrame(tiltRAF); tiltRAF = null; }
      art.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg)';
    });
  });

  // ---------- small gold sparkle burst on tap ----------
  var reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function burstSparkles(x, y){
    if(reduceMotionMQ.matches) return;
    for(var i = 0; i < 7; i++){
      var s = document.createElement('span');
      s.className = 'sparkle';
      var angle = (Math.PI * 2 / 7) * i + Math.random() * 0.6;
      var dist = 34 + Math.random() * 28;
      s.style.setProperty('--sx', x + 'px');
      s.style.setProperty('--sy', y + 'px');
      s.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(0) + 'px');
      s.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(0) + 'px');
      s.style.animationDelay = (Math.random() * 60) + 'ms';
      document.body.appendChild(s);
      (function(el){ setTimeout(function(){ el.remove(); }, 900); })(s);
    }
  }

  // ---------- tap feedback: spring-bounce + riffle-flip + sparkle + haptic ----------
  // Runs whenever a card is actually TAPPED (not when prev/next/dots quietly
  // switch the zoom lightbox's contents further down).
  function activateCard(card, originX, originY){
    bringToFront(card);
    card.classList.add('is-tapped');
    setTimeout(function(){ card.classList.remove('is-tapped'); }, 650);
    // A one-off Web Animations API flip, deliberately NOT a CSS class-driven
    // animation: .card-art already runs a real CSS animation for its
    // initial reveal (fill:both), and a second one toggled by a class would
    // either lose to it outright or force it to restart from its
    // opacity:0 frame the moment the class comes back off. WAAPI runs
    // alongside without touching animation-name at all, so it can't collide
    // with that animation either way.
    if(!reduceMotionMQ.matches){
      var art = card.querySelector('.card-art');
      if(art.animate){
        art.animate([
          {transform:'rotateY(0deg)'},
          {transform:'rotateY(-16deg)', offset:.4},
          {transform:'rotateY(0deg)'}
        ], {duration:550, easing:'ease-out'});
      }
    }
    burstSparkles(originX, originY);
    if(navigator.vibrate) navigator.vibrate(15);
  }

  var zoomOverlay = document.getElementById('cardZoomOverlay');
  var zoomImg = document.getElementById('cardZoomImg');
  var zoomClose = document.getElementById('cardZoomClose');
  var zoomPrev = document.getElementById('cardZoomPrev');
  var zoomNext = document.getElementById('cardZoomNext');
  var zoomDots = Array.prototype.slice.call(document.querySelectorAll('.zoom-dot'));
  var zoomCalendarLink = document.getElementById('zoomCalendarLink');
  var zoomDirectionsLink = document.getElementById('zoomDirectionsLink');
  var zoomSaveLink = document.getElementById('zoomSaveLink');
  var lastFocusedCard = null;
  var currentZoomCard = null;

  // ---------- pinch-to-zoom + drag-to-pan inside the open lightbox ----------
  var zs = {scale:1, panX:0, panY:0, pinchStartDist:0, pinchStartScale:1,
            isPanning:false, panStartX:0, panStartY:0, lastTapTime:0};
  function zoomDist(t0, t1){
    var dx = t0.clientX - t1.clientX, dy = t0.clientY - t1.clientY;
    return Math.sqrt(dx*dx + dy*dy);
  }
  function applyZoomTransform(){
    zoomImg.style.transform = 'translate(' + zs.panX + 'px,' + zs.panY + 'px) scale(' + zs.scale + ')';
  }
  function resetZoomTransform(){
    zs.scale = 1; zs.panX = 0; zs.panY = 0; zs.isPanning = false;
    zoomImg.classList.remove('is-manual-zoom');
    zoomImg.style.transform = '';
  }
  zoomImg.addEventListener('touchstart', function(e){
    if(e.touches.length === 2){
      zs.pinchStartDist = zoomDist(e.touches[0], e.touches[1]);
      zs.pinchStartScale = zs.scale;
      zoomImg.classList.add('is-manual-zoom');
    } else if(e.touches.length === 1 && zs.scale > 1){
      zs.isPanning = true;
      zs.panStartX = e.touches[0].clientX - zs.panX;
      zs.panStartY = e.touches[0].clientY - zs.panY;
    }
  }, {passive:true});
  zoomImg.addEventListener('touchmove', function(e){
    if(e.touches.length === 2){
      e.preventDefault();
      var scale = zs.pinchStartScale * (zoomDist(e.touches[0], e.touches[1]) / zs.pinchStartDist);
      zs.scale = Math.min(Math.max(scale, 1), 4);
      applyZoomTransform();
    } else if(e.touches.length === 1 && zs.isPanning){
      e.preventDefault();
      zs.panX = e.touches[0].clientX - zs.panStartX;
      zs.panY = e.touches[0].clientY - zs.panStartY;
      applyZoomTransform();
    }
  }, {passive:false});
  zoomImg.addEventListener('touchend', function(e){
    if(e.touches.length > 0) return;
    zs.isPanning = false;
    var now = Date.now();
    if(now - zs.lastTapTime < 300){
      // double-tap: toggle between fitted and a fixed 2.4x zoom
      if(zs.scale > 1){ resetZoomTransform(); }
      else { zs.scale = 2.4; zoomImg.classList.add('is-manual-zoom'); applyZoomTransform(); }
    } else if(zs.scale <= 1.02){
      resetZoomTransform();
    }
    zs.lastTapTime = now;
  });

  function cardKey(card){ return card === cardA ? 'a' : 'b'; }
  function cardForKey(key){ return key === 'a' ? cardA : cardB; }
  function toGCalStamp(iso){ return iso.replace(/[-:]/g, ''); }
  // shared by the zoom lightbox's own action bar AND the RSVP confirmation
  // screen below — both build the exact same two links from the same
  // per-card data-* attributes, so there's one place that knows the URL
  // formats instead of two copies drifting apart.
  function buildCalendarUrl(card){
    var params = 'action=TEMPLATE'
      + '&text=' + encodeURIComponent(card.dataset.eventTitle)
      + '&dates=' + toGCalStamp(card.dataset.eventStart) + '/' + toGCalStamp(card.dataset.eventEnd)
      + '&details=' + encodeURIComponent('Bar Mitzvah of Yehoshua Norowitz. RSVP: rsvp@ynbarmitzvah2026.com')
      + '&location=' + encodeURIComponent(card.dataset.address)
      + '&ctz=America/New_York';
    return 'https://www.google.com/calendar/render?' + params;
  }
  function buildDirectionsUrl(card){
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(card.dataset.address);
  }
  function syncZoomChrome(card){
    var key = cardKey(card);
    zoomDots.forEach(function(dot){ dot.classList.toggle('is-active', dot.dataset.card === key); });
    zoomCalendarLink.href = buildCalendarUrl(card);
    zoomDirectionsLink.href = buildDirectionsUrl(card);
    var art = card.querySelector('.card-art');
    zoomSaveLink.href = art.src;
    zoomSaveLink.download = card.dataset.filename || 'invitation.png';
  }
  // Used by prev/next/dots to switch what the lightbox is showing WITHOUT
  // closing it — quietly keeps the underlying card stack (bringToFront) in
  // sync too, so whichever card was last viewed is still the one on top
  // once the lightbox closes.
  function showZoomCard(card){
    var art = card.querySelector('.card-art');
    zoomImg.src = art.src;
    zoomImg.alt = art.alt;
    resetZoomTransform();
    syncZoomChrome(card);
    currentZoomCard = card;
    bringToFront(card);
  }
  function openZoom(card){
    lastFocusedCard = card;
    showZoomCard(card);
    zoomOverlay.classList.add('is-open');
    zoomOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('zoom-locked'); // stops background scroll while open
    zoomClose.focus();
  }
  function closeZoom(){
    zoomOverlay.classList.remove('is-open');
    zoomOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('zoom-locked');
    resetZoomTransform();
    if(lastFocusedCard) lastFocusedCard.focus();
  }
  zoomClose.addEventListener('click', closeZoom);
  // tapping the dark backdrop closes it too, but not tapping the image
  // itself — a guest zoomed in to read is very likely to tap the card
  // again while reading, which shouldn't dismiss it
  zoomOverlay.addEventListener('click', function(e){
    if(e.target === zoomOverlay) closeZoom();
  });
  document.addEventListener('keydown', function(e){
    if(!zoomOverlay.classList.contains('is-open')) return;
    if(e.key === 'Escape') closeZoom();
    if(e.key === 'ArrowLeft') showZoomCard(currentZoomCard === cardA ? cardB : cardA);
    if(e.key === 'ArrowRight') showZoomCard(currentZoomCard === cardA ? cardB : cardA);
  });
  zoomPrev.addEventListener('click', function(){ showZoomCard(currentZoomCard === cardA ? cardB : cardA); });
  zoomNext.addEventListener('click', function(){ showZoomCard(currentZoomCard === cardA ? cardB : cardA); });
  zoomDots.forEach(function(dot){
    dot.addEventListener('click', function(){ showZoomCard(cardForKey(dot.dataset.card)); });
  });

  cards.forEach(function(card){
    card.addEventListener('click', function(e){
      if(card.dataset.suppressClick){ delete card.dataset.suppressClick; return; }
      activateCard(card, e.clientX, e.clientY);
      openZoom(card);
    });
    card.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        var r = card.getBoundingClientRect();
        activateCard(card, r.left + r.width/2, r.top + r.height/2);
        openZoom(card);
      }
    });
  });

  // ---------- swipe left/right on mobile switches which card is in front ----------
  // (without opening the lightbox — a swipe is "shuffle the deck", a tap is
  // "look closer", the same distinction a guest would make with real cards)
  var cardsPosition = document.getElementById('cardsPosition');
  var touchStart = null;
  cardsPosition.addEventListener('touchstart', function(e){
    if(e.touches.length !== 1) return;
    touchStart = {x:e.touches[0].clientX, y:e.touches[0].clientY, time:Date.now()};
  }, {passive:true});
  cardsPosition.addEventListener('touchend', function(e){
    if(!touchStart) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    touchStart = null;
    if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5){
      var target = dx < 0 ? (cardA.classList.contains('is-front') ? cardB : cardA)
                           : (cardB.classList.contains('is-front') ? cardA : cardB);
      var r = target.getBoundingClientRect();
      activateCard(target, r.left + r.width/2, r.top + r.height/2);
      // most mobile browsers already suppress the synthetic click after a
      // drag-like touch, but this is a explicit belt-and-suspenders guard
      // against the swipe also re-triggering the plain tap-to-zoom handler
      target.dataset.suppressClick = '1';
    }
  });

  // ---------- rsvp section fades in as it's reached ----------
  var rsvpInner = document.getElementById('rsvpInner');
  var rsvpIo = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting && entry.intersectionRatio > 0.2){
        rsvpInner.classList.add('is-visible');
        rsvpIo.disconnect();
      }
    });
  }, {threshold:[0,0.2,1]});
  rsvpIo.observe(rsvpInner);

  // ---------- rsvp pill: jump straight there, skip the invitation animation ----------
  // A guest with the printed invitation shouldn't have to sit through the
  // envelope opening just to RSVP, so this is an instant jump (not smooth) —
  // smooth scrolling would drag the viewport through the envelope section
  // and trigger its reveal/open animation along the way.
  document.getElementById('rsvpPill').addEventListener('click', function(){
    document.getElementById('rsvp').scrollIntoView({behavior: 'auto', block:'start'});
    // straight into the first field, so a guest who came here specifically
    // to RSVP can start typing immediately — but only if the form is the
    // thing actually showing (a returning guest sees the confirmation
    // screen instead, see restorePreviousRsvp below; focusing a field
    // that's position:absolute + hidden behind it would do nothing useful
    // and could itself trigger an unwanted scroll).
    var famField = document.getElementById('fam');
    if(!document.getElementById('rsvpForm').classList.contains('gone')){
      famField.focus({preventScroll: true});
    }
  });

  // ---------- attending toggle shows/hides guest fields ----------
  var attendYes = document.getElementById('attendYes');
  var attendNo = document.getElementById('attendNo');
  var conditional = document.getElementById('conditionalFields');
  function syncAttending(){
    conditional.classList.toggle('collapsed', attendNo.checked);
  }
  attendYes.addEventListener('change', syncAttending);
  attendNo.addEventListener('change', syncAttending);
  syncAttending();

  // ---------- guest-count stepper + dynamic per-guest name inputs ----------
  var countInput = document.getElementById('count');
  var countMinus = document.getElementById('countMinus');
  var countPlus = document.getElementById('countPlus');
  var guestNames = document.getElementById('guestNames');
  var COUNT_MIN = Number(countInput.min) || 1;
  var COUNT_MAX = Number(countInput.max) || 10;

  function clampCount(n){
    n = Math.round(n);
    if(isNaN(n)) n = COUNT_MIN;
    return Math.min(Math.max(n, COUNT_MIN), COUNT_MAX);
  }
  // Regenerates the guest-name inputs to match the current count — rebuilt
  // from scratch each time (simpler than diffing add/remove), but existing
  // values are read out first and reapplied by index so raising, then
  // lowering, the count doesn't lose what someone already typed.
  function syncGuestNameFields(){
    var count = clampCount(Number(countInput.value) || COUNT_MIN);
    var existing = Array.prototype.slice.call(guestNames.querySelectorAll('.guest-name-input'))
      .map(function(inp){ return inp.value; });
    guestNames.innerHTML = '';
    for(var i = 0; i < count; i++){
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'guest-name-input';
      inp.placeholder = 'Guest ' + (i + 1) + ' name';
      inp.autocomplete = 'name';
      if(existing[i]) inp.value = existing[i];
      guestNames.appendChild(inp);
    }
    countMinus.disabled = count <= COUNT_MIN;
    countPlus.disabled = count >= COUNT_MAX;
  }
  function setCount(n){
    countInput.value = clampCount(n);
    syncGuestNameFields();
  }
  countMinus.addEventListener('click', function(){ setCount(Number(countInput.value) - 1); });
  countPlus.addEventListener('click', function(){ setCount(Number(countInput.value) + 1); });
  countInput.addEventListener('change', function(){ setCount(Number(countInput.value)); });
  syncGuestNameFields();

  // ---------- inline field validation ----------
  // Surfaced on blur (and live once a field has already been flagged),
  // not on every keystroke from a clean state — nagging a guest before
  // they've even finished typing their own name is worse than the
  // generic form-level error this used to fall back to alone.
  var famInput = document.getElementById('fam');
  var famField = famInput.closest('.field');
  var famMsg = document.getElementById('famMsg');
  var emailInput = document.getElementById('email');
  var emailField = emailInput.closest('.field');
  var emailMsg = document.getElementById('emailMsg');
  var notesInput = document.getElementById('notes');

  function validateFam(){
    var ok = famInput.value.trim().length > 0;
    famField.classList.toggle('is-invalid', !ok);
    famMsg.textContent = ok ? '' : 'Please let us know who this RSVP is for.';
    return ok;
  }
  function validateEmail(){
    // required now (client asked to make sure every RSVP has a real email
    // on file) — empty fails the same as malformed, not a free pass
    var val = emailInput.value.trim();
    var ok = val !== '' && emailInput.checkValidity();
    emailField.classList.toggle('is-invalid', !ok);
    emailMsg.textContent = ok ? '' : (val === '' ? 'Please enter your email address.' : 'That doesn’t look like a valid email address.');
    return ok;
  }
  famInput.addEventListener('blur', validateFam);
  emailInput.addEventListener('blur', validateEmail);
  famInput.addEventListener('input', function(){ if(famField.classList.contains('is-invalid')) validateFam(); });
  emailInput.addEventListener('input', function(){ if(emailField.classList.contains('is-invalid')) validateEmail(); });

  // ---------- rsvp submit (saved to a Google Sheet) ----------
  var configured = window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL.indexOf('YOUR_') !== 0;
  if(!configured){
    console.warn('Google Apps Script URL is not set yet (js/config.js) — RSVPs will not be saved. See google-apps-script/Code.gs.');
  }

  var form = document.getElementById('rsvpForm');
  var confirm = document.getElementById('rsvpConfirm');
  var submitBtn = document.getElementById('submitBtn');
  var formError = document.getElementById('formError');
  var editRsvpLink = document.getElementById('editRsvpLink');
  var RSVP_STORAGE_KEY = 'norowitz_bar_mitzvah_rsvp_2026';

  // Add to Calendar / Get Directions for BOTH real events, not just
  // whichever card a guest happened to zoom into — a guest confirming
  // here may be going to either or both. Built once from the same
  // per-card data-* attributes the zoom lightbox's own actions use (see
  // buildCalendarUrl/buildDirectionsUrl above), so there's one source of
  // truth for each event's date/time/address.
  document.getElementById('confirmCalendarA').href = buildCalendarUrl(cardA);
  document.getElementById('confirmDirectionsA').href = buildDirectionsUrl(cardA);
  document.getElementById('confirmCalendarB').href = buildCalendarUrl(cardB);
  document.getElementById('confirmDirectionsB').href = buildDirectionsUrl(cardB);

  function collectGuestNames(){
    return Array.prototype.slice.call(guestNames.querySelectorAll('.guest-name-input'))
      .map(function(inp){ return inp.value.trim(); })
      .filter(Boolean)
      .join(', ');
  }
  function gatherPayload(){
    var attending = attendYes.checked;
    return {
      family_name: famInput.value.trim(),
      attending: attending,
      guest_count: attending ? clampCount(Number(countInput.value) || 1) : 0,
      guest_names: attending ? collectGuestNames() : '',
      email: emailInput.value.trim(),
      notes: notesInput.value.trim()
    };
  }
  // Reverse of gatherPayload — used both to restore a guest's own earlier
  // RSVP on return, and by "Edit your RSVP" to bring the form back with
  // what they already answered instead of a blank one.
  function prefillForm(data){
    famInput.value = data.family_name || '';
    attendYes.checked = data.attending !== false;
    attendNo.checked = data.attending === false;
    syncAttending();
    setCount(data.guest_count || 1);
    emailInput.value = data.email || '';
    notesInput.value = data.notes || '';
    var names = (data.guest_names || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    var inputs = guestNames.querySelectorAll('.guest-name-input');
    inputs.forEach(function(inp, i){ if(names[i]) inp.value = names[i]; });
  }

  function showConfirmation(payload){
    form.classList.add('gone');
    setTimeout(function(){
      confirm.classList.add('shown');
      // timed to land right as the checkmark finishes drawing itself in
      // (see .confirm-check's own draw-in keyframes: circle 0.15s-0.85s,
      // check-mark 0.65s-1.1s, relative to .shown being added)
      setTimeout(function(){
        var r = document.querySelector('.confirm-check').getBoundingClientRect();
        burstSparkles(r.left + r.width / 2, r.top + r.height / 2);
      }, 1050);
    }, 250);
    try{ localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(payload)); }catch(e){}
  }
  function showError(message){
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'Submit RSVP';
    formError.textContent = message;
    formError.hidden = false;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    formError.hidden = true;

    var famOk = validateFam();
    var emailOk = validateEmail();
    if(!famOk || !emailOk){
      (famOk ? emailInput : famInput).focus();
      return;
    }

    var payload = gatherPayload();

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Submitting…';

    if(!configured){
      // Not wired to a sheet yet — still let the flow demo cleanly.
      setTimeout(function(){ showConfirmation(payload); }, 400);
      return;
    }

    // text/plain sidesteps a CORS preflight that Apps Script web apps
    // don't handle; the Apps Script side still JSON.parse()s the body.
    fetch(window.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function(res){
      if(!res.ok) throw new Error('Request failed: ' + res.status);
      return res.json();
    }).then(function(data){
      if(data && data.result === 'success'){
        showConfirmation(payload);
      } else {
        showError("Something went wrong sending your RSVP — please try again.");
        console.error(data);
      }
    }).catch(function(err){
      showError("Couldn't reach the server — check your connection and try again.");
      console.error(err);
    });
  });

  editRsvpLink.addEventListener('click', function(){
    confirm.classList.remove('shown');
    form.classList.remove('gone');
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'Submit RSVP';
    famInput.focus();
  });

  // A returning guest sees their own previous answer already filled in
  // and confirmed instead of a blank form every time — "Edit your RSVP"
  // above is what gets them back into it to change anything. Per-browser
  // only (localStorage), not synced across a guest's devices.
  (function restorePreviousRsvp(){
    var saved;
    try{ saved = JSON.parse(localStorage.getItem(RSVP_STORAGE_KEY)); }catch(e){ saved = null; }
    if(!saved) return;
    prefillForm(saved);
    form.classList.add('gone');
    confirm.classList.add('shown');
  })();
})();
