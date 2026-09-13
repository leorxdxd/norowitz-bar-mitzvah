(function(){
  // ---------- countdown ----------
  var target = new Date('2026-11-07T18:00:00');
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
    heroInner.style.filter = reduceMotion ? 'none' : 'blur(' + (p*6) + 'px)';
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
  var flipHint = document.getElementById('flipHint');
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
        // Waits for the card-position entrance transform (translate+scale,
        // ~1.35s total) to finish before StPageFlip measures the mount.
        setTimeout(initPageFlip, 1400);
        setTimeout(function(){ flipHint.classList.add('ready'); }, 2000);
        // A quieter, later cue for a guest who isn't going to flip the
        // card at all — they should still learn there is more below.
        setTimeout(function(){ continueHint.classList.add('ready'); }, 4200);
      }
      if(revealed && opened) io.disconnect();
    });
    // The inset root keeps the envelope from opening while it is still
    // creeping in at the edge of the screen — it waits until it is
    // properly in view.
  }, {threshold:[0,0.25,0.6,1], rootMargin:'-8% 0px -8% 0px'});
  io.observe(envelopeWrap);

  // ---------- card flip: a real paper curl, via the StPageFlip library ----------
  // Initialized lazily, once the envelope has fully opened and the card's
  // own entrance transform has settled — StPageFlip reads the mount
  // element's rendered size at init time (`size:'stretch'`), and initing
  // mid-transition (while card-position is still scaling in) would lock
  // it to a too-small size.
  var bookMount = document.getElementById('bookMount');
  var pageFlipInstance = null;

  function initPageFlip(){
    if(pageFlipInstance) return;
    if(!window.St){
      // CDN may still be loading — give it one more chance, then fall
      // back to a static front page rather than staying invisible.
      setTimeout(function(){
        if(window.St) initPageFlip();
        else bookMount.classList.add('is-fallback');
      }, 1200);
      return;
    }
    pageFlipInstance = new St.PageFlip(bookMount, {
      width: 300,
      height: 414,
      size: 'stretch',
      minWidth: 200,
      maxWidth: 460,
      minHeight: 276,
      maxHeight: 635,
      maxShadowOpacity: 0.4,
      flippingTime: 900,
      showCover: false,
      usePortrait: true
    });
    pageFlipInstance.loadFromHTML(bookMount.querySelectorAll('.my-page'));
    pageFlipInstance.on('flip', function(e){
      bookMount.classList.toggle('is-back', e.data === 1);
      flipHint.classList.add('hidden');
    });
    bookMount.classList.add('is-ready');
  }

  bookMount.addEventListener('keydown', function(e){
    if(!pageFlipInstance) return;
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      var onBack = bookMount.classList.contains('is-back');
      onBack ? pageFlipInstance.flipPrev() : pageFlipInstance.flipNext();
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

  // ---------- rsvp submit (saved to a Google Sheet) ----------
  var configured = window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL.indexOf('YOUR_') !== 0;
  if(!configured){
    console.warn('Google Apps Script URL is not set yet (js/config.js) — RSVPs will not be saved. See google-apps-script/Code.gs.');
  }

  var form = document.getElementById('rsvpForm');
  var confirm = document.getElementById('rsvpConfirm');
  var submitBtn = document.getElementById('submitBtn');
  var formError = document.getElementById('formError');

  form.addEventListener('submit', function(e){
    e.preventDefault();
    formError.hidden = true;

    var attending = attendYes.checked;
    var payload = {
      family_name: document.getElementById('fam').value.trim(),
      attending: attending,
      guest_count: attending ? Number(document.getElementById('count').value) || 1 : 0,
      guest_names: attending ? document.getElementById('names').value.trim() : '',
      email: document.getElementById('email').value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Submitting…';

    function showConfirmation(){
      form.classList.add('gone');
      setTimeout(function(){ confirm.classList.add('shown'); }, 250);
    }
    function showError(message){
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Submit RSVP';
      formError.textContent = message;
      formError.hidden = false;
    }

    if(!configured){
      // Not wired to a sheet yet — still let the flow demo cleanly.
      setTimeout(showConfirmation, 400);
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
        showConfirmation();
      } else {
        showError("Something went wrong sending your RSVP — please try again.");
        console.error(data);
      }
    }).catch(function(err){
      showError("Couldn't reach the server — check your connection and try again.");
      console.error(err);
    });
  });
})();
