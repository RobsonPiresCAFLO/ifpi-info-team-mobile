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

/*
 * DADOS DO JOGO — edite aqui!
 *
 * Para cada professor:
 *   nome        → aparece na tela de seleção e no HUD
 *   foto        → retrato em estilo anime (pasta assets/professores)
 *   cor         → cor do uniforme do personagem e dos destaques
 *   titulo      → frase curta abaixo do nome (ex.: "O Mestre dos Algoritmos")
 *   habilidades → lista exibida no painel ao passar o cursor sobre o professor
 *                 (o golpe especial aparece sozinho no fim da lista: ver ESPECIAIS)
 *   rosto       → (opcional) recorte do rosto [x, y, lado] em frações da imagem,
 *                 para fotos em que o rosto aparece pequeno. Padrão: [0.12, 0.03, 0.76]
 *   disciplinas → palavras "boas" que caem durante o jogo quando ele é escolhido.
 *                 Se ficar vazia, usa a lista geral PALAVRAS_BOAS.
 *                 Peso: 70% das palavras boas vêm daqui; 30% da lista geral.
 *   armadilhas  → itens VERMELHOS ligados ao professor (o que mais atrapalha na matéria dele).
 *                 Peso: 40% dos vermelhos vêm daqui; 60% da lista geral COISAS_RUINS.
 *
 * Exemplo:
 *   titulo: 'O Arquiteto dos Dados',
 *   habilidades: ['Banco de Dados nível lendário', 'Invoca JOINs triplos sem suar'],
 *   disciplinas: ['SQL', 'JOIN', 'Normalização', 'MySQL'],
 */
