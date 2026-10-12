'use strict';

// Música e efeitos sonoros sintetizados com Web Audio (nenhum arquivo de áudio).
const Som = (() => {
  let ac = null, mestre = null, busMusica = null, bufRuido = null;
  let mudo = false;
  try { mudo = localStorage.getItem('ifpi-info-team-mudo') === '1'; } catch { /* sem storage */ }

  let musicaAtual = null, musicaDesejada = null, passo = 0, proximo = 0, timer = null;

  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function destravar() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
      mestre = ac.createGain();
      mestre.gain.value = mudo ? 0 : 0.5;
      mestre.connect(ac.destination);
      busMusica = ac.createGain();
      busMusica.gain.value = 0.2;
      busMusica.connect(mestre);
      bufRuido = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const d = bufRuido.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
    if (musicaDesejada && musicaAtual !== musicaDesejada) iniciarMusica(musicaDesejada);
  }

  function tomEm(t, freq, dur, { tipo = 'square', vol = 0.2, ate = null, destino = null } = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t);
    if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(destino || mestre);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function ruidoEm(t, dur, { vol = 0.2, passaAlta = 0, destino = null } = {}) {
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = bufRuido;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let no = s;
    if (passaAlta) {
      const f = ac.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = passaAlta;
      no = s.connect(f);
    }
    no.connect(g).connect(destino || mestre);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  const tom = (freq, dur, opts = {}) => ac && tomEm(ac.currentTime + (opts.atraso || 0), freq, dur, opts);
  const ruido = (dur, opts = {}) => ac && ruidoEm(ac.currentTime + (opts.atraso || 0), dur, opts);
  const arpejo = (notas, dur, passoT, opts) => notas.forEach((n, i) => tom(hz(n), dur, { ...opts, atraso: i * passoT }));

  // ---------- Música: progressão estilo abertura de anime (Am – F – G – E) ----------
  const ACORDES = [[69, 72, 76], [65, 69, 72], [67, 71, 74], [64, 68, 71]];
  const MUSICAS = {
    titulo: { bpm: 104, bateria: false, melodia: true },
    selecao: { bpm: 120, bateria: true, melodia: false },
    jogo: { bpm: 148, bateria: true, melodia: true },
  };
  const BAIXO = [0, null, 12, null, 0, null, 12, 0, 0, null, 12, null, 0, 12, 0, 7];
  const ORDEM_ARPEJO = [0, 1, 2, 1, 2, 1, 0, 1];
  const MELODIA = [ // graus relativos à tônica do acorde, um por colcheia (null = pausa)
    [12, null, 11, 12, 16, null, 14, 12],
    [12, null, 16, 19, 17, null, 16, 12],
    [14, null, 12, 11, 12, null, 14, 19],
    [16, null, 14, 12, 11, null, 12, null],
  ];

  function agendarPasso(t, n) {
    const m = MUSICAS[musicaAtual];
    const dur = 60 / m.bpm / 4;
    const compasso = Math.floor(n / 16) % 4;
    const s = n % 16;
    const acorde = ACORDES[compasso];
    const raiz = acorde[0] - 36;

    if (BAIXO[s] !== null) tomEm(t, hz(raiz + BAIXO[s]), dur * 0.9, { tipo: 'triangle', vol: 0.55, destino: busMusica });
    if (s % 2 === 0) {
      tomEm(t, hz(acorde[ORDEM_ARPEJO[s / 2]]), dur * 1.5, { tipo: 'sine', vol: 0.18, destino: busMusica });
      const mel = MELODIA[compasso][s / 2];
      if (m.melodia && mel !== null && Math.floor(n / 64) % 2 === 1) {
        tomEm(t, hz(acorde[0] + mel - 12), dur * 1.8, { tipo: 'square', vol: 0.07, destino: busMusica });
      }
    }
    if (m.bateria) {
      if (s % 8 === 0) tomEm(t, 150, 0.15, { tipo: 'sine', vol: 0.8, ate: 40, destino: busMusica });
      if (s % 4 === 2) ruidoEm(t, 0.04, { vol: 0.12, passaAlta: 7000, destino: busMusica });
      if (s === 4 || s === 12) ruidoEm(t, 0.14, { vol: 0.3, passaAlta: 1500, destino: busMusica });
    }
  }

  function agendador() {
    const dur = 60 / MUSICAS[musicaAtual].bpm / 4;
    while (proximo < ac.currentTime + 0.12) {
      agendarPasso(proximo, passo);
      proximo += dur;
      passo++;
    }
  }

  function iniciarMusica(nome) {
    pararMusica();
    if (!ac || !nome) return;
    musicaAtual = nome;
    passo = 0;
    proximo = ac.currentTime + 0.05;
    timer = setInterval(agendador, 25);
  }

  function pararMusica() {
    clearInterval(timer);
    timer = null;
    musicaAtual = null;
  }

  function musica(nome) {
    musicaDesejada = nome;
    if (ac && musicaAtual !== nome) iniciarMusica(nome);
  }

  function alternarMudo() {
    mudo = !mudo;
    try { localStorage.setItem('ifpi-info-team-mudo', mudo ? '1' : '0'); } catch { /* sem storage */ }
    if (mestre) mestre.gain.value = mudo ? 0 : 0.5;
    return mudo;
  }

  return {
    destravar, musica, alternarMudo,
    get mudo() { return mudo; },
    mover: () => tom(880, 0.06, { vol: 0.08 }),
    confirmar: () => arpejo([72, 76, 79, 84], 0.12, 0.06, { vol: 0.15 }),
    voltar: () => tom(400, 0.12, { vol: 0.12, ate: 200 }),
    pegar: (combo) => {
      const f = hz(72 + Math.min(combo, 12));
      tom(f, 0.08, { tipo: 'sine', vol: 0.3 });
      tom(f * 1.5, 0.12, { tipo: 'sine', vol: 0.2, atraso: 0.05 });
    },
    dano: () => {
      ruido(0.25, { vol: 0.35 });
      tom(220, 0.35, { tipo: 'sawtooth', vol: 0.2, ate: 50 });
    },
    poder: () => arpejo([72, 76, 79, 84, 88, 91], 0.1, 0.04, { tipo: 'sine', vol: 0.2 }),
    pulo: () => tom(300, 0.15, { tipo: 'sine', vol: 0.12, ate: 600 }),
    anuncio: () => { tom(hz(72), 0.12, { vol: 0.15 }); tom(hz(84), 0.4, { vol: 0.15, atraso: 0.12 }); },
    contagem: () => tom(hz(81), 0.1, { tipo: 'sine', vol: 0.2 }),
    fase: () => {
      arpejo([67, 72, 76, 79], 0.14, 0.12, { vol: 0.15 });
      tom(hz(84), 0.8, { vol: 0.15, atraso: 0.48 });
      tom(hz(79), 0.8, { tipo: 'sine', vol: 0.15, atraso: 0.48 });
    },
    ko: () => { tom(500, 1.0, { tipo: 'sawtooth', vol: 0.25, ate: 40 }); ruido(0.6, { vol: 0.3 }); },
  };
})();
