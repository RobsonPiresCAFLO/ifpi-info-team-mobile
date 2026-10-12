'use strict';

// ============================================================
//  IFPI FLORIANO INFO TEAM — jogo arcade do quadro de professores
// ============================================================

// Resolução lógica: 1280×720 na horizontal ou 720×1280 na vertical (celular em pé).
// Tudo é desenhado nesta escala; a orientação é detectada pelo formato da janela.
let W = 1280, H = 720;
let CHAO = 640;                    // linha do chão onde o professor pisa
let retrato = false;               // true = tela vertical
const escalaJogador = () => (retrato ? 1.3 : 1);   // personagem maior na vertical
const tamItem = () => (retrato ? 20 : 18);         // texto dos balões que caem
const MODO_FORCADO = new URLSearchParams(location.search).get('modo');   // ?modo=retrato ou ?modo=paisagem
const TEMPO_FASE = 60;             // segundos por fase
const FONTE_TITULO = 'Bangers, Impact, sans-serif';
const FONTE_TEXTO = '"M PLUS Rounded 1c", "Trebuchet MS", sans-serif';
const CHAVE_RECORDE = 'ifpi-info-team-recorde';

const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');

// ---------- Utilidades ----------
const rand = (a, b) => a + Math.random() * (b - a);
const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = (t) => t * t * (3 - 2 * t);
const pisca = (vel = 2) => Math.floor(performance.now() / 1000 * vel * 2) % 2 === 0;
const zeros = (n, casas = 7) => String(Math.floor(n)).padStart(casas, '0');

function lerRecorde() {
  try { return parseInt(localStorage.getItem(CHAVE_RECORDE), 10) || 0; } catch { return 0; }
}
function salvarRecorde(p) {
  if (p <= recorde) return;
  recorde = p;
  try { localStorage.setItem(CHAVE_RECORDE, String(p)); } catch { /* sem storage */ }
}
let recorde = lerRecorde();

// ---------- Orientação e escala do canvas (nítido em qualquer tela) ----------
let escala = 1;
var prontoParaGirar = false;   // só reposiciona objetos depois que o jogo carregou
function definirOrientacao() {
  const antes = retrato;
  retrato = MODO_FORCADO === 'retrato' || (MODO_FORCADO !== 'paisagem' && innerHeight > innerWidth * 1.05);
  const W0 = W;
  W = retrato ? 720 : 1280;
  H = retrato ? 1280 : 720;
  CHAO = retrato ? 1050 : 640;
  if (antes !== retrato && prontoParaGirar) aoGirar(W0);
}
function redimensionar() {
  definirOrientacao();
  const dpr = window.devicePixelRatio || 1;
  escala = Math.min(innerWidth / W, innerHeight / H);
  canvas.style.width = `${Math.floor(W * escala)}px`;
  canvas.style.height = `${Math.floor(H * escala)}px`;
  canvas.width = Math.floor(W * escala * dpr);
  canvas.height = Math.floor(H * escala * dpr);
}
addEventListener('resize', redimensionar);
redimensionar();

// ---------- Imagens ----------
const imgProf = [];
const imgFase = [];
function carregarImagem(src) {
  return new Promise((ok) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });
}
// recorte quadrado do rosto: [x, y, lado] em frações da largura/altura (ajustável por professor em dados.js)
const rosto = (img) => {
  const [x, y, lado] = img.recorteRosto || [0.12, 0.03, 0.76];
  return [img.width * x, img.height * y, img.width * lado, img.width * lado];
};

// ---------- Entrada: teclado, mouse e toque ----------
const teclas = new Set();
const apertadas = new Set();
const cliques = [];
const ponteiros = new Map();
let modoToque = matchMedia('(pointer: coarse)').matches;   // celular/tablet já começa no modo toque

const CONFIRMA = ['Enter', 'NumpadEnter', 'Space', 'KeyJ'];
const VOLTA = ['Escape', 'Backspace'];
const MAPA = {
  esq: ['ArrowLeft', 'KeyA'],
  dir: ['ArrowRight', 'KeyD'],
  pulo: ['ArrowUp', 'KeyW', 'Space', 'KeyK'],
};

addEventListener('keydown', (e) => {
  if (!teclas.has(e.code)) apertadas.add(e.code);
  teclas.add(e.code);
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  modoToque = false;
  Som.destravar();
});
addEventListener('keyup', (e) => teclas.delete(e.code));
addEventListener('blur', () => {
  teclas.clear();
  if (tela === 'jogando') irPara('pausa');
});

function paraCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
// Tela cheia: o navegador só permite entrar depois de um toque/clique do usuário.
// No celular, o primeiro toque fora da partida já esconde a barra do navegador.
function pedirTelaCheia() {
  const el = document.documentElement;
  const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!pedir || document.fullscreenElement || document.webkitFullscreenElement) return;
  try {
    const r = pedir.call(el, { navigationUI: 'hide' });
    if (r && r.catch) r.catch(() => {});        // negado (ex.: iPhone): segue sem tela cheia
  } catch { /* sem suporte */ }
}

canvas.addEventListener('pointerdown', (e) => {
  const p = paraCanvas(e);
  modoToque = e.pointerType === 'touch';
  if (modoToque && tela !== 'jogando') pedirTelaCheia();
  ponteiros.set(e.pointerId, p);
  cliques.push(p);
  Som.destravar();
});
canvas.addEventListener('pointermove', (e) => {
  if (ponteiros.has(e.pointerId)) ponteiros.set(e.pointerId, paraCanvas(e));
});
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
  canvas.addEventListener(ev, (e) => ponteiros.delete(e.pointerId));
}

const BOTOES = {
  esq: { x: 100, y: 610, r: 60, rotulo: '◀' },
  dir: { x: 250, y: 610, r: 60, rotulo: '▶' },
  pulo: { x: W - 120, y: 610, r: 70, rotulo: '▲' },
};
// Na vertical os botões ficam maiores, na faixa abaixo do chão.
function posicionarBotoes() {
  const y = retrato ? 1170 : 610;
  Object.assign(BOTOES.esq, { x: retrato ? 95 : 100, y, r: retrato ? 70 : 60 });
  Object.assign(BOTOES.dir, { x: retrato ? 265 : 250, y, r: retrato ? 70 : 60 });
  Object.assign(BOTOES.pulo, { x: W - (retrato ? 110 : 120), y, r: retrato ? 80 : 70 });
}
const toque = { esq: false, dir: false, pulo: false };
let puloToqueAnterior = false;
function lerToque() {
  posicionarBotoes();
  for (const k in toque) toque[k] = false;
  if (!modoToque) return;
  for (const p of ponteiros.values()) {
    for (const [k, b] of Object.entries(BOTOES)) {
      if (Math.hypot(p.x - b.x, p.y - b.y) < b.r * 1.35) toque[k] = true;
    }
  }
}

const segurando = (acao) => MAPA[acao].some((c) => teclas.has(c)) || toque[acao];
const apertou = (codigos) => codigos.some((c) => apertadas.has(c));
const clicouEm = (x, y, w, h) => cliques.some((c) => c.x >= x && c.x <= x + w && c.y >= y && c.y <= y + h);
const confirmou = () => apertou(CONFIRMA) || cliques.length > 0;

// ---------- Máquina de telas ----------
let tela = 'carregando';
let tTela = 0;
function irPara(nova) {
  tela = nova;
  tTela = 0;
  const trilha = { titulo: 'titulo', selecao: 'selecao', intro: 'jogo', jogando: 'jogo', final: 'titulo' }[nova];
  if (trilha !== undefined) Som.musica(trilha);
  else if (['ko', 'continuar', 'gameover', 'faseConcluida', 'tempoEsgotado'].includes(nova)) Som.musica(null);
}

// ---------- Estado da partida ----------
let sel = 0;
let selecaoConfirmada = false;
let escolhido = -1;
let jogo = null;
const jogador = { x: W / 2, y: CHAO, vx: 0, vy: 0, noChao: true, dir: 1, anim: 0, invul: 0, esticar: 0 };

function novaPartida() {
  jogo = { fase: 0, pontos: 0 };
  iniciarFase();
}

function iniciarFase() {
  Object.assign(jogo, {
    vida: 100, vidaMostrada: 100,
    barra: 0, barraMostrada: 0,
    tempo: TEMPO_FASE,
    itens: [], textos: [], particulas: [],
    proximoItem: 1.2,
    combo: 0, maxCombo: 0, comboT: 0,
    dobro: 0,
    levouDano: false,
    tremor: 0, flash: 0, flashCor: '#fff',
    bonus: null,
  });
  Object.assign(jogador, { x: W / 2, y: CHAO, vx: 0, vy: 0, noChao: true, dir: 1, anim: 0, invul: 0, esticar: 0 });
  irPara('intro');
}