const PROFESSORES = [
  {
    nome: 'André Castro', foto: 'assets/professores/André Castro_manga.jpg', cor: '#ff6b35',
    titulo: 'O Arquiteto das Estruturas',
    habilidades: [
      'Estrutura de Dados I e II: empilha, enfileira e balanceia árvores sem suar',
      'Matemática Computacional: resolve contas antes do compilador terminar',
    ],
    disciplinas: ['Pilha', 'Fila', 'Lista Encadeada', 'Árvore AVL', 'Grafos', 'Hash', 'Recursão', 'Big O', 'Ordenação', 'Mat. Computacional'],
    armadilhas: ['Pilha estourou', 'Fila furada', 'Árvore torta', 'O(n²)', 'Recursão sem fim', 'Divisão por zero'],
  },
  {
    nome: 'Cicero Eduardo Walter', foto: 'assets/professores/Cicero Eduardo Walter_manga.jpg', cor: '#8d99ae',
    titulo: 'O Estrategista dos Negócios',
    habilidades: [
      'Empreendedorismo: transforma qualquer ideia em plano de negócios',
      'Administração da Produção: otimiza processos como ninguém',
      'Ética Profissional e Cidadania: escudo contra plágio e atalhos',
      'Mercado de Trabalho: prepara a turma para o mundo lá fora',
    ],
    disciplinas: ['Empreendedorismo', 'Ética', 'Cidadania', 'Plano de Negócios', 'Mercado', 'Produção', 'Gestão', 'Inovação', 'Carreira'],
    armadilhas: ['Paper rejeitado', 'Sem referência', 'Sem DOI', 'Plágio', 'Prazo da revista', 'Sem plano'],
  },
  {
    nome: 'Elane Cristina', foto: 'assets/professores/Elane Cristina_manga.jpg', cor: '#3aa7ff',
    titulo: 'A Mestra da Lógica',
    habilidades: [
      'Algoritmos e Lógica de Programação: o primeiro “Olá, Mundo!” da turma',
      'Algoritmos e Programação: transforma problemas em passo a passo',
    ],
    disciplinas: ['Algoritmos', 'Lógica', 'Variáveis', 'Se / Senão', 'Laço Para', 'Enquanto', 'Vetores', 'Funções', 'Fluxograma', 'Pseudocódigo'],
    armadilhas: ['Erro de sintaxe', 'Não compila', 'Laço infinito', 'Variável sem valor', 'Senão sem Se', 'Índice fora do vetor'],
  },
  {
    nome: 'Francisco Eduardo', foto: 'assets/professores/Francisco Eduardo_manga.jpg', cor: '#e63946',
    titulo: 'O Guardião do Sistema',
    habilidades: [
      'Sistemas Operacionais: domina processos, threads e escalonamento',
      'Interação Humano-Computador: cria telas que o usuário entende',
      'Projeto Integrador: junta todas as disciplinas num só projeto',
    ],
    disciplinas: ['Sistemas Operacionais', 'Processos', 'Threads', 'Escalonamento', 'Memória', 'IHC', 'Usabilidade', 'Protótipo', 'Projeto Integrador'],
    armadilhas: ['Deadlock', 'Kernel panic', 'Tela confusa', 'Botão escondido', 'Sem protótipo', 'Starvation'],
  },
  {
    nome: 'Jair Freitas', foto: 'assets/professores/Jair Freitas_manga.jpg', cor: '#8d0801',
    titulo: 'O Filósofo da Informação',
    habilidades: [
      'Filosofia: pensamento crítico antes de qualquer linha de código',
      'Responsabilidade Social: tecnologia a serviço das pessoas',
      'Ética e Profissionalismo: competências para o mercado de trabalho',
    ],
    disciplinas: ['Ética', 'Filosofia', 'Pensamento Crítico', 'Responsabilidade Social', 'Profissionalismo', 'Competências', 'Mercado de Trabalho', 'Informação', 'Cidadania', 'Sociedade'],
    armadilhas: ['Fake news', 'Falácia', 'Achismo', 'Senso comum', 'Sofisma', 'Antiético'],
  },
  {
    nome: 'Justino', foto: 'assets/professores/Justino_manga.jpg', cor: '#2ec4b6',
    titulo: 'O Senhor dos Dados',
    habilidades: [
      'Banco de Dados: invoca SELECTs e JOINs com precisão cirúrgica',
      'Desenvolvimento Orientado a Testes: escreve o teste antes do código',
      'Programação Orientada a Objetos II e Tópicos Especiais em Programação',
    ],
    disciplinas: ['SQL', 'SELECT', 'JOIN', 'Modelo ER', 'Normalização', 'Chave Primária', 'TDD', 'Teste Unitário', 'POO', 'Herança'],
    armadilhas: ['SELECT *', 'DELETE sem WHERE', 'Sem chave primária', 'Dado duplicado', 'Teste vermelho', 'Tabela sem índice'],
  },
  {
    nome: 'Leandro Rodrigues', foto: 'assets/professores/Leandro Rodrigues_manga.jpg', cor: '#5e548e',
    titulo: 'O Doutor da Metodologia',
    habilidades: [
      'Metodologia Científica: problema, objetivos e método no lugar certo',
      'Design Science Research: projetos de TI viram artefatos com rigor científico',
      'Administração: une gestão e tecnologia para resolver problemas reais',
      'Doutor e PhD: orienta TCCs do problema à avaliação do artefato',
    ],
    disciplinas: ['Metodologia', 'Design Science', 'Artefato', 'Problema', 'Objetivos', 'Hipótese', 'Referencial Teórico', 'ABNT', 'Avaliação', 'Administração'],
    armadilhas: ['Sem hipótese', 'Sem metodologia', 'Fora da ABNT', 'Referência perdida', 'Viés', 'Conclusão sem dados'],
  },
  {
    nome: 'Magno', foto: 'assets/professores/Magno_manga.jpg', cor: '#bc6c25', rosto: [0.28, 0.02, 0.42],
    titulo: 'O Líder Empreendedor',
    habilidades: [
      'Administração e Empreendedorismo: do plano de negócios à liderança',
      'Agenda dupla: concilia a sala de aula com a vida pública da cidade',
      'Orientação de TCC: projetos que geram impacto na comunidade',
    ],
    disciplinas: ['Administração', 'Empreendedorismo', 'Liderança', 'Planejamento', 'Plano de Negócios', 'Gestão Pública', 'Marketing', 'Negociação', 'Comunidade', 'Projeto'],
    armadilhas: ['Burocracia', 'Prejuízo', 'Sem planejamento', 'Reunião sem pauta', 'Falência', 'Sem liderança'],
  },
  {
    nome: 'Marcony Santana', foto: 'assets/professores/Marcony Santana_manga.jpg', cor: '#4361ee',
    titulo: 'O Senhor das Redes',
    habilidades: [
      'Redes de Computadores: conecta tudo, do cabo à nuvem',
      'Protocolos de Aplicação: fala HTTP, DNS e SMTP fluentemente',
      'Arquitetura de Computadores: conhece a máquina por dentro',
      'Extensão Curricular: leva a TI para a comunidade',
    ],
    disciplinas: ['TCP/IP', 'Modelo OSI', 'Roteador', 'Switch', 'DNS', 'HTTP', 'Endereço IP', 'CPU', 'Memória RAM', 'Extensão'],
    armadilhas: ['Ping 999 ms', 'IP duplicado', 'DNS fora', 'Cabo rompido', 'Pacote perdido', 'Loop de rede'],
  },
  {
    nome: 'Paulo Ferreira', foto: 'assets/professores/Paulo Ferreira_manga.jpg', cor: '#06a77d',
    titulo: 'O Tradutor do Código',
    habilidades: [
      'Inglês Técnico: decifra documentação, manuais e mensagens de erro',
      'Mostra que todo código fala inglês: if, for, while, return',
      'Prepara os calouros para ler em inglês desde o início do curso',
      'Orientação de TCC: revisa o abstract e as referências internacionais',
    ],
    disciplinas: ['Reading', 'Vocabulary', 'Grammar', 'Cognatos', 'Skimming', 'Scanning', 'Abstract', 'Keywords', 'Documentation', 'Listening'],
    armadilhas: ['Falso cognato', 'Tradutor literal', 'Typo', 'Sem vocabulário', 'Abstract errado', 'Pronúncia errada'],
  },
  {
    nome: 'Rafael Leite', foto: 'assets/professores/Rafael-Leite_manga.jpg', cor: '#22223b',
    titulo: 'O Visionário da Inovação',
    habilidades: [
      'Tecnologias Inovadoras: sempre um passo à frente das tendências',
      'Processos Gerenciais e Logística Empresarial: organiza qualquer caos',
      'Elaboração de Projeto de Pesquisa: do problema à metodologia',
      'Planejamento Extensionista e Curricularização da Extensão',
    ],
    disciplinas: ['Inovação', 'Startup', 'Logística', 'Processos', 'Pesquisa', 'Metodologia', 'Extensão', 'Gestão', 'Projeto'],
    armadilhas: ['Pitch ruim', 'Sem MVP', 'Gargalo', 'Estoque parado', 'Ideia sem teste', 'Sem extensão'],
  },
  {
    nome: 'Rennê', foto: 'assets/professores/Rennê_manga.jpg', cor: '#6c757d',
    titulo: 'O Engenheiro Multiplataforma',
    habilidades: [
      'Programação para Dispositivos Móveis: apps na palma da mão',
      'Engenharia de Software III e Análise e Projeto de Sistemas',
      'Informática Aplicada à Engenharia e TICs na Construção Civil',
      'Fundamentos de Informática: a base para todo o resto',
    ],
    disciplinas: ['Mobile', 'Android', 'App', 'UML', 'Requisitos', 'Casos de Uso', 'TIC', 'Planilha', 'Eng. de Software'],
    armadilhas: ['App travou', 'Requisito vago', 'Bateria 1%', 'Build falhou', 'Escopo infinito', 'Sem caso de uso'],
  },
  {
    nome: 'Robson Borges', foto: 'assets/professores/Robson Borges_manga.jpg', cor: '#3d348b',
    titulo: 'O Mestre Full Stack',
    habilidades: [
      'Programação Web Back-End: servidores, APIs e PHP sob controle',
      'Introdução à Programação Web: HTML, CSS e JavaScript desde o zero',
      'Banco de Dados II: consultas avançadas e dados bem guardados',
      'Prática e Gerência de Redes e Fundamentos de Redes e Internet',
    ],
    disciplinas: ['HTML', 'CSS', 'JavaScript', 'PHP', 'API REST', 'Back-End', 'MySQL', 'Stored Procedure', 'Servidor Web', 'Redes'],
    armadilhas: ['Erro 500', 'CORS bloqueado', 'SQL Injection', 'undefined', 'Não testou', 'Senha em texto puro'],
  },
  {
    nome: 'Robson Freitas', foto: 'assets/professores/Robson Freitas_manga.jpg', cor: '#1d7874',
    titulo: 'O Treinador de Máquinas',
    habilidades: [
      'Inteligência Artificial: ensina as máquinas a pensar',
      'Programação para Dispositivos Móveis e Desenvolvimento Web Front-End',
      'Introdução à Computação: abre as portas da TI para os calouros',
      'Informática Aplicada à Eletromecânica',
    ],
    disciplinas: ['IA', 'Machine Learning', 'Rede Neural', 'Mobile', 'Front-End', 'React', 'Interface', 'Computação', 'Dataset'],
    armadilhas: ['Overfitting', 'IA alucinando', 'Dataset sujo', 'Layout quebrado', 'Viés no modelo', 'Tela travada'],
  },
  {
    nome: 'Rogério Sousa', foto: 'assets/professores/Rogerio Sousa_manga.jpg', cor: '#7209b7',
    titulo: 'O Calculista das Probabilidades',
    habilidades: [
      'Cálculo: limites, derivadas e integrais que viram ferramenta de programador',
      'Estatística: média, desvio padrão e probabilidade para entender os dados',
      'Prepara os calouros com a base matemática do início do curso',
      'Orientação de TCC: põe números, gráficos e análise nos resultados',
    ],
    disciplinas: ['Limite', 'Derivada', 'Integral', 'Função', 'Média', 'Mediana', 'Desvio Padrão', 'Probabilidade', 'Amostra', 'Gráfico'],
    armadilhas: ['Divisão por zero', 'Amostra viciada', 'Outlier', 'Sinal trocado', 'Limite indefinido', 'Média enganosa'],
  },
  {
    nome: 'Ronaldo Borges', foto: 'assets/professores/Ronaldo Borges_manga.jpg', cor: '#212529',
    titulo: 'O Mago dos Objetos',
    habilidades: [
      'Programação Orientada a Objetos: classes, herança e polimorfismo',
      'Programação para Internet I e II: sistemas web do início ao fim',
      'Desenvolvimento para Internet das Coisas: faz até a geladeira programar',
      'Tópicos Especiais em Inovação',
    ],
    disciplinas: ['Classe', 'Objeto', 'Herança', 'Polimorfismo', 'Encapsulamento', 'IoT', 'Arduino', 'Sensores', 'Framework', 'Web'],
    armadilhas: ['Classe Deus', 'Código espaguete', 'Sensor queimado', 'Curto-circuito', 'Herança confusa', 'Acoplamento'],
  },
  {
    nome: 'Silvino Marques', foto: 'assets/professores/Silvino Marques_manga.jpg', cor: '#f77f00',
    titulo: 'O Escudo da Segurança',
    habilidades: [
      'Segurança da Informação: bloqueia vírus, golpes e senhas fracas',
      'Manutenção de Computadores: ressuscita qualquer máquina',
      'Infraestrutura Computacional e Suporte Técnico sempre de prontidão',
    ],
    disciplinas: ['Firewall', 'Criptografia', 'Backup', 'Antivírus', 'Senha Forte', 'Hardware', 'Placa-mãe', 'Formatação', 'Suporte'],
    armadilhas: ['Phishing', 'Ransomware', 'Sem backup', 'HD queimado', 'Superaquecimento', 'Senha 123456'],
  },
  {
    nome: 'Taianni', foto: 'assets/professores/Taianni_manga.jpg', cor: '#9d4edd',
    titulo: 'A Guardiã das Palavras',
    habilidades: [
      'Língua Portuguesa: escrita clara, coesa e sem erros',
      'Documentação de Sistemas: manuais que o usuário realmente entende',
      'Interpretação de Requisitos: lê nas entrelinhas o que o cliente quer',
    ],
    disciplinas: ['Gramática', 'Coesão', 'Coerência', 'Redação', 'Manual do Usuário', 'Documentação', 'Requisitos', 'Interpretação', 'Ortografia', 'Concordância'],
    armadilhas: ['Erro de crase', 'Mas ou mais?', 'Vírgula errada', 'Ambiguidade', 'Texto sem coesão', 'Erro de concordância'],
  },
  {
    nome: 'Vanessa Veloso', foto: 'assets/professores/Vanessa Veloso_manga.jpg', cor: '#ff8fab',
    titulo: 'A Arquiteta de Software',
    habilidades: [
      'Engenharia de Software I e II: do requisito à entrega',
      'Análise e Projeto de Sistemas: modela tudo em UML',
    ],
    disciplinas: ['Requisitos', 'UML', 'Scrum', 'Kanban', 'Casos de Uso', 'Diagrama de Classes', 'Sprint', 'Git', 'Qualidade'],
    armadilhas: ['Requisito mudou', 'Sprint atrasada', 'Escopo inflado', 'Card esquecido', 'Sem daily', 'Commit "ajustes"'],
  },
  {
    nome: 'Willamys Rangel', foto: 'assets/professores/Willamys Rangel_manga.jpg', cor: '#2b2d42',
    titulo: 'O Explorador de Tecnologias',
    habilidades: [
      'Tópicos Especiais em Programação: sempre com a tecnologia do momento',
    ],
    disciplinas: ['Framework', 'Git', 'API', 'Docker', 'Clean Code', 'Refatoração', 'Deploy', 'TypeScript', 'Node.js'],
    armadilhas: ['Deploy quebrado', 'Código legado', 'Gambiarra', 'Dependência quebrada', 'node_modules', 'Merge conflict'],
  },
];

