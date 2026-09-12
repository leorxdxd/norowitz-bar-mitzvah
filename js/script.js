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

  // ---------- envelope appear + open, each once per visit ----------
  // Observing the (viewport-sized) envelope itself, rather than the tall
  // scroll-distance section around it, keeps the intersection ratio
  // meaningful: 0.45 means "about half the envelope is on screen",
  // not "half of a 175vh spacer".
  var envelope = document.getElementById('envelope');
  var envelopeWrap = document.getElementById('envelopeWrap');
  var flipHint = document.getElementById('flipHint');
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
        setTimeout(function(){ flipHint.classList.add('ready'); }, 2000);
      }
      if(revealed && opened) io.disconnect();
    });
    // The inset root keeps the envelope from opening while it is still
    // creeping in at the edge of the screen — it waits until it is
    // properly in view.
  }, {threshold:[0,0.25,0.6,1], rootMargin:'-8% 0px -8% 0px'});
  io.observe(envelopeWrap);

  // ---------- card flip ----------
  var card = document.getElementById('card');
  function flip(){
    card.classList.toggle('flipped');
    flipHint.classList.add('hidden');
  }
  card.addEventListener('click', flip);
  card.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); }
  });

  // ---------- gentle desktop tilt toward the pointer ----------
  var cardTilt = document.getElementById('cardTilt');
  if(window.matchMedia('(pointer:fine)').matches && !reduceMotion){
    envelopeWrap.addEventListener('mousemove', function(e){
      var r = envelopeWrap.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      cardTilt.style.setProperty('--tiltX', (py * -7) + 'deg');
      cardTilt.style.setProperty('--tiltY', (px * 9) + 'deg');
    });
    envelopeWrap.addEventListener('mouseleave', function(){
      cardTilt.style.setProperty('--tiltX', '0deg');
      cardTilt.style.setProperty('--tiltY', '0deg');
    });
  }

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