// Celular girado no meio da partida: reposiciona o que depende do tamanho da tela.
function aoGirar(W0) {
  jogador.x = limitar(jogador.x * W / W0, 50, W - 50);
  if (jogador.noChao || jogador.y > CHAO) { jogador.y = CHAO; jogador.vy = 0; jogador.noChao = true; }
  if (jogo && jogo.itens) {
    const H0 = W0 === 720 ? 1280 : 720;
    for (const it of jogo.itens) {
      it.x0 = it.x = limitar(it.x * W / W0, it.w / 2 + 10, W - it.w / 2 - 10);
      it.y *= H / H0;
      it.vy *= retrato ? 1.6 : 1 / 1.6;
    }
  }
  for (const p of petalas) { p.x = rand(0, W); p.y = rand(0, H); }
}

const faseAtual = () => FASES[jogo.fase];
const prof = () => PROFESSORES[escolhido];

// ============================================================
//  ATUALIZAÇÃO
// ============================================================

function atualizar(dt) {
  tTela += dt;
  lerToque();
  if (apertou(['KeyM'])) Som.alternarMudo();

  switch (tela) {
    case 'titulo': atualizarTitulo(); break;
    case 'selecao': atualizarSelecao(); break;
    case 'intro': atualizarIntro(dt); break;
    case 'jogando': atualizarJogo(dt); break;
    case 'pausa': atualizarPausa(); break;
    case 'faseConcluida': atualizarFaseConcluida(dt); break;
    case 'ko':
    case 'tempoEsgotado':
      atualizarEfeitos(dt * 0.4);
      if (tTela > 2.6) irPara('continuar');
      break;
    case 'continuar': atualizarContinuar(); break;
    case 'gameover': if (tTela > 3.5 || (tTela > 1 && confirmou())) irPara('titulo'); break;
    case 'final': if (tTela > 5 && confirmou()) irPara('titulo'); break;
  }
}

function atualizarTitulo() {
  if (tTela > 0.3 && confirmou()) {
    Som.confirmar();
    selecaoConfirmada = false;
    irPara('selecao');
  }
}

// ---------- Seleção de professor ----------
const BOTAO_ESCOLHER = { x: 1000, y: 560, w: 240, h: 64 };
function posicionarBotaoEscolher() {
  Object.assign(BOTAO_ESCOLHER, retrato ? { x: W / 2 - 160, y: 1112, w: 320, h: 76 } : { x: 1000, y: 560, w: 240, h: 64 });
}

function layoutGrade() {
  posicionarBotaoEscolher();
  const n = PROFESSORES.length;
  const gap = 10;
  const areaW = retrato ? 680 : 1200, areaH = retrato ? 366 : 228;
  const tamanho = (cols) => {
    const linhas = Math.ceil(n / cols);
    return Math.min((areaW - gap * (cols - 1)) / cols, ((areaH - gap * (linhas - 1)) / linhas) * 0.75);
  };
  let cols;
  if (retrato) {                                  // vertical: escolhe o nº de colunas que deixa os retratos maiores
    cols = 1;
    for (let c = 2; c <= n; c++) if (tamanho(c) > tamanho(cols)) cols = c;
  } else {
    cols = Math.ceil(n / (n <= 8 ? 1 : n <= 20 ? 2 : 3));
  }
  const linhas = Math.ceil(n / cols);
  const cw = tamanho(cols);
  const ch = cw / 0.75;
  const totalW = cols * cw + (cols - 1) * gap;
  const x0 = retrato ? (W - totalW) / 2 : Math.min((W - totalW) / 2, BOTAO_ESCOLHER.x - 20 - totalW);   // não invade o botão
  const y0 = retrato ? 728 : 440;
  const celulas = PROFESSORES.map((_, i) => {
    const l = Math.floor(i / cols), c = i % cols;
    const naLinha = Math.min(cols, n - l * cols);
    const desloc = (cols - naLinha) * (cw + gap) / 2;   // centraliza a última linha incompleta
    return { x: x0 + desloc + c * (cw + gap), y: y0 + l * (ch + gap), w: cw, h: ch };
  });
  return { cols, linhas, celulas };
}

function atualizarSelecao() {
  if (selecaoConfirmada) {
    if (tTela > 1.4) novaPartida();
    return;
  }
  const n = PROFESSORES.length;
  const { cols, linhas, celulas } = layoutGrade();
  const antes = sel;

  if (apertou(['ArrowRight', 'KeyD'])) sel = (sel + 1) % n;
  if (apertou(['ArrowLeft', 'KeyA'])) sel = (sel - 1 + n) % n;
  if (apertou(['ArrowDown', 'KeyS'])) sel = sel + cols < n ? sel + cols : sel % cols;
  if (apertou(['ArrowUp', 'KeyW'])) {
    if (sel - cols >= 0) sel -= cols;
    else {
      let v = sel + cols * (linhas - 1);
      while (v >= n) v -= cols;
      sel = v;
    }
  }

  let confirmar = apertou(CONFIRMA);
  for (const c of cliques) {
    const i = celulas.findIndex((r) => c.x >= r.x && c.x <= r.x + r.w && c.y >= r.y && c.y <= r.y + r.h);
    if (i === -1) continue;
    if (i === sel) confirmar = true;
    else sel = i;
  }
  if (clicouEm(BOTAO_ESCOLHER.x, BOTAO_ESCOLHER.y, BOTAO_ESCOLHER.w, BOTAO_ESCOLHER.h)) confirmar = true;   // botão "ESCOLHER"
  if (sel !== antes) Som.mover();

  if (confirmar) {
    escolhido = sel;
    selecaoConfirmada = true;
    tTela = 0;
    Som.confirmar();
  } else if (apertou(VOLTA)) {
    Som.voltar();
    irPara('titulo');
  }
}

// ---------- Introdução da fase ----------
function atualizarIntro(dt) {
  atualizarJogador(dt, true);
  atualizarEfeitos(dt);
  const marcos = [2.2, 3.1];
  if (tTela - dt < marcos[0] && tTela >= marcos[0]) Som.contagem();
  if (tTela - dt < marcos[1] && tTela >= marcos[1]) Som.anuncio();
  if (tTela > 3.7) irPara('jogando');
}

// ---------- Jogo ----------
function atualizarJogo(dt) {
  const ct = caixaTempo();
  if (apertou(['Escape', 'KeyP']) || clicouEm(ct.x, ct.y, ct.w, ct.h + 6)) {
    irPara('pausa');
    return;
  }
  const j = jogo;
  atualizarJogador(dt, false);

  j.tempo -= dt;
  j.dobro = Math.max(0, j.dobro - dt);
  j.comboT = Math.max(0, j.comboT - dt);

  j.proximoItem -= dt;
  if (j.proximoItem <= 0) {
    gerarItem();
    j.proximoItem = Math.max(0.35, 0.85 - j.fase * 0.1) * rand(0.7, 1.3);
  }

  const e = escalaJogador();
  const hb = { x1: jogador.x - 38 * e, x2: jogador.x + 38 * e, y1: jogador.y - 175 * e, y2: jogador.y };
  for (const it of j.itens) {
    it.t += dt;
    it.y += it.vy * dt;
    if (it.zig) it.x = limitar(it.x0 + Math.sin(it.t * 2.2 + it.fz) * it.zig, it.w / 2 + 10, W - it.w / 2 - 10);
    const colide = it.x + it.w / 2 > hb.x1 && it.x - it.w / 2 < hb.x2 && it.y + it.h / 2 > hb.y1 && it.y - it.h / 2 < hb.y2;
    if (colide && !(it.tipo === 'ruim' && jogador.invul > 0)) {
      coletar(it);
      it.morto = true;
    } else if (it.y - it.h / 2 > CHAO + 20) {
      it.morto = true;
      if (it.tipo === 'bom') j.combo = 0;               // deixou o conteúdo cair: quebra o combo
      if (it.tipo === 'ruim') explodir(it.x, CHAO, '#ff4d6d', 8, 160);
    }
  }
  j.itens = j.itens.filter((it) => !it.morto);
  atualizarEfeitos(dt);

  if (j.barra >= 100) concluirFase();
  else if (j.vida <= 0) { j.vida = 0; Som.ko(); irPara('ko'); }
  else if (j.tempo <= 0) { j.tempo = 0; Som.ko(); irPara('tempoEsgotado'); }
}