/*
 * PODER ESPECIAL de cada professor — edite aqui!
 * A barra ESPECIAL enche com os acertos (mais rápido com combo). Cheia, o jogador
 * aperta ↓ (ou S, E, L) ou toca no botão ★: todos os itens vermelhos são destruídos,
 * os conteúdos na tela são coletados e o Conhecimento sobe (pode fechar a fase).
 *
 *   nome     → nome do golpe (aparece grande na cena do especial)
 *   frase    → frase de efeito ('' = sem frase)
 *   estilo   → como os itens vermelhos são destruídos:
 *              'disparo'  símbolos saem do professor     'chuva'    caem do céu
 *              'raios'    raios do céu                   'onda'     onda de energia
 *              'ciclone'  redemoinho de símbolos         'organiza' os itens se alinham e somem
 *              'robos'    mini robôs saem dos lados      'magica'   somem num passe de mágica
 *   forma    → desenho dos símbolos: 'texto', 'balao', 'postit' ou 'chip'
 *   simbolos → textos/emojis usados no golpe
 *   cores    → cores do efeito (a 1ª é a principal)
 *   som      → 'matematica', 'guitarra', 'bips', 'conversa', 'filosofia', 'ciclone',
 *              'organiza', 'animado', 'rock', 'acelerada', 'magica', 'raios',
 *              'complexo', 'robo', 'eletronico', 'pagina', 'kanban' ou 'sino'
 *   some     → true: o professor fica invisível durante o golpe
 * Professor sem entrada aqui usa o título como nome do golpe e a cor dele.
 */
