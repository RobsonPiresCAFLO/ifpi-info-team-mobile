/*!
 * IFPI FLORIANO INFO TEAM
 * Jogo arcade do quadro de professores de Informática.
 *
 * Criado por: Prof. Me. Robson Pires Borges
 * Inspirado no quadro de professores do curso de Tecnologia em Análise e
 * Desenvolvimento de Sistemas (TADS) do IFPI Campus Floriano, 2026.
 *
 * Copyright (c) 2026 Robson Pires Borges. Todos os direitos reservados.
 *
 * USO LIVRE: é permitido jogar, executar e apresentar este jogo
 * (por exemplo, em aulas e eventos), mantendo os créditos do autor.
 *
 * MODIFICAÇÕES: alterar, adaptar, traduzir ou criar obras derivadas deste
 * código, total ou parcialmente, depende de autorização prévia e expressa
 * do autor.
 *
 * Base legal (Brasil):
 *   - Lei nº 9.609/1998 (Lei do Software), art. 2º: programas de computador
 *     são protegidos pelo regime de direitos autorais.
 *   - Lei nº 9.610/1998 (Lei de Direitos Autorais), arts. 28 e 29: cabe ao
 *     autor o direito exclusivo de utilizar a obra, e a adaptação e quaisquer
 *     transformações dependem de sua autorização prévia e expressa.
 *   - Constituição Federal, art. 5º, inciso XXVII: aos autores pertence o
 *     direito exclusivo de utilização de suas obras.
 *
 * Os nomes e retratos dos professores são usados com finalidade educativa;
 * os direitos de imagem pertencem a cada professor retratado.
 */
'use strict';

// ============================================================
//  PODER ESPECIAL — barra, golpe e efeitos de cada professor
//  Os golpes (nome, frase, estilo, símbolos, cores e som) ficam em js/dados.js → ESPECIAIS.
//  Este arquivo só define funções; elas usam o estado do jogo (jogo, jogador, ctx...)
//  criado em js/jogo.js.
// ============================================================

const TECLAS_ESPECIAL = ['ArrowDown', 'KeyS', 'KeyE', 'KeyL'];
const ESPECIAL_CORTE = 1.6;        // duração da cena que apresenta o golpe (s)
const ESPECIAL_SEM_RUINS = 3;      // segundos sem itens vermelhos (e invulnerável) depois do golpe

function dadosEspecial(p) {
  const e = (typeof ESPECIAIS !== 'undefined' && ESPECIAIS[p.nome]) || {};
  return {
    estilo: 'disparo', forma: 'texto', simbolos: ['★', '✦'], som: 'animado', some: false,
    nome: p.titulo || 'Especial', frase: '', cores: [p.cor, '#ffd166', '#ffffff'],
    ...e,
  };
}

