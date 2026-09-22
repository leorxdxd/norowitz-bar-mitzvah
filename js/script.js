(function(){
  // ---------- countdown ----------
  // Counts down to the NEXT of the two real printed events: the Weekday
  // Celebration (Wed, Nov 18, 2026, 7:00 PM) first, then — once that has
  // passed — Shabbos Kodesh Parshas Vayeitzei (Sat, Nov 21, 8:30 AM), which
  // used to be impossible: the countdown had a single target and simply
  // sat at 00:00:00:00 for the three days in between. Once BOTH are over,
  // the numbers give way to a thank-you line instead of a dead clock.
  var targets = [
    {at: new Date('2026-11-18T19:00:00'), caption: ''},
    {at: new Date('2026-11-21T08:30:00'), caption: 'Until Shabbos Kodesh'}
  ];
  var countdownEl = document.querySelector('.countdown');
  var elCaption = document.getElementById('cdCaption');
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
  var countdownTimer = null;
  function tick(){
    var now = new Date();
    var current = null;
    for(var i = 0; i < targets.length; i++){
      if(targets[i].at - now > 0){ current = targets[i]; break; }
    }
    if(!current){
      countdownEl.classList.add('is-past');
      if(countdownTimer) clearInterval(countdownTimer);
      return;
    }
    if(elCaption.textContent !== current.caption) elCaption.textContent = current.caption;
    var diff = current.at - now;
    var d = Math.floor(diff/86400000);
    var h = Math.floor(diff%86400000/3600000);
    var m = Math.floor(diff%3600000/60000);
    var s = Math.floor(diff%60000/1000);
    setUnit(elD, 'd', d); setUnit(elH, 'h', h);
    setUnit(elM, 'm', m); setUnit(elS, 's', s);
  }
  countdownTimer = setInterval(tick, 1000);
  tick();

  // ---------- scroll progress bar + hero fade on scroll ----------
  // A faint always-visible sense of how far through the experience a
  // guest is (progress bar), and fading the hero out (and fully hiding
  // it) well before the invitation stage can appear, so the countdown
  // never visually overlaps the envelope during the handoff between the
  // two sticky-scroll sections.
  // Both used to run directly off the 'scroll' event with no throttling
  // — a native scroll (especially inertial/trackpad scrolling, or touch)
  // can fire this many times faster than the screen can actually repaint,
  // and each firing did a synchronous read (scrollY/offsetHeight) plus
  // multiple style writes. Coalesced through requestAnimationFrame so any
  // burst of scroll events between two paints becomes exactly one update
  // — the same fix already applied to the card tilt-follow's mousemove,
  // and the more likely of the two to have actually been the "laggy"
  // culprit, since this one runs on every single scroll on the page,
  // not just while hovering a settled card.
  var progressFill = document.getElementById('progressFill');
  var heroInner = document.getElementById('heroInner');
  var hero = document.getElementById('hero');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function updateScrollEffects(){
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    // scaleX (compositor-only), not width (forces layout) — see the CSS
    // comment on .progress-fill for why this matters specifically here
    progressFill.style.transform = 'scaleX(' + (Math.min(Math.max(pct, 0), 100) / 100) + ')';

    var h = hero.offsetHeight || window.innerHeight;
    var p = Math.min(Math.max(window.scrollY / (h*0.5), 0), 1);
    heroInner.style.opacity = String(1-p);
    heroInner.style.transform = 'translateY(' + (-p*36) + 'px)';
    heroInner.style.visibility = p >= 1 ? 'hidden' : 'visible';
  }
  var scrollRAF = null;
  function onScrollThrottled(){
    if(scrollRAF) return;
    scrollRAF = requestAnimationFrame(function(){
      scrollRAF = null;
      updateScrollEffects();
    });
  }
  window.addEventListener('scroll', onScrollThrottled, {passive:true});
  window.addEventListener('resize', onScrollThrottled);
  updateScrollEffects();

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
  function openEnvelope(){
    if(opened) return;
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
    // Once the fan has actually finished moving (3600ms + the .95s
    // transform transition), both cards swap to a much shorter transition
    // so hover and cursor-tilt feel attached to the mouse instead of
    // gliding after it a second later. See .invite-card.is-settled.
    setTimeout(function(){
      cards.forEach(function(c){ c.classList.add('is-settled'); });
    }, 4700);
    // The envelope shell only dissolves once both cards are clear of
    // it — that hand-off is timed in CSS (the 4.6s delays on .env-back
    // / .env-front / .envelope's own glide), not here.
    setTimeout(function(){ cardsHint.classList.add('ready'); }, 5200);
    // A quieter, later cue for a guest who isn't going to tap the
    // cards at all — they should still learn there is more below.
    setTimeout(function(){ continueHint.classList.add('ready'); }, 6600);
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var ratio = entry.intersectionRatio;
      if(ratio > 0.25 && !revealed){
        revealed = true;
        envelopeWrap.classList.add('is-visible');
        // This USED to also open the envelope once ratio crossed a second,
        // higher threshold (0.6, later tried raising to 0.85) — measured
        // the real intersection-ratio curve via a diagnostic observer and
        // found that doesn't work: `.stage-inner` is `position:sticky`,
        // so ratio jumps from ~0 to ~1 almost immediately once the sticky
        // phase engages and then holds flat at ~1 for a long stretch —
        // it's a near step-function, not a gradual ramp. That means ANY
        // ratio threshold in that range fires at essentially the same
        // early instant, so raising 0.6 to 0.85 changed nothing in
        // practice — confirmed by measurement, not assumption, after the
        // user reported the sealed envelope (with the fold-seam lines
        // that make it read as an envelope rather than a plain square)
        // still wasn't actually being seen. A fixed real-time delay after
        // "revealed" is what actually guarantees on-screen time here,
        // since the sticky pin holds the visual still on screen for far
        // longer than this delay regardless of how fast the scroll
        // gesture itself was.
        setTimeout(openEnvelope, 1800);
        io.disconnect();
      }
    });
    // The inset root keeps the envelope from opening while it is still
    // creeping in at the edge of the screen — it waits until it is
    // properly in view.
  }, {threshold:[0,0.25,1], rootMargin:'-8% 0px -8% 0px'});
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

    // The reveal bend (card-art-reveal, played once via .is-rising) uses
    // fill:both so it holds its final transform after finishing, which
    // keeps overriding anything else that wants to set transform on this
    // element. Clearing the animation the moment it ends hands control
    // back to plain CSS. (Nothing sets .card-art's opacity anymore — it is
    // opaque from the start, because the card is hidden by the pocket in
    // front of it, not by being transparent.)
    art.addEventListener('animationend', function(e){
      if(e.animationName !== 'card-art-reveal') return;
      art.style.animation = 'none';
      art.style.transform = 'none';
    });

    // ---------- cursor-driven tilt, mouse devices only ----------
    // This used to rotate .card-art — the artwork — while the card's mat,
    // bezel, cut edge and cast shadow all stayed put. That is a photograph
    // swivelling inside a fixed frame, and it is the single biggest reason
    // this never read as a physical object: the parts of the "card"
    // visibly disagreed about where they were in space.
    // Now it writes two plain numbers onto the CARD, and CSS composes
    // everything that should react to them — the card's own rotation, the
    // slab of cut edge behind it (.card-stock) and the specular hotspot on
    // its face (.card-sheen). One source of truth, so the layers cannot
    // disagree, and every one of them resolves to a transform, so the
    // whole thing stays on the compositor.
    // Raw mousemove can fire far faster than the screen can redraw (well
    // over 60/sec on a fast mouse). rAF-throttling coalesces any burst of
    // events between two paints down to exactly one update, which is the
    // actual visual granularity a person can perceive anyway.
    var tiltPending = null;
    var tiltRAF = null;
    function setTilt(x, y){
      card.style.setProperty('--tx', x.toFixed(3));
      card.style.setProperty('--ty', y.toFixed(3));
    }
    card.addEventListener('mousemove', function(e){
      if(!hoverFine.matches || reduceMotionMQ.matches) return;
      if(!card.classList.contains('is-out')) return;
      tiltPending = e;
      if(tiltRAF) return;
      tiltRAF = requestAnimationFrame(function(){
        tiltRAF = null;
        var r = card.getBoundingClientRect();
        setTilt(
          (tiltPending.clientX - r.left) / r.width - 0.5,
          (tiltPending.clientY - r.top) / r.height - 0.5
        );
      });
    });
    // returning to rest is a transition, not a jump: dropping both values
    // back to 0 lets .is-settled's own .17s ease carry the card, its edge
    // and its highlight back to square together
    card.addEventListener('mouseleave', function(){
      if(tiltRAF){ cancelAnimationFrame(tiltRAF); tiltRAF = null; }
      setTilt(0, 0);
    });
    card.tiltTo = setTilt;
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

  // ---------- tap feedback: spring-bounce + rock + sparkle + haptic ----------
  // Runs whenever a card is actually TAPPED (not when prev/next/dots quietly
  // switch the zoom lightbox's contents further down).
  function activateCard(card, originX, originY){
    bringToFront(card);
    card.classList.add('is-tapped');
    setTimeout(function(){ card.classList.remove('is-tapped'); }, 650);
    // The card rocks briefly toward the side it was touched on and settles
    // back. This replaces a riffle-flip that used to spin .card-art alone —
    // which, now that the card moves as one rigid object, would have been
    // the artwork peeling off the card it is printed on. Driving the same
    // --tx the cursor uses means the rock also swings the cut edge and the
    // highlight, so the whole card responds, and the settled .17s ease
    // carries it back with no extra animation to collide with.
    if(!reduceMotionMQ.matches && card.tiltTo){
      var r = card.getBoundingClientRect();
      var side = originX < r.left + r.width / 2 ? -1 : 1;
      card.tiltTo(side * 0.3, -0.18);
      setTimeout(function(){
        if(!card.matches(':hover')) card.tiltTo(0, 0);
      }, 300);
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
  var confirmTitle = document.getElementById('confirmTitle');
  var confirmSub = document.getElementById('confirmSub');
  var confirmEvents = document.getElementById('confirmEvents');
  var RSVP_STORAGE_KEY = 'norowitz_bar_mitzvah_rsvp_2026';

  // The notes box grows with what's typed instead of showing a browser
  // resize grip. Measured from scrollHeight after collapsing to auto, so
  // it also shrinks back when text is deleted.
  function fitNotes(){
    notesInput.style.height = 'auto';
    notesInput.style.height = notesInput.scrollHeight + 'px';
  }
  notesInput.addEventListener('input', fitNotes);

  // The thank-you screen speaks to the answer that was actually given. It
  // used to say "We look forward to celebrating together." to everyone —
  // including a guest who had just declined — and offered that guest
  // Add-to-Calendar and Directions buttons for events they aren't coming to.
  function personaliseConfirmation(data){
    var name = (data.family_name || '').trim();
    // "Thank you," on its own line, the family's name on the next — left to
    // wrap by itself it broke as "Thank you, The / Friedman Family."
    confirmTitle.textContent = name ? 'Thank you,' : 'Thank you.';
    if(name){
      confirmTitle.appendChild(document.createElement('br'));
      confirmTitle.appendChild(document.createTextNode(name + '.'));
    }
    var lines;
    if(data.attending === false){
      lines = ["We're sorry you can't be with us,", 'and so grateful you let us know.'];
      confirmEvents.hidden = true;
    } else {
      var n = Number(data.guest_count) || 1;
      lines = [n > 1 ? "We've saved " + n + ' places for you.' : "We've saved your place.",
               'We look forward to celebrating together.'];
      confirmEvents.hidden = false;
    }
    // one sentence per line, set as text nodes (never innerHTML — the
    // family name above is guest-typed and this keeps everything as text)
    confirmSub.textContent = '';
    confirmSub.appendChild(document.createTextNode(lines[0]));
    confirmSub.appendChild(document.createElement('br'));
    confirmSub.appendChild(document.createTextNode(lines[1]));
  }

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
    fitNotes();
    var names = (data.guest_names || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    var inputs = guestNames.querySelectorAll('.guest-name-input');
    inputs.forEach(function(inp, i){ if(names[i]) inp.value = names[i]; });
  }

  function showConfirmation(payload){
    personaliseConfirmation(payload);
    rsvpInner.classList.add('is-confirmed');
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
    rsvpInner.classList.remove('is-confirmed');
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
    personaliseConfirmation(saved);
    rsvpInner.classList.add('is-confirmed');
    form.classList.add('gone');
    confirm.classList.add('shown');
  })();
})();