const ESPECIAIS = {
  'André Castro': {
    nome: 'FX!', frase: 'Eu acho é pouco', estilo: 'disparo', forma: 'texto', som: 'matematica',
    simbolos: ['∑', '∫', 'lim', 'log', 'π', '√', '∞', 'f(x)', 'Δ'], cores: ['#ff6b35', '#ffd166', '#ffffff'],
  },
  'Cicero Eduardo Walter': {
    nome: 'Publish', frase: 'Iron Maiden!', estilo: 'raios', forma: 'texto', som: 'guitarra',
    simbolos: ['🤘', 'IEEE', 'Scopus', 'DOI', 'Paper', 'Citação'], cores: ['#e63946', '#ffd166', '#8d99ae'],
  },
  'Elane Cristina': {
    nome: 'Beleza no Algoritmo', frase: 'Compile!', estilo: 'chuva', forma: 'texto', som: 'bips',
    simbolos: ['0', '1', '01', '10', '101', '0110', '1001'], cores: ['#3aa7ff', '#7dffb3', '#ffffff'],
  },
  'Francisco Eduardo': {
    nome: 'UX/UI', frase: '@#!$%$&', estilo: 'disparo', forma: 'balao', som: 'conversa',
    simbolos: ['Na verdade...', 'E a usabilidade?', 'Cadê o protótipo?', '@#!$%&', 'Mais um ponto...', 'Refaça!', 'UX!', 'UI!'],
    cores: ['#e63946', '#3aa7ff', '#10102a'],
  },
  'Jair Freitas': {
    nome: 'Penso, logo existo', frase: 'Ha ha ha ha!', estilo: 'disparo', forma: 'texto', som: 'filosofia',
    simbolos: ['📚', 'Platão', 'Sócrates', 'Kant', '?', 'Ética', 'Logos'], cores: ['#8d0801', '#ffd166', '#ffffff'],
  },
  'Justino': {
    nome: 'Modelagem', frase: 'Peste atenção!', estilo: 'ciclone', forma: 'chip', som: 'ciclone',
    simbolos: ['ER', 'PK', 'FK', '1:N', 'N:M', 'DB'], cores: ['#2ec4b6', '#caf0f8', '#ffd166'],
  },
  'Leandro Rodrigues': {
    nome: 'Método Científico', frase: 'Organize', estilo: 'organiza', forma: 'texto', som: 'organiza',
    simbolos: ['✔', 'Hipótese', 'Método', 'Dados', 'Conclusão'], cores: ['#5e548e', '#e0e1dd', '#7dffb3'],
  },
  'Magno': {
    nome: 'Invisibilidade', frase: 'Tem feira!', estilo: 'disparo', forma: 'texto', som: 'animado', some: true,
    simbolos: ['✈', '🧳', '📍', 'Feira!', '✈'], cores: ['#bc6c25', '#ffd166', '#ffffff'],
  },
  'Marcony Santana': {
    nome: 'Sextou!', frase: "Rock n' Roll", estilo: 'disparo', forma: 'texto', som: 'rock',
    simbolos: ['♪', '♫', '♬', '🎤', '🎸', '🤘'], cores: ['#4361ee', '#ffd166', '#ffffff'],
  },
  'Paulo Ferreira': {
    nome: 'Goodbye!', frase: 'Read, Write, Execute!', estilo: 'disparo', forma: 'balao', som: 'guitarra',
    simbolos: ['Goodbye!', 'Read', 'Write', 'Execute', 'Hello!', 'Bye bye!', '🎸'], cores: ['#06a77d', '#ffd166', '#10102a'],
  },
  'Rafael Leite': {
    nome: 'Startup!', frase: 'Inovação!', estilo: 'disparo', forma: 'texto', som: 'acelerada',
    simbolos: ['🚀', '💡', '⚙', 'MVP', 'Pitch', '</>'], cores: ['#4cc9f0', '#ffd166', '#ffffff'],
  },
  'Rennê': {
    nome: 'Randomize', frase: 'Barba!', estilo: 'magica', forma: 'texto', som: 'magica', some: true,
    simbolos: ['✨', '?', 'rand()', '🎲', '✦'], cores: ['#c77dff', '#ffd166', '#ffffff'],
  },
  'Robson Borges': {
    nome: 'Web', frase: 'Estude, teste!', estilo: 'raios', forma: 'texto', som: 'raios',
    simbolos: ['⚡', '</>', '{ }', 'PHP', 'JS', 'SQL'], cores: ['#ffe66d', '#7b6cf6', '#ffffff'],
  },
  'Robson Freitas': {
    nome: 'Anima!', frase: 'Bora!', estilo: 'onda', forma: 'texto', som: 'animado',
    simbolos: ['⚡', '★', '✦'], cores: ['#2ec4b6', '#7dffb3', '#ffffff'],
  },
  'Rogério Sousa': {
    nome: 'Olha', frase: 'Resolve!', estilo: 'disparo', forma: 'texto', som: 'complexo',
    simbolos: ['P(A)', 'σ', 'μ', 'n!', '∑', '%', 'x̄', '∫'], cores: ['#c77dff', '#f2e9ff', '#ffd166'],
  },
  'Ronaldo Borges': {
    nome: 'Bot', frase: '', estilo: 'robos', forma: 'texto', som: 'robo',
    simbolos: ['Arduino', 'IoT', '⚙'], cores: ['#00b4d8', '#ffd166', '#7dffb3'],
  },
  'Silvino Marques': {
    nome: 'Hardware', frase: 'É o seguinte:', estilo: 'disparo', forma: 'chip', som: 'eletronico',
    simbolos: ['CPU', 'RAM', 'SSD', 'GPU', 'BIOS', 'USB'], cores: ['#f77f00', '#2ec4b6', '#ffd166'],
  },
  'Taianni': {
    nome: 'Revisão Final', frase: 'Olha a semântica', estilo: 'disparo', forma: 'texto', som: 'pagina',
    simbolos: ['📖', 'coesão', 'coerência', 'semântica', 'sintaxe', 'crase'], cores: ['#c77dff', '#ffffff', '#ffd166'],
  },
  'Vanessa Veloso': {
    nome: 'Codex', frase: 'Daily', estilo: 'disparo', forma: 'postit', som: 'kanban',
    simbolos: ['TO DO', 'DOING', 'DONE', 'UML', 'Sprint', 'Daily'], cores: ['#ff8fab', '#ffd166', '#7dffb3', '#a0c4ff'],
  },
  'Willamys Rangel': {
    nome: 'Direção', frase: 'Bora galera!', estilo: 'disparo', forma: 'chip', som: 'sino',
    simbolos: ['SELECT', 'JOIN', 'PK', 'SQL', 'O(n)', 'if'], cores: ['#8ecae6', '#ffd166', '#ffffff'],
  },
};

