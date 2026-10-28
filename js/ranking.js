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
//  RANKING ONLINE — Google Planilhas + Apps Script
// ============================================================
// Cole aqui a URL do "Aplicativo da Web" publicado no Apps Script
// (passo a passo em servidor/COMO-CONFIGURAR.md). Vazia = ranking desligado.
const URL_RANKING = 'https://script.google.com/macros/s/AKfycbwe-5zNOfGbfh02iHPrF93LYcF2_ndHeO9P8O8882VcXj7K-0TQw-oBb0uq9IrYd9Dx/exec';
const VERSAO_JOGO = 'v3';

const Ranking = (() => {
  const CHAVE_PENDENTES = 'ifpi-info-team-pendentes';
  const CHAVE_APELIDO = 'ifpi-info-team-apelido';
  const SAL = 'ifpi-floriano-info-team-2026';   // o servidor confere a mesma assinatura
  const ativo = URL_RANKING.startsWith('https://');
  let cache = null, cacheEm = 0;

  // Assinatura simples (djb2): não impede fraude, só barra envios feitos "na mão".
  function assinar(d) {
    const s = `${SAL}|${d.apelido}|${d.professor}|${d.pontos}`;
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  // POST com corpo em texto puro: é uma "requisição simples", sem preflight de CORS.
  async function chamar(dados) {
    const ctrl = new AbortController();
    const prazo = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(URL_RANKING, { method: 'POST', body: JSON.stringify(dados), signal: ctrl.signal });
      return await r.json();
    } finally {
      clearTimeout(prazo);
    }
  }

  // ---------- Fila offline: o que falhou é reenviado quando o jogo abrir de novo ----------
  function lerPendentes() {
    try { return JSON.parse(localStorage.getItem(CHAVE_PENDENTES)) || []; } catch { return []; }
  }
  function gravarPendentes(lista) {
    try { localStorage.setItem(CHAVE_PENDENTES, JSON.stringify(lista.slice(-30))); } catch { /* sem storage */ }
  }
  function guardarPendente(dados) {
    gravarPendentes([...lerPendentes(), dados]);
  }
  async function reenviarPendentes() {
    const lista = lerPendentes();
    if (!ativo || !lista.length) return;
    gravarPendentes([]);
    const falharam = [];
    for (const d of lista) {
      try { await chamar(d); } catch { falharam.push(d); }   // recusado pelo servidor: descarta
    }
    if (falharam.length) gravarPendentes([...falharam, ...lerPendentes()]);
  }

  // ---------- Apelido ----------
  const limparApelido = (t) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, 16);
  function validarApelido(a) {
    if (a.length < 3) return 'O apelido precisa de pelo menos 3 letras.';
    if (!/^[\p{L}\p{N}][\p{L}\p{N} _.\-]*$/u.test(a)) return 'Comece com letra ou número e use só letras, números, espaço, _ . ou -';
    return '';
  }
  function ultimoApelido() {
    try { return localStorage.getItem(CHAVE_APELIDO) || ''; } catch { return ''; }
  }

  // ---------- API ----------
  // Resposta: { ok: true, posicao } | { ok: false, erro } (recusado) | { ok: false, offline: true }
  async function enviarPontuacao({ apelido, professor, pontos, maxCombo }) {
    const dados = { tipo: 'pontuacao', apelido, professor, pontos: Math.floor(pontos), maxCombo, versao: VERSAO_JOGO };
    dados.assinatura = assinar(dados);
    try { localStorage.setItem(CHAVE_APELIDO, apelido); } catch { /* sem storage */ }
    try {
      const r = await chamar(dados);
      if (r.ok) cache = null;
      return r;
    } catch {
      guardarPendente(dados);
      return { ok: false, offline: true };
    }
  }

  // Conta as escolhas de personagem (sem esperar resposta).
  function registrarEscolha(professor) {
    if (!ativo) return;
    const dados = { tipo: 'escolha', professor, versao: VERSAO_JOGO };
    chamar(dados).then(() => { cache = null; }).catch(() => guardarPendente(dados));
  }

  // { jogadores: [{ apelido, professor, pontos, data }], personagens: [{ professor, escolhas, zeradas }] }
  async function carregar() {
    if (cache && performance.now() - cacheEm < 20000) return cache;
    const ctrl = new AbortController();
    const prazo = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(`${URL_RANKING}?acao=ranking`, { signal: ctrl.signal });
      const d = await r.json();
      if (!d.ok) throw new Error(d.erro || 'falha');
      cache = d;
      cacheEm = performance.now();
      return d;
    } finally {
      clearTimeout(prazo);
    }
  }

  if (ativo) setTimeout(reenviarPendentes, 3000);

  return { ativo, limparApelido, validarApelido, ultimoApelido, enviarPontuacao, registrarEscolha, carregar };
})();