// '#rrggbb' + alfa → 'rgba(...)' (para degradês na cor do golpe)
function comAlfa(cor, a) {
  let h = String(cor).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return `rgba(255,255,255,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
// 0 → 1 passando um pouco do ponto e voltando (efeito "mola")
const elastico = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k) * Math.cos(k * Math.PI * 3));

// ---------- Barra: como enche ----------
// Cada acerto vale de 4% (1º do combo) a 10% (a partir do 10º seguido).
const ganhoPorAcerto = (combo) => 4 + Math.min(Math.max(combo, 1) - 1, 9) * (6 / 9);

function ganharEspecial(qtd) {
  const j = jogo;
  if (j.golpe || j.especial >= 100) return;
  j.especial = Math.min(100, j.especial + qtd);
  if (j.especial >= 100) {
    j.prontoT = 2;
    Som.especialPronto();
    textoFlutuante('ESPECIAL PRONTO!', W / 2, H * 0.45, '#ffd166', retrato ? 48 : 56);
  }
}

// Chamado em coletar() a cada conteúdo bom: +bônus a cada 5 acertos seguidos.
function especialPorAcerto(it) {
  const j = jogo;
  if (j.golpe || j.especial >= 100) return;
  ganharEspecial(ganhoPorAcerto(j.combo));
  if (j.combo % 5 === 0 && j.especial < 100) {
    textoFlutuante('ESPECIAL +', it.x, it.y - 36, '#ff8fab', 24);
    ganharEspecial(10);
  }
}

// ---------- Entrada: tecla ↓ / S / E / L, botão ★ (toque) ou clique na barra ----------
let espToqueAnterior = false;
function pediuEspecial() {
  const novoToque = toque.esp && !espToqueAnterior;
  espToqueAnterior = toque.esp;
  const r = areaBarraEspecial();
  return apertou(TECLAS_ESPECIAL) || novoToque || (!modoToque && clicouEm(r.x, r.y - 8, r.w + 130, r.h + 16));
}

// ---------- Golpe ----------
function ativarEspecial() {
  const j = jogo, e = dadosEspecial(prof());
  const ox = jogador.x, oy = jogador.y - 120 * escalaJogador();
  const dist = (it) => Math.hypot(it.x - ox, it.y - oy);
  const ruins = j.itens.filter((it) => it.tipo === 'ruim').sort((a, b) => dist(a) - dist(b));
  const alvos = ruins.map((it, i) => {
    const a = { it, feito: false, simbolo: e.simbolos[i % e.simbolos.length], cor: e.cores[i % e.cores.length],
      ox, oy, delay: i * 0.07, dur: 0.45, rot: rand(-0.35, 0.35) };
    switch (e.estilo) {
      case 'chuva': Object.assign(a, { ox: it.x, oy: -60, delay: i * 0.06, dur: 0.35 }); break;
      case 'raios': Object.assign(a, { delay: i * 0.09, dur: 0.06, rx: it.x + rand(-90, 90) }); break;
      case 'onda': case 'ciclone': Object.assign(a, { delay: dist(it) / 1300, dur: 0 }); break;
      case 'organiza': Object.assign(a, { delay: 0.75 + i * 0.07, dur: 0, x0: it.x, y0: it.y }); break;
      case 'robos': Object.assign(a, { ox: i % 2 ? -50 : W + 50, oy: CHAO - 26, delay: i * 0.08, dur: 0.75 }); break;
      case 'magica': Object.assign(a, { delay: rand(0, 0.45), dur: 0.3 }); break;
    }
    return a;
  });
  if (e.estilo === 'organiza') {          // vagas lado a lado, em ordem
    const n = alvos.length, passo = Math.min(170, (W - 160) / Math.max(1, n));
    alvos.forEach((a, k) => { a.vx = W / 2 + (k - (n - 1) / 2) * passo; a.vy = retrato ? 560 : 360; });
  }
  const bons = j.itens.filter((it) => it.tipo !== 'ruim').map((it) => ({ it, x0: it.x, y0: it.y, feito: false }));
  const fim = alvos.reduce((m, a) => Math.max(m, a.delay + a.dur), 0);
  j.golpe = { e, t: 0, alvos, bons, duracao: Math.max(1.0, fim + 0.6), deco: [], proxDeco: 0,
    ondas: [], abatidos: 0, popT: 0, flash: 0, impacto: false };
  j.especial = 0;
  j.prontoT = 0;
  Som.especial(e.som);
  irPara('especial');
}

function atualizarEspecial(dt) {
  const j = jogo, g = j.golpe;
  if (!g) { irPara('jogando'); return; }
  g.t += dt;
  atualizarJogador(dt, true);
  atualizarEfeitos(dt);
  atualizarDeco(g, dt);
  g.popT = Math.max(0, g.popT - dt);
  g.flash = Math.max(0, g.flash - dt);
  for (const o of g.ondas) o.t += dt;
  g.ondas = g.ondas.filter((o) => o.t < 0.45);
  if (!g.impacto && g.t >= 0.24) { g.impacto = true; Som.impacto(); jogo.tremor = Math.max(jogo.tremor, 0.25); }
  if (g.t < ESPECIAL_CORTE) return;

  const ta = g.t - ESPECIAL_CORTE;
  for (const a of g.alvos) {
    if (a.feito) continue;
    if (g.e.estilo === 'organiza') {
      const k = suave(limitar(ta / 0.6, 0, 1));
      a.it.x = a.x0 + (a.vx - a.x0) * k;
      a.it.y = a.y0 + (a.vy - a.y0) * k;
    }
    if (ta >= a.delay + a.dur) destruirAlvo(a);
  }
  // conteúdos bons voam até o professor e são coletados
  const tx = jogador.x, ty = jogador.y - 100 * escalaJogador();
  for (const b of g.bons) {
    if (b.feito) continue;
    const k = suave(limitar(ta / 0.55, 0, 1));
    b.it.x = b.x0 + (tx - b.x0) * k;
    b.it.y = b.y0 + (ty - b.y0) * k;
    if (k >= 1) { coletar(b.it); b.it.morto = true; b.feito = true; }
  }
  j.itens = j.itens.filter((it) => !it.morto);
  if (ta >= g.duracao) finalizarEspecial();
}

function destruirAlvo(a) {
  const j = jogo, it = a.it;
  a.feito = true;
  it.morto = true;
  const g = j.golpe, cor = a.cor === '#10102a' ? '#ffd166' : a.cor;
  j.pontos += 150;
  j.barra = Math.min(100, j.barra + 3);
  explodir(it.x, it.y, cor, 34, 520);
  explodir(it.x, it.y, '#ffffff', 12, 260);
  textoFlutuante('+150', it.x, it.y, cor, 36);
  if (g) {
    g.ondas.push({ x: it.x, y: it.y, cor, t: 0 });
    g.abatidos++;
    g.popT = 0.25;
    g.flash = 0.09;
  }
  j.tremor = Math.max(j.tremor, 0.2);
  Som.estouro();
}

function finalizarEspecial() {
  const j = jogo, n = j.golpe ? j.golpe.abatidos : 0;
  j.golpe = null;
  j.barra = Math.min(100, j.barra + 25);
  textoFlutuante(n ? `${n} ELIMINADO${n > 1 ? 'S' : ''}!` : 'CAMINHO LIVRE!', W / 2, H * 0.42, '#ffd166', retrato ? 58 : 66);
  textoFlutuante('+25% CONHECIMENTO', W / 2, H * 0.42 + (retrato ? 62 : 66), '#7dffb3', retrato ? 34 : 36);
  Som.especialFim();
  if (j.barra >= 100) { concluirFase(); return; }     // o especial fechou o round
  j.semRuins = ESPECIAL_SEM_RUINS;
  jogador.invul = ESPECIAL_SEM_RUINS;
  irPara('jogando');
}

// Símbolos que flutuam ao fundo durante o golpe.
function atualizarDeco(g, dt) {
  const e = g.e, cai = e.estilo === 'chuva';
  g.proxDeco -= dt;
  while (g.t < ESPECIAL_CORTE + g.duracao && g.proxDeco <= 0) {
    g.proxDeco += cai ? 0.035 : 0.07;
    g.deco.push({
      x: rand(0, W), y: cai ? -30 : H + 30, vx: cai ? 0 : rand(-40, 40), vy: cai ? rand(500, 800) : rand(-380, -220),
      rot: cai ? 0 : rand(-0.5, 0.5), vr: cai ? 0 : rand(-1.5, 1.5),
      txt: sortear(e.simbolos), cor: sortear(e.cores), tam: rand(22, 44), vida: 2.4,
    });
  }
  for (const d of g.deco) { d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt; d.vida -= dt; }
  g.deco = g.deco.filter((d) => d.vida > 0 && d.y > -80 && d.y < H + 80);
}

// ---------- Desenho ----------
function desenharSimbolo(txt, x, y, forma, cor, tam, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (forma === 'texto') {
    texto(txt, 0, 0, { tam, alinha: 'center', base: 'middle', cor, contorno: '#10102a', espessura: Math.max(3, tam * 0.14) });
  } else {
    const fs = tam * 0.6;
    ctx.font = `800 ${fs}px ${FONTE_TEXTO}`;
    const w = ctx.measureText(txt).width + tam * 0.9, h = tam * 1.25;
    if (forma === 'balao') {
      ctx.fillStyle = '#fff';
      caminhoArredondado(-w / 2, -h / 2, w, h, h / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-w * 0.18, h / 2 - 3);
      ctx.lineTo(-w * 0.32, h / 2 + tam * 0.4);
      ctx.lineTo(-w * 0.02, h / 2 - 3);
      ctx.fill();
      caminhoArredondado(-w / 2, -h / 2, w, h, h / 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = cor;
      ctx.stroke();
      texto(txt, 0, 1, { tam: fs, alinha: 'center', base: 'middle', cor: '#10102a', contorno: null, sombra: false });
    } else if (forma === 'postit') {
      const s = Math.max(w, h * 1.7), hh = h * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-s / 2 + 5, -hh / 2 + 5, s, hh);
      ctx.fillStyle = cor;
      ctx.fillRect(-s / 2, -hh / 2, s, hh);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(-s / 2, -hh / 2, s, hh * 0.18);
      texto(txt, 0, 2, { tam: fs, alinha: 'center', base: 'middle', cor: '#10102a', contorno: null, sombra: false });
    } else {                               // 'chip': placa com perninhas
      ctx.fillStyle = '#c9c9d6';
      const pinos = Math.max(3, Math.round(w / 14));
      for (let i = 0; i < pinos; i++) {
        const px = -w / 2 + (i + 0.5) * (w / pinos) - 2;
        ctx.fillRect(px, -h / 2 - 7, 4, 7);
        ctx.fillRect(px, h / 2, 4, 7);
      }
      ctx.fillStyle = '#1b1b2f';
      caminhoArredondado(-w / 2, -h / 2, w, h, 6);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = cor;
      ctx.stroke();
      texto(txt, 0, 1, { tam: fs, alinha: 'center', base: 'middle', cor, contorno: null, sombra: false });
    }
  }
  ctx.restore();
}

function desenharRobo(x, y, cor, s, passo) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#10102a';
  ctx.fillStyle = cor;
  // antena
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -40); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -42, 4, 0, Math.PI * 2); ctx.fillStyle = '#ff3d7f'; ctx.fill(); ctx.stroke();
  // cabeça e corpo
  ctx.fillStyle = cor;
  caminhoArredondado(-18, -30, 36, 26, 7); ctx.fill(); ctx.stroke();
  caminhoArredondado(-14, -4, 28, 22, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#10102a';
  ctx.fillRect(-10, -22, 7, 7); ctx.fillRect(3, -22, 7, 7);
  ctx.fillStyle = '#7dffb3';
  ctx.fillRect(-8, -20, 3, 3); ctx.fillRect(5, -20, 3, 3);
  // rodinhas
  ctx.fillStyle = '#2a2d4a';
  for (const px of [-9, 9]) { ctx.beginPath(); ctx.arc(px, 21, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (const px of [-9, 9]) { ctx.beginPath(); ctx.moveTo(px, 21); ctx.lineTo(px + Math.cos(passo) * 5, 21 + Math.sin(passo) * 5); ctx.stroke(); }
  ctx.restore();
}

function desenharRaio(x1, y1, x2, y2, cor) {
  const pts = [[x1, y1]], n = 9;
  for (let i = 1; i < n; i++) {
    const k = i / n;
    pts.push([x1 + (x2 - x1) * k + rand(-30, 30), y1 + (y2 - y1) * k]);
  }
  pts.push([x2, y2]);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const [lw, c, alfa] of [[18, cor, 0.55], [6, '#ffffff', 1]]) {
    ctx.globalAlpha = alfa;
    ctx.lineWidth = lw;
    ctx.strokeStyle = c;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.restore();
}

// Posição do "projétil" que vai do ponto de origem até o item (k de 0 a 1).
function trajetoria(a, k) {
  const tx = a.it.x, ty = a.it.y;
  if (a.estiloRobo) {
    const chao = CHAO - 26;
    if (k < 0.6) { const kk = k / 0.6; return { x: a.ox + (tx - a.ox) * kk, y: chao - Math.abs(Math.sin(kk * 30)) * 6 }; }
    const kk = (k - 0.6) / 0.4;
    return { x: tx, y: chao + (ty - chao) * kk - Math.sin(Math.PI * kk) * 70 };
  }
  if (a.reta) { const kk = k * k; return { x: a.ox + (tx - a.ox) * kk, y: a.oy + (ty - a.oy) * kk }; }
  return { x: a.ox + (tx - a.ox) * k, y: a.oy + (ty - a.oy) * k - Math.sin(Math.PI * k) * 130 };
}

function desenharEspecial() {
  const g = jogo.golpe;
  if (!g) return;
  const e = g.e, t = g.t, ta = t - ESPECIAL_CORTE, fimT = ESPECIAL_CORTE + g.duracao;
  const escuro = suave(limitar(t / 0.2, 0, 1)) * (1 - suave(limitar((t - fimT + 0.35) / 0.35, 0, 1)));

  // fundo escurecido + vinheta pulsando na cor do golpe
  ctx.fillStyle = `rgba(8, 4, 24, ${(t < ESPECIAL_CORTE ? 0.66 : 0.55) * escuro})`;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = escuro * (0.8 + 0.2 * Math.sin(t * 12));
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, comAlfa(e.cores[0], 0));
  vg.addColorStop(1, comAlfa(e.cores[0], 0.6));
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  for (const d of g.deco) {
    ctx.globalAlpha = Math.min(1, d.vida) * 0.6;
    desenharSimbolo(d.txt, d.x, d.y, e.forma, d.cor, d.tam, d.rot);
  }
  ctx.globalAlpha = 1;
  if (t >= ESPECIAL_CORTE) desenharLetreiro(g, ta);

  // professor, itens e efeitos voltam a aparecer por cima do escuro
  ctx.save();
  if (jogo.tremor > 0) ctx.translate(rand(-1, 1) * jogo.tremor * 30, rand(-1, 1) * jogo.tremor * 30);
  desenharHolofote(g, t, escuro);
  for (const it of jogo.itens) desenharItem(it);
  desenharJogador();
  desenharMiras(g, t);
  if (t >= ESPECIAL_CORTE) desenharAtaque(g, ta);
  desenharOndas(g);
  desenharEfeitos();
  ctx.restore();

  if (t < ESPECIAL_CORTE + 0.05) desenharCorte(g, t);

  // clarões: entrada do golpe (branco) e cada acerto (cor do golpe)
  const entrada = limitar(1 - t / 0.18, 0, 1) * 0.85;
  if (entrada > 0) { ctx.globalAlpha = entrada; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); }
  if (g.flash > 0) { ctx.globalAlpha = g.flash * 2.5; ctx.fillStyle = e.cores[0]; ctx.fillRect(0, 0, W, H); }
  ctx.globalAlpha = 1;
}

// Luz atrás do professor: brilho, raios girando e anéis de energia no chão.
function desenharHolofote(g, t, escuro) {
  if (g.e.some) return;                  // golpes de invisibilidade não revelam onde ele está
  const e = g.e, s = escalaJogador(), x = jogador.x, y = jogador.y - 110 * s;
  const r = 250 * s * (1 + 0.06 * Math.sin(t * 14));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, comAlfa(e.cores[0], 0.6 * escuro));
  gr.addColorStop(1, comAlfa(e.cores[0], 0));
  ctx.fillStyle = gr;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.translate(x, y);
  ctx.rotate(t * 0.9);
  ctx.fillStyle = comAlfa(e.cores[1] || '#ffffff', 0.13 * escuro);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 1.7, -r * 0.13);
    ctx.lineTo(r * 1.7, r * 0.13);
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  for (let k = 0; k < 3; k++) {
    const f = (t * 1.5 + k / 3) % 1;
    ctx.globalAlpha = (1 - f) * 0.85 * escuro;
    ctx.lineWidth = 7 * (1 - f) + 1;
    ctx.strokeStyle = e.cores[k % e.cores.length];
    ctx.beginPath();
    ctx.ellipse(x, jogador.y - 4, (50 + f * 170) * s, (12 + f * 38) * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Mira travando em cada item vermelho antes de ele ser destruído.
function desenharMiras(g, t) {
  const k0 = t - (ESPECIAL_CORTE - 0.3);
  if (k0 < 0) return;
  ctx.save();
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = pisca(8) ? '#ffd166' : '#ff2d55';
  for (const a of g.alvos) {
    if (a.feito) continue;
    const it = a.it, k = suave(limitar((k0 - Math.min(a.delay, 0.6) * 0.3) / 0.3, 0, 1));
    if (k <= 0) continue;
    const z = 1 + (1 - k) * 0.9, hw = (it.w / 2 + 12) * z, hh = (it.h / 2 + 12) * z, L = 20;
    ctx.globalAlpha = k;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(it.x + sx * hw, it.y + sy * (hh - L));
        ctx.lineTo(it.x + sx * hw, it.y + sy * hh);
        ctx.lineTo(it.x + sx * (hw - L), it.y + sy * hh);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// Onda de choque em cada item destruído.
function desenharOndas(g) {
  ctx.save();
  for (const o of g.ondas) {
    const k = o.t / 0.45;
    ctx.globalAlpha = 1 - k;
    ctx.lineWidth = 14 * (1 - k) + 2;
    ctx.strokeStyle = o.cor;
    ctx.beginPath();
    ctx.arc(o.x, o.y, 20 + suave(k) * 170, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Nome do golpe no alto da tela durante o ataque + contador de eliminados.
function desenharLetreiro(g, ta) {
  const e = g.e;
  const a = limitar(ta / 0.2, 0, 1) * (1 - suave(limitar((ta - g.duracao + 0.35) / 0.35, 0, 1)));
  if (a <= 0) return;
  const y = retrato ? 330 : 215, tam = retrato ? 66 : 76;
  ctx.save();
  ctx.globalAlpha = a;
  texto(e.nome.toUpperCase(), W / 2, y, { tam, fonte: FONTE_TITULO, alinha: 'center', cor: '#fff', contorno: '#10102a', espessura: 20, maxW: W - 80 });
  texto(e.nome.toUpperCase(), W / 2, y, { tam, fonte: FONTE_TITULO, alinha: 'center', cor: '#fff', contorno: e.cores[0], espessura: 8, sombra: false, maxW: W - 80 });
  if (g.abatidos > 0) {
    const z = 1 + g.popT * 2.2;
    ctx.translate(W / 2, y + (retrato ? 66 : 70));
    ctx.scale(z, z);
    texto(`✖ ${g.abatidos} ELIMINADO${g.abatidos > 1 ? 'S' : ''}`, 0, 0, { tam: retrato ? 36 : 40, fonte: FONTE_TITULO, alinha: 'center', cor: '#ffd166' });
  }
  ctx.restore();
}

function desenharAtaque(g, ta) {
  const e = g.e;
  if (e.estilo === 'onda' || e.estilo === 'ciclone') {
    const r = ta * 1300, ox = jogador.x, oy = jogador.y - 120 * escalaJogador();
    if (r > 2300) return;
    ctx.save();
    ctx.globalAlpha = limitar(1 - r / 2300, 0, 1);
    ctx.lineWidth = 22;
    ctx.strokeStyle = e.cores[0];
    ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = e.cores[1] || '#fff';
    ctx.beginPath(); ctx.arc(ox, oy, r * 0.9, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    const n = e.estilo === 'ciclone' ? 18 : 12;
    for (let k = 0; k < n; k++) {
      const giro = e.estilo === 'ciclone' ? ta * 7 : 0;
      const ang = (k / n) * Math.PI * 2 + giro;
      const rr = e.estilo === 'ciclone' ? r * (0.45 + 0.55 * ((k % 3) / 2)) : r;
      desenharSimbolo(e.simbolos[k % e.simbolos.length], ox + Math.cos(ang) * rr, oy + Math.sin(ang) * rr, e.forma, e.cores[k % e.cores.length], 40, e.estilo === 'ciclone' ? ang : 0);
    }
    return;
  }
  if (e.estilo === 'organiza' && ta > 0.55) {
    const yv = retrato ? 560 : 360;
    ctx.save();
    ctx.setLineDash([14, 10]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(224,225,221,0.7)';
    ctx.beginPath(); ctx.moveTo(60, yv + 40); ctx.lineTo(W - 60, yv + 40); ctx.stroke();
    ctx.restore();
  }
  for (const a of g.alvos) {
    if (a.feito || ta < a.delay) continue;
    const it = a.it;
    const k = a.dur > 0 ? limitar((ta - a.delay) / a.dur, 0, 1) : 1;
    switch (e.estilo) {
      case 'raios':
        desenharRaio(a.rx, -20, it.x, it.y, a.cor);
        break;
      case 'organiza':
        desenharSimbolo('✔', it.x + it.w / 2, it.y - it.h / 2, 'texto', '#7dffb3', 30, 0);
        break;
      case 'magica':
        desenharSimbolo(a.simbolo, it.x, it.y, e.forma, a.cor, 36 + k * 64, k * 3);
        break;
      case 'robos': {
        a.estiloRobo = true;
        const p = trajetoria(a, k);
        desenharRobo(p.x, p.y, a.cor, retrato ? 1.7 : 1.5, ta * 20);
        break;
      }
      default: {                          // 'disparo' e 'chuva': rastro + símbolo
        a.reta = e.estilo === 'chuva';
        for (const [atras, alfa] of [[0.16, 0.25], [0.08, 0.5], [0, 1]]) {
          const p = trajetoria(a, Math.max(0, k - atras));
          ctx.globalAlpha = alfa;
          desenharSimbolo(a.simbolo, p.x, p.y, e.forma, a.cor, 46, a.rot);
        }
        ctx.globalAlpha = 1;
      }
    }
  }
  // raios: o golpe ainda brilha um pouco depois de acertar
  if (e.estilo === 'raios') {
    for (const a of g.alvos) {
      if (a.feito && ta < a.delay + 0.3) desenharRaio(a.rx, -20, a.it.x, a.it.y, a.cor);
    }
  }
}

// Cena de apresentação: explosão de raios, faixa na cor do golpe, retrato, nome e frase.
function desenharCorte(g, t) {
  const e = g.e, p = prof(), img = imgProf[escolhido];
  const entra = suave(limitar(t / 0.22, 0, 1));
  const sai = suave(limitar((t - (ESPECIAL_CORTE - 0.2)) / 0.2, 0, 1));
  const cy = retrato ? H / 2 + 110 : H / 2, bh = retrato ? 330 : 280;

  // explosão de raios girando atrás de tudo
  ctx.save();
  ctx.globalAlpha = 0.5 * entra * (1 - sai);
  ctx.translate(W / 2, cy);
  ctx.rotate(t * 0.6);
  const n = 16, R = Math.max(W, H) * 1.2;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.5) / n) * Math.PI * 2;
    ctx.fillStyle = i % 2 ? e.cores[0] : (e.cores[1] || '#ffffff');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a0) * R, Math.sin(a0) * R);
    ctx.lineTo(Math.cos(a1) * R, Math.sin(a1) * R);
    ctx.fill();
  }
  ctx.restore();

  linhasDeVelocidade(W / 2, cy, `rgba(255,255,255,${0.2 * (1 - sai)})`, 70, 220);
  ctx.save();
  ctx.globalAlpha = 1 - sai;
  ctx.translate(W / 2, cy);
  ctx.rotate(-0.07);
  ctx.scale(1, entra);
  const grad = ctx.createLinearGradient(-W, 0, W, 0);
  grad.addColorStop(0, e.cores[0]);
  grad.addColorStop(0.5, '#1a1040');
  grad.addColorStop(1, e.cores[0]);
  ctx.fillStyle = grad;
  ctx.fillRect(-W, -bh / 2, W * 2, bh);
  // listras diagonais correndo pela faixa
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  const off = (t * 700) % 130;
  for (let x = -W - 130 + off; x < W + bh; x += 130) {
    ctx.beginPath();
    ctx.moveTo(x, -bh / 2);
    ctx.lineTo(x + 55, -bh / 2);
    ctx.lineTo(x + 55 - bh * 0.4, bh / 2);
    ctx.lineTo(x - bh * 0.4, bh / 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(-W, -bh / 2 - 10, W * 2, 10);
  ctx.fillRect(-W, bh / 2, W * 2, 10);
  ctx.fillStyle = e.cores[1] || '#ffd166';
  ctx.fillRect(-W, -bh / 2 - 18, W * 2, 6);
  ctx.fillRect(-W, bh / 2 + 12, W * 2, 6);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 1 - sai;
  const rw = retrato ? 300 : 240, rh = rw * 4 / 3;
  let rx, ry, cx, area;
  if (retrato) {
    rx = W / 2 - rw / 2 + (1 - entra) * -W;
    ry = cy - bh / 2 - rh + 4;
    cx = W / 2 + (1 - entra) * W;
    area = W - 60;
  } else {
    rx = 70 + (1 - entra) * -500;
    ry = cy - rh / 2 - 20;
    cx = (rx + rw + 40 + W - 40) / 2 + (1 - entra) * 600;
    area = W - (rx + rw + 80);
  }
  // "soco" do retrato quando ele chega
  const ps = t > 0.22 ? 1 + 0.14 * Math.exp(-(t - 0.22) * 9) : 1;
  const pw = rw * ps, ph = rh * ps;
  ctx.save();
  ctx.shadowColor = e.cores[0];
  ctx.shadowBlur = 40;
  ctx.fillStyle = e.cores[0];
  caminhoArredondado(rx + rw / 2 - pw / 2 - 6, ry + rh / 2 - ph / 2 - 6, pw + 12, ph + 12, 24);
  ctx.fill();
  ctx.restore();
  desenharRetrato(img, rx + rw / 2 - pw / 2, ry + rh / 2 - ph / 2, pw, ph, { borda: '#fff', larguraBorda: 6, raio: 20 });

  const yNome = retrato ? cy - 20 : cy + 10;
  texto(`${p.nome.toUpperCase()}  •  ESPECIAL`, cx, yNome - (retrato ? 92 : 96), { tam: 30, fonte: FONTE_TITULO, alinha: 'center', cor: '#ffd166', maxW: area });

  // nome do golpe chega grande e quica ("mola")
  const kn = limitar((t - 0.2) / 0.5, 0, 1);
  if (kn > 0) {
    const z = 2.6 - 1.6 * elastico(kn), tam = retrato ? 92 : 104;
    ctx.save();
    ctx.globalAlpha *= limitar(kn * 5, 0, 1);
    ctx.translate(cx, yNome);
    ctx.rotate((1 - elastico(kn)) * -0.15);
    ctx.scale(z, z);
    texto(e.nome.toUpperCase(), 0, 0, { tam, fonte: FONTE_TITULO, alinha: 'center', cor: '#fff', contorno: e.cores[0], espessura: 28, sombra: false, maxW: area / z });
    texto(e.nome.toUpperCase(), 0, 0, { tam, fonte: FONTE_TITULO, alinha: 'center', cor: '#fff', contorno: '#10102a', espessura: 12, maxW: area / z });
    ctx.restore();
  }

  // frase "digitada" letra a letra
  const frase = (e.frase || '').trim();
  const nf = Math.floor((t - 0.6) * 45);
  if (frase && nf > 0) {
    const parte = [...frase].slice(0, nf).join('');
    const pronta = parte.length >= frase.length;
    texto(`“${parte}${pronta ? '”' : '▌'}`, cx, yNome + (retrato ? 70 : 74), { tam: retrato ? 40 : 42, alinha: 'center', cor: '#ffd166', maxW: area });
  }
  ctx.restore();
}

// ---------- HUD: barra ESPECIAL (abaixo da vida) e botão ★ (toque) ----------
function areaBarraEspecial() {
  return retrato ? { x: 100, y: 92, w: Math.round((W - 250) * 0.62), h: 14 } : { x: 100, y: 92, w: 300, h: 16 };
}

function desenharBarraEspecial() {
  const j = jogo, r = areaBarraEspecial(), cheia = j.especial >= 100;
  const cor = cheia ? (pisca(4) ? '#ffffff' : '#ffd166') : gradiente(r.y, r.y + r.h, [[0, '#ffc6e0'], [1, '#ff3d7f']]);
  barra(r.x, r.y, r.w, r.h, (j.especialMostrado || 0) / 100, j.especial / 100, cor, 'rgba(255,255,255,0.8)', false);
  const rotulo = cheia ? (modoToque ? 'PRONTO! ★' : 'PRONTO! ↓') : 'ESPECIAL';
  texto(rotulo, r.x + r.w + 10, r.y + r.h + 1, { tam: cheia ? 22 : 18, fonte: FONTE_TITULO, cor: cheia ? '#ffd166' : '#ff8fab' });
  if (cheia && tela === 'jogando') {
    const y = jogador.y - 215 * escalaJogador();
    texto(modoToque ? '★ ESPECIAL' : '↓ ESPECIAL', jogador.x, y, { tam: 24, fonte: FONTE_TITULO, alinha: 'center', cor: pisca(3) ? '#ffd166' : '#ffffff' });
  }
}

function desenharBotaoEspecial() {
  const b = BOTOES.esp, j = jogo, cheia = j.especial >= 100;
  ctx.save();
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fillStyle = cheia ? (pisca(3) ? 'rgba(255,61,127,0.75)' : 'rgba(255,209,102,0.65)') : (toque.esp ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)');
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * limitar((j.especialMostrado || 0) / 100, 0, 1));
  ctx.strokeStyle = cheia ? '#ffd166' : '#ff8fab';
  ctx.stroke();
  ctx.restore();
  texto('★', b.x, b.y + 2, { tam: 44, alinha: 'center', base: 'middle', cor: cheia ? '#ffffff' : 'rgba(255,255,255,0.55)', contorno: null, sombra: false });
}