// Fases: uma por ambiente da escola, na ordem em que são jogadas.
const FASES = [
  { nome: 'Entrada',        subtitulo: 'Primeiro dia de aula',      fundo: 'assets/cenarios/temp/entrada.jpg' },
  { nome: 'Área Verde',     subtitulo: 'Intervalo entre as aulas',  fundo: 'assets/cenarios/temp/area_verde1.jpg' },
  { nome: 'IFPI Tower', subtitulo: 'Chegando em cima da hora!', fundo: 'assets/cenarios/temp/estacionamento.jpg' },
  { nome: 'Estacionamento', subtitulo: 'Estacione na sombra',      fundo: 'assets/cenarios/temp/estacionamento2.jpg' },
  { nome: 'Garagem do Buzão', subtitulo: 'Visita técnica', fundo: 'assets/cenarios/temp/garagem.jpg' },
  { nome: 'Bloco J',        subtitulo: 'Prática no Lab J18', fundo: 'assets/cenarios/temp/bloco_j.jpg' },
];

// Itens bons: conteúdos dos cursos Técnico e de Graduação em TI.
const PALAVRAS_BOAS = [
  'HTML', 'CSS', 'JavaScript', 'PHP', 'Python', 'Java', 'SQL', 'MySQL',
  'Algoritmos', 'Lógica', 'Redes', 'TCP/IP', 'Linux', 'Git', 'POO',
  'Banco de Dados', 'UML', 'Scrum', 'API REST', 'Estrutura de Dados',
  'Sistemas Operacionais', 'Hardware', 'Segurança', 'Cloud', 'IA',
  'Eng. de Software', 'Docker', 'Laravel', 'React', 'Mobile', 'Testes', 'Django',
  'LGPD', 'Empreendedorismo', 'Mat. Discreta', 'Compiladores', 'Kanban',
  'Arquitetura', 'Front-end', 'Back-end', 'Wi-Fi 6', 'Cibersegurança', 'PostgreSQL',
];

// Itens ruins: tudo o que atrapalha a vida de quem estuda TI.
const COISAS_RUINS = [
  'BUG', 'Erro 404', 'Segfault', 'NullPointer', 'Loop infinito',
  'Tela azul', 'Merge conflict', 'Ctrl+C Ctrl+V', 'Prazo estourado',
  'Wi-Fi caiu', 'Vírus', 'Senha 123456', 'Plágio', 'Falta de energia',
  'Deploy na sexta', 'Stack Overflow fora', 'Ponto e vírgula esquecido',
];
