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

// Service worker: exigido pelo PWABuilder para gerar o app Android.
// Estratégia "rede primeiro": sempre busca a versão nova do jogo e só usa o
// cache quando estiver sem internet (evita o jogo.js antigo preso no cache).
const CACHE = 'info-team-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(['./', './index.html', './manifest.json']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // só arquivos do próprio jogo e as fontes do Google; o ranking passa direto
  const url = new URL(req.url);
  const fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (req.method !== 'GET' || (url.origin !== self.location.origin && !fonte)) return;

  e.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok || resp.type === 'opaque') {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return resp;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