function atualizarJogador(dt, bloqueado) {
  const p = jogador;
  let eixo = 0;
  if (!bloqueado) {
    if (segurando('esq')) eixo -= 1;
    if (segurando('dir')) eixo += 1;
  }
  p.vx += (eixo * 460 - p.vx) * Math.min(1, dt * 14);
  if (eixo) p.dir = eixo;

  const puloToque = toque.pulo && !puloToqueAnterior;
  puloToqueAnterior = toque.pulo;
  if (!bloqueado && (apertou(MAPA.pulo) || puloToque) && p.noChao) {
    p.vy = -860;
    p.noChao = false;
    p.esticar = 1;
    Som.pulo();
  }
  if (!p.noChao && !segurando('pulo') && p.vy < -320) p.vy = -320;   // pulo curto ao soltar

  p.vy += 2500 * dt;
  p.x = limitar(p.x + p.vx * dt, 50, W - 50);
  p.y += p.vy * dt;
  if (p.y >= CHAO) {
    if (!p.noChao) {
      p.esticar = -1;
      for (let i = 0; i < 6; i++) jogo.particulas.push({ x: p.x + rand(-30, 30), y: CHAO, vx: rand(-120, 120), vy: rand(-80, -20), vida: 0.4, max: 0.4, cor: 'rgba(255,255,255,0.8)', r: rand(3, 6) });
    }
    p.y = CHAO;
    p.vy = 0;
    p.noChao = true;
  }
  p.esticar *= Math.pow(0.001, dt);
  if (Math.abs(p.vx) > 40 && p.noChao) p.anim += dt;
  p.invul = Math.max(0, p.invul - dt);
}

const PODERES = [
  { id: 'cafe', texto: '☕ Café  +VIDA' },
  { id: 'estrela', texto: '★ Pontos x2' },
  { id: 'relogio', texto: '⏱ +10 segundos' },
];

function palavraBoa() {
  const proprias = prof().disciplinas;
  return proprias.length && Math.random() < 0.6 ? sortear(proprias) : sortear(PALAVRAS_BOAS);
}

function gerarItem() {
  const f = jogo.fase;
  const r = Math.random();
  const pRuim = Math.min(0.55, 0.3 + f * 0.06);
  let tipo, texto, poder = null;
  if (r < 0.06) {
    tipo = 'poder';
    const p = sortear(PODERES);
    texto = p.texto;
    poder = p.id;
  } else if (r < 0.06 + pRuim) {
    tipo = 'ruim';
    texto = sortear(COISAS_RUINS);
  } else {
    tipo = 'bom';
    texto = palavraBoa();
  }
  const tam = tamItem();
  ctx.font = `800 ${tam}px ${FONTE_TEXTO}`;
  const w = Math.ceil(ctx.measureText(texto).width) + tam * 2.2;
  const h = Math.round(tam * 2.45);
  const x = rand(w / 2 + 20, W - w / 2 - 20);
  const zig = f >= 2 && Math.random() < 0.2 + f * 0.08 ? rand(50, 120) : 0;
  jogo.itens.push({ tipo, texto, poder, tam, x, x0: x, y: -h, w, h, vy: (rand(120, 180) + f * 35) * (retrato ? 1.6 : 1), zig, fz: rand(0, 6.28), t: 0 });
}

function coletar(it) {
  const j = jogo;
  if (it.tipo === 'bom') {
    j.combo++;
    j.maxCombo = Math.max(j.maxCombo, j.combo);
    j.comboT = 2;
    const mult = Math.min(5, 1 + Math.floor(j.combo / 5)) * (j.dobro > 0 ? 2 : 1);
    const pts = 100 * mult;
    j.pontos += pts;
    j.barra = Math.min(100, j.barra + (7 - j.fase * 0.5));
    textoFlutuante(`+${pts}`, it.x, it.y, '#7dffb3');
    explodir(it.x, it.y, '#7dffb3', 14, 260);
    Som.pegar(j.combo);
  } else if (it.tipo === 'ruim') {
    const dano = 18 + j.fase * 2;
    j.vida -= dano;
    j.barra = Math.max(0, j.barra - 4);
    j.combo = 0;
    j.levouDano = true;
    j.tremor = 0.35;
    j.flash = 0.2;
    j.flashCor = '#ff2d55';
    jogador.invul = 1.3;
    jogador.vx = (jogador.x < it.x ? -1 : 1) * 500;
    textoFlutuante(`${it.texto}!`, it.x, it.y - 10, '#ff5c7a', 30);
    explodir(it.x, it.y, '#ff4d6d', 20, 360);
    Som.dano();
  } else {
    if (it.poder === 'cafe') { j.vida = Math.min(100, j.vida + 30); textoFlutuante('+30 VIDA', it.x, it.y, '#ffd166'); }
    if (it.poder === 'estrela') { j.dobro = 8; textoFlutuante('PONTOS x2!', it.x, it.y, '#ffd166'); }
    if (it.poder === 'relogio') { j.tempo += 10; textoFlutuante('+10s', it.x, it.y, '#ffd166'); }
    j.flash = 0.15;
    j.flashCor = '#fff3b0';
    explodir(it.x, it.y, '#ffd166', 24, 320);
    Som.poder();
  }
}

function concluirFase() {
  const j = jogo;
  j.barra = 100;
  const bonusTempo = Math.ceil(j.tempo) * 50;
  const bonusVida = Math.ceil(j.vida) * 20;
  const perfeito = !j.levouDano;
  j.bonus = { bonusTempo, bonusVida, perfeito };
  j.pontos += bonusTempo + bonusVida + (perfeito ? 5000 : 0);
  for (const it of j.itens) explodir(it.x, it.y, it.tipo === 'ruim' ? '#ff4d6d' : '#7dffb3', 10, 240);
  j.itens = [];
  Som.fase();
  irPara('faseConcluida');
}

function atualizarFaseConcluida(dt) {
  atualizarJogador(dt, true);
  atualizarEfeitos(dt);
  if (tTela > 5 || (tTela > 1.8 && confirmou())) {
    if (jogo.fase + 1 >= FASES.length) {
      salvarRecorde(jogo.pontos);
      irPara('final');
    } else {
      jogo.fase++;
      iniciarFase();
    }
  }
}

function atualizarPausa() {
  if (apertou(['KeyQ'])) {
    selecaoConfirmada = false;
    irPara('selecao');
  } else if (apertou(['Escape', 'KeyP', 'Enter', 'NumpadEnter']) || (cliques.length && tTela > 0.2)) {
    irPara('jogando');
  }
}

function atualizarContinuar() {
  const restante = 10 - tTela;
  if (Math.ceil(restante) !== Math.ceil(restante + 1 / 60) && restante > 0) Som.contagem();
  if (tTela > 0.5 && confirmou()) {
    Som.confirmar();
    jogo.pontos = 0;
    iniciarFase();
  } else if (restante <= 0) {
    salvarRecorde(jogo.pontos);
    irPara('gameover');
  }
}

// ---------- Efeitos ----------
function textoFlutuante(texto, x, y, cor, tam = 26) {
  jogo.textos.push({ texto, x, y, cor, tam, vida: 1.1, max: 1.1 });
}
function explodir(x, y, cor, n, vel) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), v = rand(vel * 0.3, vel);
    jogo.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, vida: rand(0.4, 0.8), max: 0.8, cor, r: rand(3, 7), brilho: true });
  }
}
function atualizarEfeitos(dt) {
  const j = jogo;
  j.vidaMostrada += (j.vida - j.vidaMostrada) * Math.min(1, dt * 3);
  j.barraMostrada += (j.barra - j.barraMostrada) * Math.min(1, dt * 5);
  j.tremor = Math.max(0, j.tremor - dt);
  j.flash = Math.max(0, j.flash - dt);
  for (const p of j.particulas) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt;
    p.vida -= dt;
  }
  j.particulas = j.particulas.filter((p) => p.vida > 0);
  for (const t of j.textos) {
    t.y -= 60 * dt;
    t.vida -= dt;
  }
  j.textos = j.textos.filter((t) => t.vida > 0);
}

// ============================================================
//  DESENHO — ferramentas
// ============================================================

function caminhoArredondado(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Texto com contorno grosso, no estilo de título de anime/mangá.
function texto(t, x, y, { tam = 24, cor = '#fff', alinha = 'left', fonte = FONTE_TEXTO, peso = 800, contorno = '#10102a', espessura = null, sombra = true, base = 'alphabetic', maxW = 0 } = {}) {
  const fonteCss = (tm) => (fonte === FONTE_TITULO ? `${tm}px ${fonte}` : `${peso} ${tm}px ${fonte}`);
  ctx.font = fonteCss(tam);
  if (maxW) {                                    // encolhe a fonte até o texto caber na largura
    const larg = ctx.measureText(t).width;
    if (larg > maxW) {
      const k = maxW / larg;
      tam *= k;
      if (espessura) espessura *= k;
      ctx.font = fonteCss(tam);
    }
  }
  ctx.textAlign = alinha;
  ctx.textBaseline = base;
  ctx.lineJoin = 'round';
  if (sombra) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText(t, x + tam * 0.06, y + tam * 0.1);
  }
  if (contorno) {
    ctx.lineWidth = espessura ?? Math.max(3, tam * 0.16);
    ctx.strokeStyle = contorno;
    ctx.strokeText(t, x, y);
  }
  ctx.fillStyle = cor;
  ctx.fillText(t, x, y);
}

