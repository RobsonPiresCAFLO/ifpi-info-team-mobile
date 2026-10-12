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
 *   rosto       → (opcional) recorte do rosto [x, y, lado] em frações da imagem,
 *                 para fotos em que o rosto aparece pequeno. Padrão: [0.12, 0.03, 0.76]
 *   disciplinas → palavras "boas" que caem durante o jogo quando ele é escolhido.
 *                 Se ficar vazia, usa a lista geral PALAVRAS_BOAS.
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
      'Golpe especial: “Busca Binária” — encontra qualquer coisa em O(log n)',
    ],
    disciplinas: ['Pilha', 'Fila', 'Lista Encadeada', 'Árvore AVL', 'Grafos', 'Hash', 'Recursão', 'Big O', 'Ordenação', 'Mat. Computacional'],
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
  },
  {
    nome: 'Elane Cristina', foto: 'assets/professores/Elane Cristina_manga.jpg', cor: '#3aa7ff',
    titulo: 'A Mestra da Lógica',
    habilidades: [
      'Algoritmos e Lógica de Programação: o primeiro “Olá, Mundo!” da turma',
      'Algoritmos e Programação: transforma problemas em passo a passo',
      'Golpe especial: “Teste de Mesa” — acha o erro antes de executar',
    ],
    disciplinas: ['Algoritmos', 'Lógica', 'Variáveis', 'Se / Senão', 'Laço Para', 'Enquanto', 'Vetores', 'Funções', 'Fluxograma', 'Pseudocódigo'],
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
  },
  {
    nome: 'Jair Freitas', foto: 'assets/professores/Jair Freitas_manga.jpg', cor: '#8d0801',
    titulo: 'O Filósofo da Informação',
    habilidades: [
      'Filosofia: pensamento crítico antes de qualquer linha de código',
      'Responsabilidade Social: tecnologia a serviço das pessoas',
      'Ética e Profissionalismo: competências para o mercado de trabalho',
      'Golpe especial: “Informação é Poder” — e poder exige responsabilidade',
    ],
    disciplinas: ['Ética', 'Filosofia', 'Pensamento Crítico', 'Responsabilidade Social', 'Profissionalismo', 'Competências', 'Mercado de Trabalho', 'Informação', 'Cidadania', 'Sociedade'],
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
  },
  {
    nome: 'Magno', foto: 'assets/professores/Magno_manga.jpg', cor: '#bc6c25', rosto: [0.28, 0.02, 0.42],
    titulo: 'O Líder Empreendedor',
    habilidades: [
      'Administração e Empreendedorismo: do plano de negócios à liderança',
      'Agenda dupla: concilia a sala de aula com a vida pública da cidade',
      'Golpe especial: “Atividade Extra” — a turma nunca fica parada',
      'Orientação de TCC: projetos que geram impacto na comunidade',
    ],
    disciplinas: ['Administração', 'Empreendedorismo', 'Liderança', 'Planejamento', 'Plano de Negócios', 'Gestão Pública', 'Marketing', 'Negociação', 'Comunidade', 'Projeto'],
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
  },
  {
    nome: 'Taianni', foto: 'assets/professores/Taianni_manga.jpg', cor: '#9d4edd',
    titulo: 'A Guardiã das Palavras',
    habilidades: [
      'Língua Portuguesa: escrita clara, coesa e sem erros',
      'Documentação de Sistemas: manuais que o usuário realmente entende',
      'Interpretação de Requisitos: lê nas entrelinhas o que o cliente quer',
      'Golpe especial: “Revisão Final” — nenhuma vírgula fora do lugar',
    ],
    disciplinas: ['Gramática', 'Coesão', 'Coerência', 'Redação', 'Manual do Usuário', 'Documentação', 'Requisitos', 'Interpretação', 'Ortografia', 'Concordância'],
  },
  {
    nome: 'Vanessa Veloso', foto: 'assets/professores/Vanessa Veloso_manga.jpg', cor: '#ff8fab',
    titulo: 'A Arquiteta de Software',
    habilidades: [
      'Engenharia de Software I e II: do requisito à entrega',
      'Análise e Projeto de Sistemas: modela tudo em UML',
      'Golpe especial: “Sprint Perfeita” — entrega no prazo, sem bugs',
    ],
    disciplinas: ['Requisitos', 'UML', 'Scrum', 'Kanban', 'Casos de Uso', 'Diagrama de Classes', 'Sprint', 'Git', 'Qualidade'],
  },
  {
    nome: 'Willamys Rangel', foto: 'assets/professores/Willamys Rangel_manga.jpg', cor: '#2b2d42',
    titulo: 'O Explorador de Tecnologias',
    habilidades: [
      'Tópicos Especiais em Programação: sempre com a tecnologia do momento',
      'Golpe especial: “Nova Stack” — aprende um framework por semana',
    ],
    disciplinas: ['Framework', 'Git', 'API', 'Docker', 'Clean Code', 'Refatoração', 'Deploy', 'TypeScript', 'Node.js'],
  },
];

// Fases: uma por ambiente da escola, na ordem em que são jogadas.
const FASES = [
  { nome: 'Entrada',        subtitulo: 'Primeiro dia de aula',      fundo: 'assets/cenarios/temp/entrada.jpg' },
  { nome: 'Área Verde',     subtitulo: 'Intervalo entre as aulas',  fundo: 'assets/cenarios/temp/area_verde1.jpg' },
  { nome: 'Estacionamento', subtitulo: 'Chegando em cima da hora!', fundo: 'assets/cenarios/temp/estacionamento.jpg' },
  { nome: 'Pátio',          subtitulo: 'Semana de provas',          fundo: 'assets/cenarios/temp/estacionamento2.jpg' },
  { nome: 'Garagem',        subtitulo: 'Visita técnica',            fundo: 'assets/cenarios/temp/garagem.jpg' },
  { nome: 'Bloco J',        subtitulo: 'Banca de TCC ao anoitecer', fundo: 'assets/cenarios/temp/bloco_j.jpg' },
];

// Itens bons: conteúdos dos cursos Técnico e de Graduação em TI.
const PALAVRAS_BOAS = [
  'HTML', 'CSS', 'JavaScript', 'PHP', 'Python', 'Java', 'SQL', 'MySQL',
  'Algoritmos', 'Lógica', 'Redes', 'TCP/IP', 'Linux', 'Git', 'POO',
  'Banco de Dados', 'UML', 'Scrum', 'API REST', 'Estrutura de Dados',
  'Sistemas Operacionais', 'Hardware', 'Segurança', 'Cloud', 'IA',
  'Eng. de Software', 'Docker', 'Laravel', 'React', 'Mobile', 'Testes',
  'LGPD', 'Empreendedorismo', 'Mat. Discreta', 'Compiladores', 'Kanban',
  'Arquitetura', 'Front-end', 'Back-end', 'Wi-Fi 6', 'Cibersegurança',
];

// Itens ruins: tudo o que atrapalha a vida de quem estuda TI.
const COISAS_RUINS = [
  'BUG', 'Erro 404', 'Segfault', 'NullPointer', 'Loop infinito',
  'Tela azul', 'Merge conflict', 'Ctrl+C Ctrl+V', 'Prazo estourado',
  'Wi-Fi caiu', 'Vírus', 'Senha 123456', 'Plágio', 'Falta de energia',
  'Deploy na sexta', 'Stack Overflow fora', 'Ponto e vírgula esquecido',
];
