/* Holiday Family Feud — game logic. No build step, no backend. */
(function () {
  'use strict';

  var KEY = 'holiday-feud-v2';
  var CATS = ['Job site and trade life', 'Office life', 'Holiday themed', 'Just for fun'];

  // [category index, question, in the survey/game by default (1 = yes)]
  var BANK = [
    [0, 'Name something an electrician always has in their truck.', 1],
    [0, 'Name the most annoying thing a GC or another trade does on a job site.', 1],
    [0, 'Name an excuse for showing up late to the job.', 1],
    [0, 'Name something you’d find in a foreman’s pocket.', 0],
    [0, 'Name the worst place on a job site to run conduit or pull wire.', 0],
    [0, 'Name a tool that always seems to go missing.', 1],
    [0, 'Name something that gets said on every jobsite walk.', 0],
    [0, 'Name the first thing you do when you get to the job in the morning.', 0],
    [0, 'Name something that always goes wrong on a Monday.', 0],
    [0, 'Name something you’d find in the bottom of a tool bag.', 0],
    [0, 'Name a reason a job gets delayed.', 0],
    [0, 'Name a snack or drink you’d find on a job site.', 0],
    [0, 'Name something an inspector always seems to catch.', 0],
    [1, 'Name something people complain about in the office.', 1],
    [1, 'Name the most popular lunch spot or lunch order around here.', 1],
    [1, 'Name a phrase you hear on the phone with customers or GCs.', 0],
    [1, 'Name something that’s always running low in the office.', 1],
    [1, 'Name a reason someone stops by the office unannounced.', 0],
    [1, 'Name something that causes a traffic jam at the copier or printer.', 0],
    [1, 'Name the most common reason someone calls the office.', 0],
    [1, 'Name something you’d find in the office fridge that’s been there too long.', 0],
    [2, 'Name the worst Christmas gift you’ve ever received.', 1],
    [2, 'Name something you’d find at a company Christmas party.', 1],
    [2, 'Name a Christmas movie everyone has seen.', 1],
    [2, 'Name something people do the day after Christmas.', 0],
    [2, 'Name a holiday food you can’t stand.', 0],
    [2, 'Name something Santa would need an electrician for.', 1],
    [2, 'Name the first thing you’d do if you won the Christmas raffle.', 0],
    [2, 'Name a holiday decoration that uses a lot of electricity.', 0],
    [2, 'Name something that always goes wrong with Christmas lights.', 0],
    [2, 'Name a Christmas song you’re sick of hearing.', 0],
    [2, 'Name something people hide from their family over the holidays (like gifts, or how much they spent).', 0],
    [3, 'Name something you’d do with a surprise day off.', 1],
    [3, 'Name a reason you’d call in “sick.”', 0],
    [3, 'Name something you’d never say to your boss.', 0],
    [3, 'Name a job you’d want if you weren’t in the electrical trade.', 0]
  ];

  // Sample answers on question 1 so the board looks alive before the survey is tallied.
  var SAMPLE = [['Wire nuts', 32], ['Electrical tape', 24], ['Ladder', 15], ['Coffee', 10], ['Wire strippers', 8], ['Meter', 6]];

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- State ---------------- */
  function blankFm() {
    return { q: [null, null, null, null, null], pick: [[-1, -1, -1, -1, -1], [-1, -1, -1, -1, -1]] };
  }
  function fresh() {
    return {
      v: 2,
      teams: [{ name: 'Team Red', score: 0 }, { name: 'Team Green', score: 0 }],
      cur: 0,
      mute: false,
      questions: BANK.map(function (b, i) {
        return {
          id: 'q' + (i + 1), cat: CATS[b[0]], q: b[1], use: !!b[2],
          a: i === 0 ? SAMPLE.map(function (r) { return { t: r[0], p: r[1] }; }) : []
        };
      }),
      fm: blankFm()
    };
  }
  function normalize(d) {
    if (!d || !Array.isArray(d.questions) || !d.questions.length) return null;
    var f = fresh();
    var out = {
      v: 2,
      teams: [0, 1].map(function (i) {
        var t = d.teams && d.teams[i];
        return {
          name: String((t && t.name) || f.teams[i].name),
          score: Math.max(0, Math.round(+(t && t.score) || 0))
        };
      }),
      cur: Math.max(0, +d.cur || 0),
      mute: !!d.mute,
      questions: [],
      fm: blankFm()
    };
    var seen = {};
    d.questions.forEach(function (q, i) {
      if (!q || typeof q !== 'object') return;
      var id = String(q.id || ('q' + (i + 1)));
      while (seen[id]) id += 'x';
      seen[id] = true;
      out.questions.push({
        id: id,
        cat: String(q.cat || 'Custom'),
        q: String(q.q || ''),
        use: q.use !== false,
        a: (Array.isArray(q.a) ? q.a : []).slice(0, 8).map(function (r) {
          return { t: String((r && r.t) || ''), p: Math.max(0, Math.round(+(r && r.p) || 0)) };
        })
      });
    });
    if (!out.questions.length) return null;
    if (d.fm && Array.isArray(d.fm.q) && Array.isArray(d.fm.pick)) {
      out.fm.q = [0, 1, 2, 3, 4].map(function (i) { return d.fm.q[i] || null; });
      out.fm.pick = [0, 1].map(function (p) {
        return [0, 1, 2, 3, 4].map(function (i) {
          var v = (d.fm.pick[p] || [])[i];
          return Number.isInteger(v) ? v : -1;
        });
      });
    }
    return out;
  }
  var S = null;
  try { S = normalize(JSON.parse(localStorage.getItem(KEY))); } catch (e) { S = null; }
  if (!S) S = fresh();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }

  function deck() { return S.questions.filter(function (q) { return q.use; }); }
  function curQ() { return deck()[S.cur] || null; }
  function sorted(q) {
    if (!q) return [];
    return q.a.filter(function (x) { return x.t && x.t.trim(); })
      .slice().sort(function (x, y) { return (+y.p || 0) - (+x.p || 0); }).slice(0, 8);
  }
  if (S.cur >= deck().length) S.cur = 0;

  /* ---------------- Round state (not saved) ---------------- */
  var R;
  function newRound() {
    R = { revealed: new Set(), shown: new Set(), strikes: 0, stealFailed: false, awarded: false, awardedPot: 0, control: null };
  }
  newRound();
  function mult() { return +$('mult').value || 1; }
  function base() {
    var a = sorted(curQ()), s = 0;
    R.revealed.forEach(function (i) { if (a[i]) s += (+a[i].p || 0); });
    return s;
  }
  function pot() { return R.awarded ? R.awardedPot : base() * mult(); }

  /* ---------------- Sound ---------------- */
  var ac;
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, start, dur, type, vol) {
    if (S.mute) return;
    var c = ctx(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  }
  var PENT = [784, 880, 988, 1175, 1319, 1568, 1760, 1976];
  function ding(n) { var f = PENT[Math.min(n, 7)]; tone(f, 0, 0.35, 'sine', 0.22); tone(f * 1.5, 0.1, 0.45, 'sine', 0.14); }
  function buzz() { tone(120, 0, 0.7, 'sawtooth', 0.16); tone(126, 0, 0.7, 'square', 0.07); }
  function fanfare() { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, i * 0.09, 0.35, 'triangle', 0.18); }); }
  function tick() { tone(1000, 0, 0.05, 'square', 0.06); }
  function jingle() {
    [[659, 0], [659, 0.2], [659, 0.4, 0.35], [659, 0.85], [659, 1.05], [659, 1.25, 0.35],
     [659, 1.7], [784, 1.9], [523, 2.1], [587, 2.3], [659, 2.5, 0.5]].forEach(function (n) {
      tone(n[0], n[1], n[2] || 0.18, 'triangle', 0.16);
    });
  }

  /* ---------------- Little effects ---------------- */
  var toastT;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function confetti(cols, n, parent) {
    if (reduce) return;
    var box = el('div', 'confetti'); box.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < n; i++) {
      var p = el('i');
      p.style.cssText = 'left:' + (Math.random() * 100) + '%;background:' + cols[i % cols.length] +
        ';animation-duration:' + (2.2 + Math.random() * 2.2) + 's;animation-delay:' + (Math.random() * 0.6) + 's';
      box.appendChild(p);
    }
    (parent || document.body).appendChild(box);
    setTimeout(function () { box.remove(); }, 5500);
  }
  var RED_CONF = ['#C8102E', '#FFFFFF', '#F5B82E', '#2E9B4F'];
  var GRN_CONF = ['#2E9B4F', '#FFFFFF', '#F5B82E', '#C8102E'];
  var partyT;
  function lightsParty() {
    var l = $('lights'); l.classList.add('party');
    clearTimeout(partyT); partyT = setTimeout(function () { l.classList.remove('party'); }, 3500);
  }
  function snow(box, n) {
    var chars = ['❄', '❅', '❆'], cols = ['#8FC7EE', '#B5DDF7', '#6FB4E6', '#A9D6F5'];
    for (var i = 0; i < n; i++) {
      var f = el('span', 'flake');
      f.style.cssText = 'left:' + (Math.random() * 92) + '%;font-size:' + (10 + Math.random() * 18) + 'px;--c:' + cols[i % cols.length] +
        ';animation-duration:' + (8 + Math.random() * 10) + 's;animation-delay:' + (-Math.random() * 18) + 's;opacity:' + (0.6 + Math.random() * 0.4);
      var s = el('i', '', chars[i % 3]);
      s.style.animationDuration = (2 + Math.random() * 3) + 's';
      s.style.animationDelay = (-Math.random() * 4) + 's';
      f.appendChild(s); box.appendChild(f);
    }
  }
  function buildLights() {
    var cols = ['#E5202E', '#F5B82E', '#2E9B4F', '#3A8DDE'];
    document.querySelectorAll('.lights').forEach(function (box) {
      var n = Math.max(8, Math.round(window.innerWidth / 34));
      box.innerHTML = '';
      for (var i = 0; i < n; i++) {
        var b = el('i');
        b.style.setProperty('--c', cols[i % 4]);
        b.style.animationDelay = ((i % 4) * 0.5) + 's';
        box.appendChild(b);
      }
    });
  }
  function buildTreeBulbs() {
    var g = $('treeBulbs'), NS = 'http://www.w3.org/2000/svg';
    [[236, 190, '#E5202E'], [258, 186, '#FFC933'], [278, 190, '#3A8DDE'], [240, 154, '#FFC933'], [268, 156, '#E5202E'],
     [254, 140, '#3A8DDE'], [246, 122, '#E5202E'], [264, 118, '#FFC933'], [255, 102, '#FFFFFF']].forEach(function (b, i) {
      var h = document.createElementNS(NS, 'circle');
      h.setAttribute('class', 'halo'); h.setAttribute('cx', b[0]); h.setAttribute('cy', b[1]); h.setAttribute('r', 10);
      h.style.setProperty('--c', b[2]); h.style.animationDelay = (i * 0.05) + 's';
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'bulb'); c.setAttribute('cx', b[0]); c.setAttribute('cy', b[1]); c.setAttribute('r', 4.6);
      c.style.setProperty('--c', b[2]); c.style.animationDelay = (i * 0.05) + 's';
      g.appendChild(h); g.appendChild(c);
    });
  }

  /* ---------------- Rendering ---------------- */
  var shown = [null, null];
  function setScore(i, v) {
    var e = $('t' + i + 's');
    if (shown[i] === null || shown[i] === v || reduce) { e.textContent = v; shown[i] = v; return; }
    var from = shown[i], t0 = performance.now(), dur = 900;
    shown[i] = v;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      e.textContent = Math.round(from + (v - from) * k);
      if (k < 1) requestAnimationFrame(step); else e.textContent = v;
    })(t0);
  }
  function renderScores() {
    var p = pot(), q = curQ(), has = q && sorted(q).length;
    for (var i = 0; i < 2; i++) {
      $('t' + i + 'n').textContent = S.teams[i].name;
      setScore(i, S.teams[i].score);
      $('aw' + i).textContent = 'Award to ' + S.teams[i].name;
      $('aw' + i).disabled = R.awarded || p === 0;
      $('c' + i).textContent = S.teams[i].name;
      $('c' + i).className = R.control === i ? 'on' : '';
      $('c' + i).setAttribute('aria-pressed', R.control === i ? 'true' : 'false');
      $('t' + i).classList.toggle('has-control', R.control === i);
    }
    $('pot').textContent = p;
    $('multBadge').textContent = mult() > 1 ? '×' + mult() : '';
    $('mult').disabled = R.awarded;
    $('strikeBtn').disabled = !has || R.awarded;
    $('undoStrike').disabled = !(R.strikes > 0 || R.stealFailed);
    $('revealAll').disabled = !has;
  }
  function renderStrikes() {
    var s = $('strikes'); s.innerHTML = '';
    for (var i = 0; i < 3; i++) s.appendChild(el('span', 'sslot' + (i < R.strikes ? ' on' : ''), '✕'));
    s.setAttribute('aria-label', R.strikes + ' strikes');
  }
  function renderStatus() {
    var q = curQ(), ans = sorted(q), msg = '', cls = '';
    function nm(i) { return S.teams[i].name; }
    if (!q) { msg = 'Open Set up questions and tick the questions you want in tonight’s game.'; cls = 'warn'; }
    else if (!ans.length) { msg = 'This question has no answers yet. Open Set up questions to enter your survey results.'; cls = 'warn'; }
    else if (R.awarded) { msg = 'Points awarded! Hit Next question when you’re ready.'; cls = 'good'; }
    else if (R.revealed.size === ans.length) { msg = 'Board cleared! Award the points to the winning team.'; cls = 'good'; }
    else if (R.strikes >= 3 && R.control !== null) {
      var o = 1 - R.control;
      msg = R.stealFailed
        ? 'Steal missed! ' + nm(R.control) + ' keeps the points. Award the round to ' + nm(R.control) + '.'
        : 'Three strikes! ' + nm(o) + ' gets one chance to steal. A right answer wins ' + nm(o) + ' the points; a miss lets ' + nm(R.control) + ' keep them.';
      cls = 'warn';
    }
    else if (R.strikes >= 3) { msg = 'Three strikes! Pick which team was in control so the other team can steal.'; cls = 'warn'; }
    else if (R.control === null) { msg = 'Face-off! Whoever rings in first goes first. Pick the team in control.'; }
    else { msg = nm(R.control) + ' is in control. Click an answer to reveal it, or press Strike for a miss.'; }
    $('status').textContent = msg;
    $('status').className = 'status ' + cls;
  }
  function renderBoard() {
    var q = curQ(), ans = sorted(q), grid = $('grid'), n = deck().length;
    $('question').textContent = q ? (q.q || 'Untitled question') : 'No questions in the game yet';
    $('qcat').textContent = q ? q.cat : '';
    $('qnum').textContent = n ? 'Question ' + (S.cur + 1) + ' of ' + n : '';
    grid.innerHTML = '';
    if (!ans.length) {
      grid.appendChild(el('div', 'empty-note', q
        ? 'No answers yet. Open Set up questions and enter your survey results.'
        : 'Open Set up questions and tick the questions you want in the game.'));
      renderStrikes();
      return;
    }
    grid.style.setProperty('--rows', Math.ceil(ans.length / 2));
    ans.forEach(function (a, i) {
      var tile = el('div', 'tile' + (R.shown.has(i) ? ' on' : '') + (R.shown.has(i) && !R.revealed.has(i) ? ' missed' : ''));
      tile.innerHTML = '<div class="face"><div class="side front"><span class="slot"></span></div>' +
        '<div class="side back"><span class="ans"></span><span class="pts"></span></div></div><button class="hit"></button>';
      tile.querySelector('.slot').textContent = i + 1;
      tile.querySelector('.ans').textContent = a.t;
      tile.querySelector('.pts').textContent = +a.p || 0;
      var hit = tile.querySelector('.hit');
      hit.setAttribute('aria-label', R.shown.has(i) ? 'Answer ' + (i + 1) + ': ' + a.t + ', ' + (+a.p || 0) + ' points' : 'Reveal answer ' + (i + 1));
      hit.addEventListener('click', function () { reveal(i); });
      grid.appendChild(tile);
    });
    renderStrikes();
  }
  function renderJump() {
    var d = deck(), j = $('jump');
    j.innerHTML = '';
    d.forEach(function (q, i) { j.appendChild(new Option((i + 1) + '. ' + trunc(q.q, 48), String(i))); });
    j.value = String(S.cur);
    j.disabled = !d.length;
    $('prev').disabled = S.cur <= 0;
    $('next').disabled = S.cur >= d.length - 1;
    $('deckCount').textContent = d.length + ' question' + (d.length === 1 ? '' : 's') + ' in tonight’s game.';
  }
  function renderAll() { renderBoard(); renderScores(); renderStatus(); renderJump(); }

  /* ---------------- Game actions ---------------- */
  function reveal(i) {
    var a = sorted(curQ())[i];
    if (!a || R.shown.has(i) || R.awarded) return;
    R.revealed.add(i); R.shown.add(i);
    ding(R.revealed.size - 1);
    var tile = $('grid').children[i];
    if (tile) {
      tile.classList.add('on');
      tile.querySelector('.hit').setAttribute('aria-label', 'Answer ' + (i + 1) + ': ' + a.t + ', ' + (+a.p || 0) + ' points');
    }
    renderScores(); renderStatus();
  }
  var xTimer;
  function showBigX(n) {
    var bx = $('bigx'); bx.innerHTML = '';
    for (var i = 0; i < n; i++) bx.appendChild(el('span', '', '✕'));
    bx.classList.add('show');
    clearTimeout(xTimer); xTimer = setTimeout(function () { bx.classList.remove('show'); }, 1100);
  }
  function strike() {
    var q = curQ();
    if (!q || !sorted(q).length || R.awarded) return;
    var wasFull = R.strikes >= 3;
    if (wasFull) R.stealFailed = true; else R.strikes++;
    buzz();
    showBigX(wasFull ? 1 : R.strikes);
    renderStrikes(); renderScores(); renderStatus();
  }
  function undoStrike() {
    if (R.stealFailed) R.stealFailed = false;
    else if (R.strikes > 0) R.strikes--;
    renderStrikes(); renderScores(); renderStatus();
  }
  function setControl(c) {
    R.control = R.control === c ? null : c;
    renderScores(); renderStatus();
  }
  function awardTo(t) {
    var p = pot();
    if (R.awarded || !p) return;
    R.awardedPot = p; R.awarded = true;
    S.teams[t].score += p; save();
    fanfare(); lightsParty();
    toast('🎁 +' + p + ' for ' + S.teams[t].name + '!');
    confetti(t === 0 ? RED_CONF : GRN_CONF, 70);
    var card = $('t' + t); card.classList.add('flash');
    setTimeout(function () { card.classList.remove('flash'); }, 1000);
    renderScores(); renderStatus();
  }
  function go(d) {
    var n = S.cur + d;
    if (n < 0 || n >= deck().length) return;
    S.cur = n; save(); newRound(); $('mult').value = '1'; renderAll();
  }
  function revealAll() {
    var ans = sorted(curQ());
    ans.forEach(function (a, i) {
      if (R.shown.has(i)) return;
      R.shown.add(i);
      var tile = $('grid').children[i];
      if (tile) {
        tile.classList.add('missed', 'on');
        tile.querySelector('.hit').setAttribute('aria-label', 'Answer ' + (i + 1) + ': ' + a.t + ', ' + (+a.p || 0) + ' points');
      }
    });
    ding(2);
  }
  function restartQuestion() { newRound(); $('mult').value = '1'; renderAll(); }

  function finish() {
    var a = S.teams[0], b = S.teams[1], w = $('win');
    var title, note, who;
    if (a.score === b.score) { title = 'It’s a tie!'; note = 'Both teams are tied. Time for a tie-breaker question!'; who = 'tie'; }
    else {
      var win = a.score > b.score ? a : b;
      who = a.score > b.score ? 0 : 1;
      title = win.name + ' wins!'; note = 'Merry Christmas to everybody, and thanks for playing.';
    }
    $('winTitle').textContent = title;
    $('winScores').textContent = a.name + ' ' + a.score + '  ·  ' + b.name + ' ' + b.score;
    $('winNote').textContent = note;
    w.showModal(); fanfare(); lightsParty();
    confetti(who === 1 ? GRN_CONF : RED_CONF, 120, w);
  }
  function newGame() {
    if (!confirm('Start a new game? Both scores go back to 0 and you return to question 1.')) return;
    S.teams.forEach(function (t) { t.score = 0; });
    S.cur = 0; S.fm = blankFm(); save(); newRound(); $('mult').value = '1';
    $('win').close(); renderAll();
  }

  function toggleFs() {
    var e = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) { (e.requestFullscreen || e.webkitRequestFullscreen || function () {}).call(e); }
    else { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); }
  }
  function renderMute() {
    $('mute').textContent = S.mute ? '🔇 Sound off' : '🔊 Sound on';
    $('mute').setAttribute('aria-pressed', S.mute ? 'true' : 'false');
  }
  function toggleMute() { S.mute = !S.mute; save(); renderMute(); if (!S.mute) ding(1); }

  /* ---------------- Question editor ---------------- */
  var edI = 0;
  function renderList() {
    var ul = $('qlist'); ul.innerHTML = '';
    var cats = [];
    S.questions.forEach(function (q) { if (cats.indexOf(q.cat) < 0) cats.push(q.cat); });
    cats.forEach(function (c) {
      ul.appendChild(el('li', 'grp', c));
      S.questions.forEach(function (q, i) {
        if (q.cat !== c) return;
        var li = el('li', 'qrow');
        var cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = q.use;
        cb.setAttribute('aria-label', 'Use question ' + (i + 1) + ' in the game');
        cb.onchange = function () { q.use = cb.checked; save(); updateCount(); if (i === edI) $('edUse').checked = q.use; };
        var b = el('button', i === edI ? 'cur' : '');
        b.type = 'button';
        b.textContent = (i + 1) + '. ' + (q.q || 'Untitled question');
        var n = q.a.filter(function (x) { return x.t && x.t.trim(); }).length;
        b.appendChild(el('span', 'cnt', n ? n + ' answers' : 'No answers yet'));
        b.onclick = function () { edI = i; renderEditor(); };
        li.appendChild(cb); li.appendChild(b); ul.appendChild(li);
      });
    });
    var dl = $('cats'); dl.innerHTML = '';
    CATS.concat(cats.filter(function (c) { return CATS.indexOf(c) < 0; })).forEach(function (c) { dl.appendChild(new Option(c)); });
    updateCount();
  }
  function updateCount() {
    $('edCount').textContent = deck().length + ' of ' + S.questions.length + ' questions are in the game.';
  }
  function renderEditor() {
    var q = S.questions[edI];
    $('edQ').value = q.q; $('edCat').value = q.cat; $('edUse').checked = q.use;
    while (q.a.length < 8) q.a.push({ t: '', p: '' });
    var ar = $('arows');
    ar.innerHTML = '<span></span><span class="h">Answer</span><span class="h">Points</span>';
    q.a.slice(0, 8).forEach(function (row, i) {
      var n = el('span', 'n', i + 1);
      var t = document.createElement('input'); t.type = 'text'; t.value = row.t; t.setAttribute('aria-label', 'Answer ' + (i + 1));
      var p = document.createElement('input'); p.type = 'number'; p.min = '0'; p.value = row.p; p.setAttribute('aria-label', 'Points for answer ' + (i + 1));
      t.oninput = function () { row.t = t.value; save(); renderList(); };
      p.oninput = function () { row.p = p.value === '' ? '' : Math.max(0, +p.value); save(); };
      ar.append(n, t, p);
    });
    $('bulk').value = '';
    $('tn0').value = S.teams[0].name; $('tn1').value = S.teams[1].name;
    $('delQ').disabled = S.questions.length <= 1;
    renderList();
  }
  function parseBulk(text) {
    return text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var m = l.match(/^(.*?\S)\s*(?:[,:;|\t]|\s[-–—]\s|\s)\s*(\d+)\s*(?:votes?|pts?|points?)?$/i);
      if (m) return { t: m[1].replace(/[\s,:;|\-–—]+$/, ''), p: +m[2] };
      return { t: l, p: 0 };
    }).filter(function (x) { return x.t; });
  }
  function exportBackup() {
    var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'holiday-feud-backup.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importBackup(file) {
    var r = new FileReader();
    r.onload = function () {
      var d = null;
      try { d = normalize(JSON.parse(r.result)); } catch (e) { d = null; }
      if (!d) { alert('That file isn’t a Holiday Family Feud backup.'); return; }
      if (!confirm('Replace everything in this browser with the backup?')) return;
      S = d; if (S.cur >= deck().length) S.cur = 0;
      save(); edI = 0; renderEditor(); renderMute();
    };
    r.readAsText(file);
  }

  /* ---------------- Fast Money ---------------- */
  var FM_DUR = [20, 25], FM_GOAL = 200;
  var fmP = 0, timer = null, tLeft = 20, fmWon = false, chips = [];
  function withAnswers() { return S.questions.filter(function (q) { return sorted(q).length; }); }
  function qById(id) { return S.questions.filter(function (q) { return q.id === id; })[0] || null; }
  function fmSanitize() {
    var ok = {}; withAnswers().forEach(function (q) { ok[q.id] = true; });
    S.fm.q = S.fm.q.map(function (id) { return id && ok[id] ? id : null; });
    S.fm.pick = S.fm.pick.map(function (row) {
      return row.map(function (v, i) {
        var q = qById(S.fm.q[i]);
        return q && v >= 0 && v < sorted(q).length ? v : -1;
      });
    });
  }
  function fmAuto() {
    var pool = deck().filter(function (q) { return sorted(q).length; });
    var src = pool.length >= 5 ? pool : withAnswers();
    var pick = src.slice(-5);
    S.fm.q = [0, 1, 2, 3, 4].map(function (i) { return pick[i] ? pick[i].id : null; });
    S.fm.pick = [[-1, -1, -1, -1, -1], [-1, -1, -1, -1, -1]];
    save(); renderFm();
  }
  function fmPoints(p, i) {
    var q = qById(S.fm.q[i]); if (!q) return 0;
    var a = sorted(q)[S.fm.pick[p][i]];
    return a ? (+a.p || 0) : 0;
  }
  function renderFm() {
    var rows = $('fmRows'); rows.innerHTML = ''; chips = [];
    var opts = withAnswers();
    for (var i = 0; i < 5; i++) (function (i) {
      var row = el('div', 'fm-row');
      row.appendChild(el('span', 'fm-n', i + 1));
      var qs = document.createElement('select'); qs.setAttribute('aria-label', 'Question ' + (i + 1));
      qs.appendChild(new Option('Choose a question…', ''));
      opts.forEach(function (q) { qs.appendChild(new Option(trunc(q.q, 64), q.id)); });
      qs.value = S.fm.q[i] || '';
      qs.onchange = function () { S.fm.q[i] = qs.value || null; S.fm.pick[0][i] = -1; S.fm.pick[1][i] = -1; save(); renderFm(); };
      var q = qById(S.fm.q[i]);
      var as = document.createElement('select'); as.setAttribute('aria-label', 'Player ' + (fmP + 1) + ' answer ' + (i + 1));
      as.appendChild(new Option('No answer / not on the board', '-1'));
      if (q) sorted(q).forEach(function (a, k) { as.appendChild(new Option(a.t + ' (' + (+a.p || 0) + ')', String(k))); });
      as.disabled = !q; as.value = String(S.fm.pick[fmP][i]);
      as.onchange = function () { S.fm.pick[fmP][i] = +as.value; save(); renderFmTotals(false); };
      var chip = el('span', 'fm-pts'); chips.push(chip);
      row.appendChild(qs); row.appendChild(as); row.appendChild(chip);
      rows.appendChild(row);
    })(i);
    renderFmTotals(true);
  }
  function renderFmTotals(silent) {
    var t = [0, 1].map(function (p) { return [0, 1, 2, 3, 4].reduce(function (s, i) { return s + fmPoints(p, i); }, 0); });
    var total = t[0] + t[1];
    chips.forEach(function (c, i) { c.textContent = 'P1 ' + fmPoints(0, i) + ' · P2 ' + fmPoints(1, i); });
    $('fmP1').textContent = t[0]; $('fmP2').textContent = t[1]; $('fmTotal').textContent = total;
    $('fmBar').style.width = Math.min(100, total / FM_GOAL * 100) + '%';
    var msg = $('fmMsg');
    if (total >= FM_GOAL) {
      msg.textContent = '🎉 ' + total + ' points. That’s the jackpot!'; msg.className = 'fm-msg good';
      if (!fmWon && !silent) { fanfare(); confetti(RED_CONF, 90, $('fm')); }
      fmWon = true;
    } else {
      msg.textContent = (FM_GOAL - total) + ' more points to win'; msg.className = 'fm-msg'; fmWon = false;
    }
  }
  function timerShow() {
    var s = Math.max(0, Math.ceil(tLeft));
    $('timer').textContent = s;
    $('timer').classList.toggle('low', tLeft > 0 && tLeft <= 5);
  }
  function stopTimer() { clearInterval(timer); timer = null; }
  function timerReset() { stopTimer(); tLeft = FM_DUR[fmP]; timerShow(); $('tStart').textContent = 'Start timer'; }
  function timerStart() {
    stopTimer(); tLeft = FM_DUR[fmP];
    var end = Date.now() + tLeft * 1000, last = Math.ceil(tLeft);
    $('tStart').textContent = 'Restart timer';
    timer = setInterval(function () {
      tLeft = (end - Date.now()) / 1000;
      var s = Math.ceil(tLeft);
      if (s !== last) { last = s; if (s <= 5 && s > 0) tick(); }
      if (tLeft <= 0) { tLeft = 0; stopTimer(); buzz(); toast('⏰ Time’s up!'); }
      timerShow();
    }, 100);
    timerShow();
  }
  function openFm() {
    fmSanitize();
    if (!S.fm.q.some(Boolean)) fmAuto();
    fmP = 0; setPlayerButtons(); timerReset(); renderFm();
    $('fm').showModal();
  }
  function setPlayerButtons() {
    document.querySelectorAll('#fmPlayers button').forEach(function (b) { b.classList.toggle('on', +b.dataset.p === fmP); });
  }

  /* ---------------- Wiring ---------------- */
  $('strikeBtn').onclick = strike;
  $('undoStrike').onclick = undoStrike;
  $('aw0').onclick = function () { awardTo(0); };
  $('aw1').onclick = function () { awardTo(1); };
  $('c0').onclick = function () { setControl(0); };
  $('c1').onclick = function () { setControl(1); };
  $('mult').onchange = function () { renderScores(); };
  $('next').onclick = function () { go(1); };
  $('prev').onclick = function () { go(-1); };
  $('jump').onchange = function () { S.cur = +$('jump').value; save(); newRound(); $('mult').value = '1'; renderAll(); };
  $('revealAll').onclick = revealAll;
  $('resetRound').onclick = restartQuestion;
  $('finish').onclick = finish;
  $('fs').onclick = toggleFs;
  $('mute').onclick = toggleMute;
  document.querySelectorAll('[data-adj]').forEach(function (b) {
    b.onclick = function () {
      var p = b.dataset.adj.split(',').map(Number);
      S.teams[p[0]].score = Math.max(0, S.teams[p[0]].score + p[1]); save(); renderScores();
    };
  });

  // Editor
  $('edQ').oninput = function () { S.questions[edI].q = $('edQ').value; save(); renderList(); };
  $('edCat').onchange = function () { S.questions[edI].cat = $('edCat').value.trim() || 'Custom'; save(); renderList(); };
  $('edUse').onchange = function () { S.questions[edI].use = $('edUse').checked; save(); renderList(); };
  $('tn0').oninput = function () { S.teams[0].name = $('tn0').value || 'Team 1'; save(); };
  $('tn1').oninput = function () { S.teams[1].name = $('tn1').value || 'Team 2'; save(); };
  $('addQ').onclick = function () {
    S.questions.push({ id: 'u' + Date.now().toString(36), cat: 'Custom', q: '', use: true, a: [] });
    edI = S.questions.length - 1; save(); renderEditor(); $('edQ').focus();
  };
  $('delQ').onclick = function () {
    if (S.questions.length <= 1) return;
    if (!confirm('Delete this question?')) return;
    S.questions.splice(edI, 1); edI = Math.max(0, edI - 1); save(); renderEditor();
  };
  $('bulkGo').onclick = function () {
    var rows = parseBulk($('bulk').value);
    if (!rows.length) { toast('Paste at least one answer first.'); return; }
    rows.sort(function (a, b) { return b.p - a.p; });
    S.questions[edI].a = rows.slice(0, 8);
    save(); renderEditor();
    toast(rows.length > 8 ? 'Filled the top 8 of ' + rows.length + ' answers.' : 'Answers filled in.');
  };
  $('zero').onclick = function () {
    if (confirm('Reset both team scores to 0?')) { S.teams.forEach(function (t) { t.score = 0; }); save(); }
  };
  $('restore').onclick = function () {
    if (!confirm('Replace all questions and answers with the starter set? Your survey answers will be erased.')) return;
    var f = fresh(); S.questions = f.questions; S.cur = 0; S.fm = blankFm(); edI = 0; save(); renderEditor();
  };
  $('exportBtn').onclick = exportBackup;
  $('importBtn').onclick = function () { $('importFile').click(); };
  $('importFile').onchange = function () { if (this.files[0]) importBackup(this.files[0]); this.value = ''; };
  function openEditor() { edI = Math.min(Math.max(0, S.questions.indexOf(curQ())), S.questions.length - 1); renderEditor(); $('ed').showModal(); }
  $('openEd').onclick = openEditor;
  $('closeEd').onclick = function () { $('ed').close(); };
  $('closeEd2').onclick = function () { $('ed').close(); };
  $('ed').addEventListener('close', function () {
    S.questions.forEach(function (q) {
      q.a = q.a.filter(function (x) { return x.t && x.t.trim(); }).map(function (x) { return { t: x.t.trim(), p: +x.p || 0 }; });
    });
    if (S.cur >= deck().length) S.cur = Math.max(0, deck().length - 1);
    save(); newRound(); $('mult').value = '1'; renderAll(); renderMute();
  });

  // Fast Money
  $('openFm').onclick = openFm;
  $('closeFm').onclick = function () { $('fm').close(); };
  $('fm').addEventListener('close', stopTimer);
  $('fmAuto').onclick = fmAuto;
  $('tStart').onclick = timerStart;
  $('tReset').onclick = timerReset;
  document.querySelectorAll('#fmPlayers button').forEach(function (b) {
    b.onclick = function () { fmP = +b.dataset.p; setPlayerButtons(); timerReset(); renderFm(); };
  });

  // Winner
  $('winClose').onclick = function () { $('win').close(); };
  $('winNew').onclick = newGame;

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (!$('intro').hidden) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.matches('input,select,textarea')) return;
    var k = e.key;
    if (k >= '1' && k <= '8') reveal(+k - 1);
    else if (k === 'x' || k === 'X') strike();
    else if (k === 'ArrowRight') go(1);
    else if (k === 'ArrowLeft') go(-1);
    else if (k === 'f' || k === 'F') toggleFs();
    else if (k === 'm' || k === 'M') toggleMute();
  });

  /* ---------------- Start up ---------------- */
  snow($('snowL'), 22);
  snow($('snowR'), 22);
  buildTreeBulbs();
  buildLights();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(buildLights, 200); });

  if (reduce) {
    // Freeze the cartoon at the "plugged in" moment instead of animating.
    document.querySelectorAll('svg animate').forEach(function (a) { a.remove(); });
    document.querySelectorAll('.cord').forEach(function (c) { c.setAttribute('d', 'M254 206 C 232 228 176 220 140 185'); });
  }

  // Welcome screen with its own copies of the reindeer and Santa
  var art = $('introArt');
  var d1 = el('div', 'deer'); d1.appendChild(document.querySelector('.mast .deer svg').cloneNode(true));
  var d2 = el('div', 'scene'); d2.appendChild(document.querySelector('.mast .scene svg').cloneNode(true));
  art.appendChild(d1); art.appendChild(d2);
  snow($('introSnow'), 60);
  buildLights();

  function closeIntro() {
    var i = $('intro');
    i.classList.add('out');
    setTimeout(function () { i.hidden = true; }, 520);
    try { sessionStorage.setItem('feud-intro-seen', '1'); } catch (e) { /* ignore */ }
  }
  $('introGo').onclick = function () { ctx(); jingle(); closeIntro(); lightsParty(); };
  $('introSetup').onclick = function () { ctx(); closeIntro(); openEditor(); };
  try { if (sessionStorage.getItem('feud-intro-seen')) $('intro').hidden = true; } catch (e) { /* ignore */ }

  renderMute();
  renderAll();
  if (!$('intro').hidden) $('introGo').focus();
})();