function quebrarLinhas(t, maxW) {
  const palavras = t.split(' ');
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > maxW && atual) {
      linhas.push(atual);
      atual = p;
    } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function desenharCapa(img, x, y, w, h, deslocX = 0) {
  if (!img) return;
  const s = Math.max(w / img.width, h / img.height) * (deslocX ? 1.06 : 1);
  const iw = img.width * s, ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) / 2 + deslocX, y + (h - ih) / 2, iw, ih);
}

function gradiente(y1, y2, paradas) {
  const g = ctx.createLinearGradient(0, y1, 0, y2);
  paradas.forEach(([p, c]) => g.addColorStop(p, c));
  return g;
}

// Linhas de velocidade (efeito clássico de anime) partindo do centro.
function linhasDeVelocidade(cx, cy, cor, qtd = 70, raioInterno = 180) {
  ctx.save();
  ctx.fillStyle = cor;
  const giro = performance.now() / 4000;
  for (let i = 0; i < qtd; i++) {
    const a = (i / qtd) * Math.PI * 2 + giro + Math.sin(i * 12.9898) * 0.05;
    const larg = 0.006 + (Math.sin(i * 78.233) * 0.5 + 0.5) * 0.018;
    const ri = raioInterno + (Math.sin(i * 3.7 + performance.now() / 300) * 0.5 + 0.5) * 80;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri);
    ctx.lineTo(cx + Math.cos(a - larg) * 1600, cy + Math.sin(a - larg) * 1600);
    ctx.lineTo(cx + Math.cos(a + larg) * 1600, cy + Math.sin(a + larg) * 1600);
    ctx.fill();
  }
  ctx.restore();
}

// Pétalas de sakura flutuando (decoração de fundo).
const petalas = Array.from({ length: 28 }, () => ({ x: rand(0, W), y: rand(0, H), v: rand(30, 70), fase: rand(0, 6.28), tam: rand(6, 12) }));
function desenharPetalas(dt, alfa = 0.8) {
  ctx.save();
  ctx.globalAlpha = alfa;
  for (const p of petalas) {
    p.y += p.v * dt;
    p.x += Math.sin(p.fase + p.y / 60) * 30 * dt;
    if (p.y > H + 20) { p.y = -20; p.x = rand(0, W); }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.fase + p.y / 80);
    ctx.fillStyle = '#ffc2d4';
    ctx.beginPath();
    ctx.ellipse(0, 0, p.tam, p.tam * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function desenharRetrato(img, x, y, w, h, { borda = '#fff', larguraBorda = 4, raio = 14, recorte = null } = {}) {
  ctx.save();
  caminhoArredondado(x, y, w, h, raio);
  ctx.fillStyle = '#1b1b3a';
  ctx.fill();
  ctx.clip();
  if (img) {
    if (recorte) ctx.drawImage(img, ...recorte, x, y, w, h);
    else desenharCapa(img, x, y, w, h);
  }
  ctx.restore();
  if (larguraBorda) {
    caminhoArredondado(x, y, w, h, raio);
    ctx.lineWidth = larguraBorda;
    ctx.strokeStyle = borda;
    ctx.stroke();
  }
}

function botao(rotulo, x, y, w, h, cor = '#ff3d7f') {
  ctx.save();
  ctx.shadowColor = cor;
  ctx.shadowBlur = 20;
  caminhoArredondado(x, y, w, h, h / 2);
  ctx.fillStyle = gradiente(y, y + h, [[0, cor], [1, '#7a1fa2']]);
  ctx.fill();
  ctx.restore();
  caminhoArredondado(x, y, w, h, h / 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  texto(rotulo, x + w / 2, y + h / 2 + 2, { tam: 30, fonte: FONTE_TITULO, alinha: 'center', base: 'middle', sombra: false });
}

// ============================================================
//  DESENHO — personagem
// ============================================================

// Personagem "chibi": cabeça grande com o retrato anime e corpo desenhado com contorno.
function desenharProfessor(indice, x, y, { dir = 1, anim = 0, noAr = false, vy = 0, esticar = 0, escalaP = 1, invul = 0 } = {}) {
  if (invul > 0 && Math.floor(invul * 14) % 2 === 0) return;
  const p = PROFESSORES[indice];
  const img = imgProf[indice];
  const tempo = performance.now() / 1000;
  const passo = Math.sin(anim * 14);
  const respira = noAr ? 0 : Math.sin(tempo * 3) * 1.5;
  const sx = 1 + esticar * -0.08, sy = 1 + esticar * 0.1;

  ctx.save();
  ctx.translate(x, y);

  // sombra no chão
  if (y >= CHAO - 1 || !noAr) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.scale(escalaP * sx, escalaP * sy);

  const contorno = '#15132b';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = contorno;

  // pernas
  const pernas = noAr ? [[-12, -8], [12, 8]] : [[-12, passo * 12], [12, -passo * 12]];
  for (const [px, off] of pernas) {
    ctx.fillStyle = '#2a2d4a';
    caminhoArredondado(px - 9 + off * 0.3, -44, 18, 40, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    caminhoArredondado(px - 11 + off * 0.5 + dir * 3, -10, 24, 12, 6);
    ctx.fill();
    ctx.stroke();
  }

  // braços (atrás do tronco quando parado, levantados no pulo)
  const bracoAng = noAr ? -2.4 : passo * 0.6;
  for (const lado of [-1, 1]) {
    ctx.save();
    ctx.translate(lado * 26, -92 + respira);
    ctx.rotate(noAr ? lado * bracoAng * -0.5 : lado * bracoAng);
    ctx.fillStyle = p.cor;
    caminhoArredondado(-8, 0, 16, 40, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2c9a0';
    ctx.beginPath();
    ctx.arc(0, 42, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // tronco com sombreamento em duas cores (cel shading)
  ctx.save();
  caminhoArredondado(-30, -100 + respira, 60, 62, 16);
  ctx.fillStyle = p.cor;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(dir > 0 ? 6 : -30, -100, 24, 70);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(dir > 0 ? -24 : 14, -96, 8, 50);
  ctx.restore();
  caminhoArredondado(-30, -100 + respira, 60, 62, 16);
  ctx.stroke();

  // cordão e crachá do IFPI
  ctx.strokeStyle = '#d62839';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, -98 + respira);
  ctx.lineTo(0, -70 + respira);
  ctx.lineTo(14, -98 + respira);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = contorno;
  ctx.lineWidth = 2.5;
  caminhoArredondado(-9, -72 + respira, 18, 22, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2f9e41';
  ctx.fillRect(-7, -70 + respira, 14, 5);

  // cabeça: retrato anime em moldura redonda
  const cab = 96;
  const cy = -100 - cab + 10 + respira * 1.4 + (noAr ? Math.max(-6, vy * 0.006) : 0);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, cy + cab / 2, cab / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.clip();
  if (img) {
    ctx.save();
    if (dir < 0) { ctx.scale(-1, 1); }
    ctx.drawImage(img, ...rosto(img), -cab / 2, cy, cab, cab);
    ctx.restore();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, cy + cab / 2, cab / 2, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = contorno;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, cy + cab / 2, cab / 2 - 4, Math.PI * 1.1, Math.PI * 1.5);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.stroke();

  ctx.restore();
}

// ============================================================
//  DESENHO — telas
// ============================================================

let ultimoDesenho = performance.now();
function desenhar() {
  const agora = performance.now();
  const dt = Math.min(0.05, (agora - ultimoDesenho) / 1000);
  ultimoDesenho = agora;

  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = 1;

  switch (tela) {
    case 'carregando': desenharCarregando(); break;
    case 'titulo': desenharTitulo(dt); break;
    case 'selecao': desenharSelecao(dt); break;
    case 'intro': desenharCena(); desenharIntro(); break;
    case 'jogando': desenharCena(); desenharControlesToque(); break;
    case 'pausa': desenharCena(); desenharPausa(); break;
    case 'faseConcluida': desenharCena(); desenharFaseConcluida(); break;
    case 'ko': desenharCena(); desenharKO('K.O.!', '#ff2d55'); break;
    case 'tempoEsgotado': desenharCena(); desenharKO('TEMPO ESGOTADO!', '#ffb703'); break;
    case 'continuar': desenharCena(); desenharContinuar(); break;
    case 'gameover': desenharGameOver(); break;
    case 'final': desenharFinal(dt); break;
  }

  texto(Som.mudo ? '🔇 M' : '🔊 M', W - 12, H - 12, { tam: 14, alinha: 'right', cor: 'rgba(255,255,255,0.6)', contorno: null, sombra: false });
}

function fundoNoturno() {
  ctx.fillStyle = gradiente(0, H, [[0, '#1a1045'], [0.55, '#3b1a6b'], [1, '#0b0b24']]);
  ctx.fillRect(0, 0, W, H);
}

function desenharCarregando() {
  fundoNoturno();
  texto('Carregando…', W / 2, H / 2, { tam: 48, fonte: FONTE_TITULO, alinha: 'center' });
}

// ---------- Título ----------
function desenharTitulo(dt) {
  const t = tTela;
  // fundo: cenários alternando com transição suave
  const dur = 5;
  const i = Math.floor(t / dur) % FASES.length;
  const prox = (i + 1) % FASES.length;
  const mistura = limitar((t % dur - (dur - 1)) / 1, 0, 1);
  const zoom = (t % dur) * 6;
  desenharCapa(imgFase[i], -zoom, -zoom / 2, W + zoom * 2, H + zoom);
  if (mistura > 0) {
    ctx.globalAlpha = mistura;
    desenharCapa(imgFase[prox], 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = gradiente(0, H, [[0, 'rgba(26,16,69,0.55)'], [0.6, 'rgba(59,26,107,0.7)'], [1, 'rgba(11,11,36,0.95)']]);
  ctx.fillRect(0, 0, W, H);
  linhasDeVelocidade(W / 2, retrato ? 330 : 200, 'rgba(255,255,255,0.06)');
  desenharPetalas(dt);

  // faixa(s) com os professores desfilando — na vertical, duas faixas em sentidos opostos
  const n = PROFESSORES.length;
  const cw = retrato ? 132 : 120, ch = retrato ? 176 : 160, gap = 16, passoX = cw + gap;
  const faixas = retrato ? [{ y: 560, sentido: 1, inicio: 0 }, { y: 770, sentido: -1, inicio: Math.floor(n / 2) }] : [{ y: 400, sentido: 1, inicio: 0 }];
  for (const f of faixas) {
    const desloc = ((t * 60 * f.sentido) % (passoX * n) + passoX * n) % (passoX * n);
    for (let k = -1; k <= Math.ceil(W / passoX) + 1; k++) {
      const idx = ((k + Math.floor(desloc / passoX) + f.inicio) % n + n) % n;
      const x = k * passoX - (desloc % passoX);
      const y = f.y + Math.sin(t * 2 + k + f.y) * 6;
      desenharRetrato(imgProf[idx], x, y, cw, ch, { borda: 'rgba(255,255,255,0.85)', larguraBorda: 3 });
    }
  }

  // logotipo
  const entrada = suave(limitar(t / 0.8, 0, 1));
  ctx.save();
  ctx.translate(W / 2, retrato ? 300 : 170);
  ctx.scale(0.6 + entrada * 0.4, 0.6 + entrada * 0.4);
  ctx.globalAlpha = entrada;
  texto('IFPI FLORIANO', 0, -70, { tam: 56, fonte: FONTE_TITULO, alinha: 'center', cor: '#4ade80', contorno: '#0b3d20', espessura: 10 });
  const brilho = gradiente(-60, 40, [[0, '#fff6a8'], [0.5, '#ffb703'], [1, '#ff5d8f']]);
  texto('INFO TEAM', 0, 60, { tam: 150, fonte: FONTE_TITULO, alinha: 'center', cor: brilho, contorno: '#1a0b3b', espessura: 18, maxW: W - 40 });
  if (retrato) {
    texto('Quadro de Professores', 0, 118, { tam: 28, alinha: 'center', cor: '#ffffff' });
    texto('Técnico e Graduação em TI', 0, 154, { tam: 24, alinha: 'center', cor: '#ffc2d4' });
  } else {
    texto('Quadro de Professores • Técnico e Graduação em TI', 0, 118, { tam: 24, alinha: 'center', cor: '#ffffff' });
  }
  ctx.restore();

  if (t > 0.8 && pisca(1.2)) {
    texto(modoToque ? 'TOQUE PARA JOGAR' : 'APERTE ENTER PARA JOGAR', W / 2, retrato ? 1080 : 630, { tam: retrato ? 56 : 44, fonte: FONTE_TITULO, alinha: 'center', cor: '#fff', contorno: '#ff3d7f', espessura: 8, maxW: W - 40 });
  }
  texto(`RECORDE  ${zeros(recorde)}`, 24, H - 20, { tam: 18, cor: '#ffd166' });
  texto('CRÉDITOS ∞', W / 2, H - 20, { tam: 18, alinha: 'center', cor: '#ffffffaa' });
}

// ---------- Seleção ----------
function desenharSelecao(dt) {
  fundoNoturno();
  const p = PROFESSORES[sel];
  // posições dos elementos: horizontal (retrato à esquerda do painel) ou vertical (empilhados)
  const L = retrato
    ? { cx: 144, cy: 245, rw: 230, rh: 280, px: 16, py: 402, pw: W - 32, ph: 306, rotuloX: 36, rotuloY: 145, escolhidoX: W / 2, escolhidoY: 300 }
    : { cx: 220, cy: 250, rw: 270, rh: 330, px: 400, py: 100, pw: 840, ph: 320, rotuloX: 100, rotuloY: 118, escolhidoX: W / 2 + 180, escolhidoY: 270 };

  // fundo tingido com a cor do professor em foco + linhas de velocidade
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = p.cor;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  linhasDeVelocidade(L.cx, L.cy, 'rgba(255,255,255,0.07)', 60, 120);
  desenharPetalas(dt, 0.5);

  texto('ESCOLHA SEU PROFESSOR', W / 2, 62, { tam: 56, fonte: FONTE_TITULO, alinha: 'center', cor: gradiente(20, 62, [[0, '#fff6a8'], [1, '#ffb703']]), contorno: '#1a0b3b', espessura: 10, maxW: W - 30 });

  // retrato grande do professor em foco
  const img = imgProf[sel];
  const confirmado = selecaoConfirmada && sel === escolhido;
  const pulso = confirmado ? 1 + Math.sin(tTela * 20) * 0.02 : 1;
  ctx.save();
  ctx.translate(L.cx, L.cy);
  ctx.scale(pulso, pulso);
  ctx.shadowColor = p.cor;
  ctx.shadowBlur = 40;
  desenharRetrato(img, -L.rw / 2, -L.rh / 2, L.rw, L.rh, { borda: '#fff', larguraBorda: 6, raio: 22 });
  ctx.restore();
  texto('1P', L.rotuloX, L.rotuloY, { tam: 40, fonte: FONTE_TITULO, cor: '#ff3d7f', contorno: '#fff', espessura: 6 });

  // nome e título: dentro do painel (horizontal) ou ao lado do retrato (vertical)
  const { px, py, pw, ph } = L;
  let y;
  if (retrato) {
    const nx = L.cx + L.rw / 2 + 22, nw = W - nx - 20;
    ctx.font = `${50}px ${FONTE_TITULO}`;
    const nomes = quebrarLinhas(p.nome.toUpperCase(), nw);
    let ny = 190 - (nomes.length - 1) * 24;
    for (const ln of nomes) {
      texto(ln, nx, ny, { tam: 50, fonte: FONTE_TITULO, cor: '#ffd166', contorno: '#1a0b3b', espessura: 8, maxW: nw });
      ny += 50;
    }
    if (p.titulo) {
      ctx.font = `800 22px ${FONTE_TEXTO}`;
      quebrarLinhas(p.titulo, nw).forEach((ln, k) => texto(ln, nx, ny + 4 + k * 28, { tam: 22, cor: '#ffb3c8', contorno: '#1a0b3b', espessura: 4 }));
    }
  }

  // painel de habilidades
  ctx.save();
  caminhoArredondado(px, py, pw, ph, 22);
  ctx.fillStyle = 'rgba(12, 10, 40, 0.78)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.stroke();
  ctx.restore();

  if (retrato) {
    y = py + 36;
  } else {
    texto(p.nome.toUpperCase(), px + 30, py + 58, { tam: 50, fonte: FONTE_TITULO, cor: '#ffd166', contorno: '#1a0b3b', espessura: 8 });
    y = py + 90;
    if (p.titulo) {
      texto(p.titulo, px + 32, y, { tam: 20, cor: '#ffb3c8', contorno: null });
      y += 30;
    }
  }
  texto('HABILIDADES', px + 32, y, { tam: 16, cor: '#7dd3fc', contorno: null, sombra: false });
  y += 30;
  const fh = retrato ? 20 : 19, lh = retrato ? 26 : 26;   // fonte e altura da linha das habilidades
  ctx.font = `500 ${fh}px ${FONTE_TEXTO}`;
  const itens = p.habilidades.length ? p.habilidades : ['Em breve… (edite js/dados.js para adicionar)'];
  const limiteY = p.disciplinas.length ? py + ph - 64 : py + ph - 20;
  for (const h of itens) {
    const linhas = quebrarLinhas(h, pw - 90);
    if (y > limiteY) break;
    texto('✦', px + 34, y, { tam: 18, cor: '#ffd166', contorno: null, sombra: false });
    for (const l of linhas) {
      if (y > limiteY) break;
      texto(l, px + 62, y, { tam: fh, peso: 500, cor: '#fff', contorno: null, sombra: false });
      y += lh;
    }
    y += 3;
  }
  if (p.disciplinas.length) {
    let dx = px + 32;
    const dy = py + ph - 46;
    ctx.font = `800 15px ${FONTE_TEXTO}`;
    for (const d of p.disciplinas) {
      const w = ctx.measureText(d).width + 24;
      if (dx + w > px + pw - 20) break;
      caminhoArredondado(dx, dy, w, 30, 15);
      ctx.fillStyle = 'rgba(125, 255, 179, 0.18)';
      ctx.fill();
      ctx.strokeStyle = '#7dffb3';
      ctx.lineWidth = 2;
      ctx.stroke();
      texto(d, dx + w / 2, dy + 21, { tam: 15, alinha: 'center', cor: '#d9ffe9', contorno: null, sombra: false });
      dx += w + 10;
    }
  }

  // grade de professores
  const { celulas } = layoutGrade();
  celulas.forEach((c, i) => {
    const ativo = i === sel;
    ctx.save();
    if (!ativo) ctx.globalAlpha = 0.72;
    if (ativo) {
      ctx.shadowColor = '#ff3d7f';
      ctx.shadowBlur = 25;
    }
    const lift = ativo ? -8 : 0;
    desenharRetrato(imgProf[i], c.x, c.y + lift, c.w, c.h, { borda: ativo ? (pisca(4) ? '#ff3d7f' : '#ffd166') : 'rgba(255,255,255,0.5)', larguraBorda: ativo ? 5 : 2, raio: 10 });
    ctx.restore();
  });

  if (confirmado) {
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 0.7 - tTela)})`;
    ctx.fillRect(0, 0, W, H);
    const s = suave(limitar(tTela / 0.3, 0, 1));
    ctx.save();
    ctx.translate(L.escolhidoX, L.escolhidoY);
    ctx.rotate(-0.08);
    ctx.scale(0.5 + s * 0.5, 0.5 + s * 0.5);
    texto('ESCOLHIDO!', 0, 0, { tam: 90, fonte: FONTE_TITULO, alinha: 'center', cor: '#ff3d7f', contorno: '#fff', espessura: 12 });
    ctx.restore();
  } else {
    botao('ESCOLHER ▶', BOTAO_ESCOLHER.x, BOTAO_ESCOLHER.y, BOTAO_ESCOLHER.w, BOTAO_ESCOLHER.h);
    const dica = modoToque ? 'Toque para ver • toque de novo para escolher' : '←↑→↓ mover   •   ENTER escolher   •   ESC voltar';
    texto(dica, W / 2, H - (retrato ? 34 : 14), { tam: retrato ? 20 : 16, alinha: 'center', cor: 'rgba(255,255,255,0.75)', contorno: null, sombra: false, maxW: W - 30 });
  }
}

// ---------- Cena de jogo (fundo, itens, personagem, HUD) ----------
function desenharCena() {
  const j = jogo;
  ctx.save();
  if (j.tremor > 0) ctx.translate(rand(-1, 1) * j.tremor * 30, rand(-1, 1) * j.tremor * 30);

  const parallax = (W / 2 - jogador.x) * 0.04;
  ctx.filter = 'blur(1.5px)';   // desfoca o cenário para destacar itens e personagem
  desenharCapa(imgFase[j.fase], -40, -40, W + 80, H + 80, parallax);
  ctx.filter = 'none';
  ctx.fillStyle = gradiente(0, H, [[0, 'rgba(20,10,60,0.25)'], [0.7, 'rgba(20,10,60,0.15)'], [0.86, 'rgba(10,5,30,0.55)'], [1, 'rgba(10,5,30,0.85)']]);
  ctx.fillRect(-50, -50, W + 100, H + 100);

  // chão
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, CHAO + 2);
  ctx.lineTo(W, CHAO + 2);
  ctx.stroke();

  for (const it of j.itens) desenharItem(it);
  desenharProfessor(escolhido, jogador.x, jogador.y, { dir: jogador.dir, anim: jogador.anim, noAr: !jogador.noChao, vy: jogador.vy, esticar: jogador.esticar, invul: jogador.invul, escalaP: escalaJogador() });

  for (const p of j.particulas) {
    ctx.globalAlpha = Math.max(0, p.vida / p.max);
    ctx.fillStyle = p.cor;
    if (p.brilho) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.vida * 6);
      estrela(0, 0, p.r * 1.4, p.r * 0.5);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const t of j.textos) {
    ctx.globalAlpha = Math.min(1, t.vida / t.max * 2);
    texto(t.texto, t.x, t.y, { tam: t.tam, fonte: FONTE_TITULO, alinha: 'center', cor: t.cor });
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (j.flash > 0) {
    ctx.globalAlpha = j.flash * 2;
    ctx.fillStyle = j.flashCor;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  desenharHUD();
}

function estrela(x, y, rExt, rInt) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? rInt : rExt;
    const a = (i / 8) * Math.PI * 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

const ESTILO_ITEM = {
  bom: { fundo: ['#e9fff3', '#9ff5c6'], borda: '#10a35a', texto: '#063d22', brilho: '#4dffa0', icone: '📘' },
  ruim: { fundo: ['#ffe0e6', '#ff8fa3'], borda: '#c9184a', texto: '#4a0418', brilho: '#ff4d6d', icone: '💀' },
  poder: { fundo: ['#fff8d6', '#ffd166'], borda: '#e09f00', texto: '#4a3200', brilho: '#ffd166', icone: '' },
};

function desenharItem(it) {
  const e = ESTILO_ITEM[it.tipo];
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.rotate(it.tipo === 'ruim' ? Math.sin(it.t * 7 + it.fz) * 0.1 : Math.sin(it.t * 2 + it.fz) * 0.04);
  ctx.shadowColor = e.brilho;
  ctx.shadowBlur = 18;
  caminhoArredondado(-it.w / 2, -it.h / 2, it.w, it.h, it.h / 2);
  ctx.fillStyle = gradiente(-it.h / 2, it.h / 2, [[0, e.fundo[0]], [1, e.fundo[1]]]);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = e.borda;
  ctx.stroke();
  // brilho de "adesivo"
  ctx.beginPath();
  ctx.ellipse(-it.w / 4, -it.h / 4, it.w / 5, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  texto(it.texto, 0, 1, { tam: it.tam || 18, alinha: 'center', base: 'middle', cor: e.texto, contorno: null, sombra: false });
  if (e.icone) texto(e.icone, it.w / 2 - 4, -it.h / 2 + 4, { tam: (it.tam || 18) + 2, alinha: 'center', base: 'middle', contorno: null, sombra: false });
  ctx.restore();
}

function barra(x, y, w, h, frac, fracRastro, corCheia, corRastro, espelhada) {
  const inclina = h * 0.6;
  const forma = () => {
    ctx.beginPath();
    ctx.moveTo(x + inclina, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - inclina, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  };
  ctx.save();
  forma();
  ctx.fillStyle = 'rgba(10,8,30,0.85)';
  ctx.fill();
  ctx.clip();
  const pintar = (f, cor) => {
    const larg = w * limitar(f, 0, 1);
    ctx.fillStyle = cor;
    ctx.fillRect(espelhada ? x + w - larg : x, y, larg, h);
  };
  pintar(fracRastro, corRastro);
  pintar(frac, corCheia);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x, y + 2, w, h * 0.3);
  ctx.restore();
  forma();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
}

// Caixa do cronômetro (também é o botão de pausa no toque).
const caixaTempo = () => (retrato ? { x: W - 124, y: 10, w: 110, h: 84 } : { x: W / 2 - 55, y: 8, w: 110, h: 84 });

function desenharHUD() {
  const j = jogo, p = prof(), img = imgProf[escolhido];

  // retrato e barra de vida (esquerda / topo)
  ctx.save();
  ctx.beginPath();
  ctx.arc(52, 52, 38, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.clip();
  if (img) ctx.drawImage(img, ...rosto(img), 14, 14, 76, 76);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(52, 52, 38, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffd166';
  ctx.stroke();

  // na vertical: vida na 1ª linha, conhecimento na 2ª e cronômetro à direita
  const bw = retrato ? W - 250 : 440;
  const vidaFrac = j.vida / 100;
  const corVida = vidaFrac < 0.3 && pisca(3) ? '#ff2d55' : gradiente(18, 48, [[0, '#fff27a'], [1, '#ffb703']]);
  barra(100, 20, bw, 30, vidaFrac, j.vidaMostrada / 100, corVida, '#ff2d55', false);
  texto(p.nome.toUpperCase(), 104, 80, { tam: 28, fonte: FONTE_TITULO, cor: '#fff', maxW: bw - 150 });
  texto(zeros(j.pontos), 100 + bw, 80, { tam: 26, fonte: FONTE_TITULO, alinha: 'right', cor: '#ffd166' });

  // cronômetro
  const ct = caixaTempo();
  ctx.save();
  caminhoArredondado(ct.x, ct.y, ct.w, ct.h, 18);
  ctx.fillStyle = 'rgba(10,8,30,0.8)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();
  const seg = Math.max(0, Math.ceil(j.tempo));
  texto(String(seg).padStart(2, '0'), ct.x + ct.w / 2, ct.y + 68, { tam: 64, fonte: FONTE_TITULO, alinha: 'center', cor: seg <= 10 && pisca(3) ? '#ff2d55' : '#fff' });
  if (modoToque) texto('❚❚ pausa', ct.x + ct.w / 2, ct.y + ct.h + 22, { tam: 16, alinha: 'center', cor: 'rgba(255,255,255,0.75)' });

  // barra de conhecimento
  const cheia = j.barra >= 100;
  const corBarra = cheia && pisca(6) ? '#fff' : gradiente(18, 48, [[0, '#a7ffd4'], [1, '#10b981']]);
  const tiX = retrato ? 52 : W - 52, tiY = retrato ? 152 : 52;
  if (retrato) {
    barra(100, 120, bw, 30, j.barraMostrada / 100, j.barra / 100, corBarra, 'rgba(255,255,255,0.8)', false);
    texto('CONHECIMENTO', 104, 180, { tam: 26, fonte: FONTE_TITULO, cor: '#7dffb3' });
    texto(`FASE ${j.fase + 1}/${FASES.length}`, 100 + bw, 180, { tam: 26, fonte: FONTE_TITULO, alinha: 'right', cor: '#fff' });
  } else {
    barra(W - 540, 20, 440, 30, j.barraMostrada / 100, j.barra / 100, corBarra, 'rgba(255,255,255,0.8)', true);
    texto('CONHECIMENTO', W - 104, 80, { tam: 28, fonte: FONTE_TITULO, alinha: 'right', cor: '#7dffb3' });
    texto(`FASE ${j.fase + 1}/${FASES.length}`, W - 540, 80, { tam: 26, fonte: FONTE_TITULO, cor: '#fff' });
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(tiX, tiY, 38, 0, Math.PI * 2);
  ctx.fillStyle = gradiente(tiY - 38, tiY + 38, [[0, '#34d399'], [1, '#047857']]);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffd166';
  ctx.stroke();
  ctx.restore();
  texto('TI', tiX, tiY + 14, { tam: 40, fonte: FONTE_TITULO, alinha: 'center', cor: '#fff' });

  // estados especiais e combo
  const yEstado = retrato ? 236 : 130;
  if (j.dobro > 0) texto(`★ PONTOS x2  ${Math.ceil(j.dobro)}s`, 24, yEstado, { tam: 22, cor: '#ffd166' });
  if (tela === 'jogando' && j.combo >= 3 && j.comboT > 0) {
    const s = 1 + Math.max(0, j.comboT - 1.8) * 2;
    ctx.save();
    ctx.translate(40, retrato ? 320 : 220);
    ctx.rotate(-0.06);
    ctx.scale(s, s);
    texto(`${j.combo} ACERTOS`, 0, 0, { tam: 52, fonte: FONTE_TITULO, cor: '#ffd166', contorno: '#c9184a', espessura: 8 });
    texto('COMBO!', 0, 48, { tam: 40, fonte: FONTE_TITULO, cor: '#fff', contorno: '#c9184a', espessura: 7 });
    ctx.restore();
  }
}

function desenharControlesToque() {
  if (!modoToque) return;
  for (const [k, b] of Object.entries(BOTOES)) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = toque[k] ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.stroke();
    texto(b.rotulo, b.x, b.y + 2, { tam: 40, alinha: 'center', base: 'middle', cor: 'rgba(255,255,255,0.85)', contorno: null, sombra: false });
  }
}

// Telas centralizadas foram desenhadas para 720 de altura; na vertical, descem até o meio.
const dy = () => (H - 720) / 2;

// Texto grande de anúncio com "pop" de entrada.
function anuncio(t, local, { tam = 130, cor = '#fff', contorno = '#ff3d7f', y = H / 2, rot = -0.05 } = {}) {
  const s = local < 0.18 ? 2.2 - suave(local / 0.18) * 1.2 : 1;
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.globalAlpha = limitar(local / 0.1, 0, 1);
  texto(t, 0, tam * 0.35, { tam, fonte: FONTE_TITULO, alinha: 'center', cor, contorno, espessura: tam * 0.12, maxW: W - 50 });
  ctx.restore();
}

function faixaEscura(y, h, alfa = 0.6) {
  ctx.fillStyle = `rgba(10, 5, 30, ${alfa})`;
  ctx.fillRect(0, y, W, h);
}

function desenharIntro() {
  const t = tTela, f = faseAtual();
  if (t < 2.2) {
    const d = dy();
    faixaEscura(150 + d, retrato ? 420 : 360, 0.55 * suave(limitar(t / 0.3, 0, 1)));
    linhasDeVelocidade(W / 2, H / 2, 'rgba(255,255,255,0.08)', 50, 260);
    const entra = suave(limitar(t / 0.4, 0, 1));
    const sai = suave(limitar((t - 1.9) / 0.3, 0, 1));
    const dx = (1 - entra) * -W + sai * W;
    texto(`FASE ${jogo.fase + 1}`, W / 2 + dx, 235 + d, { tam: 60, fonte: FONTE_TITULO, alinha: 'center', cor: '#ffd166' });
    texto(f.nome.toUpperCase(), W / 2 - dx, 335 + d, { tam: 110, fonte: FONTE_TITULO, alinha: 'center', cor: '#fff', contorno: '#3a0ca3', espessura: 14, maxW: W - 40 });
    texto(f.subtitulo, W / 2 + dx, 390 + d, { tam: 28, alinha: 'center', cor: '#ffc2d4', maxW: W - 40 });
    if (jogo.fase === 0) {
      const ajuda = modoToque ? 'Use os botões ◀ ▶ e ▲ para pular' : 'Setas / A D para mover  •  ↑ / Espaço para pular';
      if (retrato) {
        texto('PEGUE os conteúdos 📘', W / 2, 450 + d, { tam: 28, alinha: 'center', cor: '#fff' });
        texto('DESVIE dos problemas 💀', W / 2, 490 + d, { tam: 28, alinha: 'center', cor: '#fff' });
        texto(ajuda, W / 2, 535 + d, { tam: 20, alinha: 'center', cor: 'rgba(255,255,255,0.85)', contorno: null, maxW: W - 40 });
      } else {
        texto('PEGUE os conteúdos 📘   •   DESVIE dos problemas 💀', W / 2, 450, { tam: 24, alinha: 'center', cor: '#fff' });
        texto(ajuda, W / 2, 488, { tam: 18, alinha: 'center', cor: 'rgba(255,255,255,0.8)', contorno: null });
      }
    }
  } else if (t < 3.1) {
    anuncio('PRONTO?', t - 2.2, { contorno: '#3a0ca3' });
  } else {
    anuncio('VALENDO!', t - 3.1, { tam: 160, cor: '#ffd166', contorno: '#c9184a' });
  }
}

function desenharPausa() {
  ctx.fillStyle = 'rgba(10,5,30,0.7)';
  ctx.fillRect(0, 0, W, H);
  texto('PAUSA', W / 2, 320 + dy(), { tam: 120, fonte: FONTE_TITULO, alinha: 'center', cor: '#fff', contorno: '#3a0ca3', espessura: 14 });
  texto(modoToque ? 'Toque para continuar' : 'ENTER / ESC continuar   •   Q trocar de professor', W / 2, 400 + dy(), { tam: 24, alinha: 'center', maxW: W - 40 });
}

function desenharFaseConcluida() {
  const t = tTela, b = jogo.bonus, d = dy();
  const meia = Math.min(280, W / 2 - 40);       // metade da largura da tabela de bônus
  linhasDeVelocidade(W / 2, 250 + d, 'rgba(255,230,120,0.12)', 60, 200);
  anuncio(jogo.fase + 1 >= FASES.length ? 'ÚLTIMA FASE VENCIDA!' : 'FASE CONCLUÍDA!', t, { tam: jogo.fase + 1 >= FASES.length ? 90 : 110, cor: '#ffd166', contorno: '#c9184a', y: 230 + d });
  const linhas = [
    ['Bônus de tempo', b.bonusTempo],
    ['Bônus de vida', b.bonusVida],
  ];
  if (b.perfeito) linhas.push(['PERFEITO! Sem nenhum bug', 5000]);
  linhas.push([`Maior combo: ${jogo.maxCombo}`, null]);
  linhas.forEach(([rotulo, valor], i) => {
    if (t < 0.6 + i * 0.35) return;
    const y = 360 + d + i * 46;
    faixaEscura(y - 34, 44, 0.55);
    texto(rotulo, W / 2 - meia, y, { tam: 28, cor: i === 2 && b.perfeito ? '#ffd166' : '#fff', maxW: meia * 2 - 110 });
    if (valor !== null) texto(`+${valor}`, W / 2 + meia, y, { tam: 30, fonte: FONTE_TITULO, alinha: 'right', cor: '#7dffb3' });
  });
  if (t > 1.8 && pisca(1.5)) texto(modoToque ? 'Toque para continuar' : 'ENTER para continuar', W / 2, 640 + d, { tam: 26, alinha: 'center' });
}

function desenharKO(msg, cor) {
  ctx.fillStyle = `rgba(10,5,30,${Math.min(0.55, tTela)})`;
  ctx.fillRect(0, 0, W, H);
  linhasDeVelocidade(W / 2, H / 2, 'rgba(255,255,255,0.1)', 60, 240);
  anuncio(msg, tTela, { tam: msg.length > 6 ? 110 : 200, cor, contorno: '#fff' });
}

function desenharContinuar() {
  ctx.fillStyle = 'rgba(10,5,30,0.85)';
  ctx.fillRect(0, 0, W, H);
  const img = imgProf[escolhido];
  ctx.save();
  ctx.filter = 'grayscale(1) brightness(0.7)';
  const d = dy();
  desenharRetrato(img, W / 2 - 110, 120 + d, 220, 290, { borda: '#888', raio: 20 });
  ctx.restore();
  texto('CONTINUAR?', W / 2, 90 + d, { tam: 72, fonte: FONTE_TITULO, alinha: 'center', cor: '#fff', contorno: '#3a0ca3', espessura: 10 });
  const n = Math.max(0, Math.ceil(10 - tTela));
  const s = 1 + (1 - ((10 - tTela) % 1)) * 0.3;
  ctx.save();
  ctx.translate(W / 2, 560 + d);
  ctx.scale(s, s);
  texto(String(n), 0, 0, { tam: 150, fonte: FONTE_TITULO, alinha: 'center', cor: '#ff2d55', contorno: '#fff', espessura: 12 });
  ctx.restore();
  if (pisca(1.5)) texto(modoToque ? 'TOQUE PARA CONTINUAR' : 'APERTE ENTER', W / 2, 660 + d, { tam: 30, fonte: FONTE_TITULO, alinha: 'center' });
}

function desenharGameOver() {
  fundoNoturno();
  anuncio('FIM DE JOGO', tTela, { tam: 150, cor: '#ff2d55', contorno: '#fff', y: 300 + dy() });
  texto(`PONTOS  ${zeros(jogo.pontos)}`, W / 2, 470 + dy(), { tam: 40, fonte: FONTE_TITULO, alinha: 'center', cor: '#ffd166' });
  texto(`RECORDE  ${zeros(recorde)}`, W / 2, 520 + dy(), { tam: 30, fonte: FONTE_TITULO, alinha: 'center' });
}

// ---------- Final: parabéns + quadro completo de professores ----------
function desenharFinal(dt) {
  const t = tTela;
  fundoNoturno();
  linhasDeVelocidade(W / 2, H / 2, 'rgba(255,230,120,0.07)', 70, 200);
  desenharPetalas(dt);

  if (t < 5) {
    const d = dy() + (retrato ? 60 : 0);
    anuncio('PARABÉNS!', t, { tam: 140, cor: '#ffd166', contorno: '#c9184a', y: retrato ? 250 : 110 });
    const s = suave(limitar((t - 0.4) / 0.6, 0, 1));
    ctx.globalAlpha = s;
    desenharProfessor(escolhido, W / 2, 560 + d, { escalaP: retrato ? 2.3 : 1.9 });
    ctx.globalAlpha = 1;
    texto(`${prof().nome} concluiu o semestre!`, W / 2, 620 + d, { tam: 34, alinha: 'center', maxW: W - 40 });
    texto(`PONTOS  ${zeros(jogo.pontos)}`, W / 2, 672 + d, { tam: 38, fonte: FONTE_TITULO, alinha: 'center', cor: '#ffd166' });
    return;
  }

  const a = suave(limitar((t - 5) / 0.8, 0, 1));
  ctx.globalAlpha = a;
  const topo = retrato ? 110 : 0;                // na vertical, o quadro desce um pouco
  texto('QUADRO DE PROFESSORES', W / 2, 70 + topo, { tam: 64, fonte: FONTE_TITULO, alinha: 'center', cor: gradiente(20 + topo, 70 + topo, [[0, '#fff6a8'], [1, '#ffb703']]), contorno: '#1a0b3b', espessura: 10, maxW: W - 30 });
  texto('Informática • IFPI Campus Floriano', W / 2, 106 + topo, { tam: 22, alinha: 'center', cor: '#ffc2d4' });
  const n = PROFESSORES.length;
  // horizontal: até 14 professores em 2 linhas de 7; acima disso, 2 linhas com retratos menores
  // vertical: 5 colunas (4 linhas para 20 professores)
  const cols = retrato ? Math.min(5, n) : n <= 14 ? Math.min(7, n) : Math.ceil(n / 2), linhasG = Math.ceil(n / cols);
  const gapX = retrato ? 20 : cols > 7 ? 24 : 40, gapY = retrato ? 58 : 64;
  const cw = Math.min(132, Math.floor((W - 60 - (cols - 1) * gapX) / cols)), ch = Math.round(cw * 4 / 3);
  const totalW = cols * cw + (cols - 1) * gapX;
  PROFESSORES.forEach((p, i) => {
    const l = Math.floor(i / cols), c = i % cols;
    const naLinha = Math.min(cols, n - l * cols);
    const x = (W - totalW) / 2 + (cols - naLinha) * (cw + gapX) / 2 + c * (cw + gapX);
    const y = 130 + topo + l * (ch + gapY) - (!retrato && linhasG > 2 ? l * 30 : 0);
    const atraso = limitar((t - 5.2 - i * 0.08) / 0.4, 0, 1);
    ctx.globalAlpha = a * atraso;
    desenharRetrato(imgProf[i], x, y + (1 - suave(atraso)) * 30, cw, ch, { borda: i === escolhido ? '#ffd166' : '#fff', larguraBorda: i === escolhido ? 5 : 3 });
    ctx.font = `800 15px ${FONTE_TEXTO}`;
    quebrarLinhas(p.nome, cw + gapX - 6).forEach((ln, k) => {
      texto(ln, x + cw / 2, y + ch + 24 + k * 19, { tam: 15, alinha: 'center', cor: '#fff', contorno: '#10102a', espessura: 4, sombra: false });
    });
  });
  ctx.globalAlpha = 1;
  if (t > 6 && pisca(1.2)) texto(modoToque ? 'Toque para voltar ao início' : 'ENTER para voltar ao início', W / 2, H - (retrato ? 60 : 30), { tam: 24, alinha: 'center' });
}

// ============================================================
//  LAÇO PRINCIPAL
// ============================================================

let ultimo = performance.now();
function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;
  if (tela !== 'carregando') atualizar(dt);
  desenhar();
  apertadas.clear();
  cliques.length = 0;
  requestAnimationFrame(quadro);
}

async function iniciar() {
  requestAnimationFrame(quadro);
  const fontes = Promise.all([
    document.fonts.load(`48px Bangers`),
    document.fonts.load(`800 20px "M PLUS Rounded 1c"`),
    document.fonts.load(`500 20px "M PLUS Rounded 1c"`),
  ]).catch(() => {});
  const limite = new Promise((ok) => setTimeout(ok, 2500));   // não trava se estiver offline
  const [profs, fases] = await Promise.all([
    Promise.all(PROFESSORES.map((p) => carregarImagem(p.foto).then((i) => { if (i && p.rosto) i.recorteRosto = p.rosto; return i; }))),
    Promise.all(FASES.map((f) => carregarImagem(f.fundo))),
    Promise.race([fontes, limite]),
  ]);
  imgProf.push(...profs);
  imgFase.push(...fases);
  jogo = { fase: 0, pontos: 0, particulas: [], textos: [], itens: [] };
  prontoParaGirar = true;
  irPara('titulo');
}
iniciar();
