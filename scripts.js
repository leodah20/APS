/**
 * EcoFuturo — scripts.js
 * Lógica interativa do site sobre Energias Renováveis no Brasil.
 * Disciplina: Programação Web Responsiva (PWR) — APS 2026/1 — UNIP
 * Aluno: Leonardo Cordeiro Sutil — RA: N0368J0
 *
 * Módulos presentes neste arquivo:
 *  1. Sistema de abas (tab switching)
 *  2. Simulador de Viabilidade Solar Residencial
 *  3. Quiz interativo sobre energias renováveis
 *  4. Gráfico da evolução da matriz elétrica brasileira (Chart.js)
 *  5. Calculadora de Pegada de Carbono
 *  6. Toast de boas-vindas (evento load)
 *  7. Accordion de perguntas frequentes (evento onclick)
 *  8. Efeito hover nos cards (eventos onmouseover / onmouseout)
 *  9. Validação e envio do formulário de contato via Formspree (Fetch API)
 */

/* ==========================================================================
   1. SISTEMA DE ABAS
   Controla qual painel fica visível na página de ferramentas.
   Usa classes CSS (.active) para mostrar/ocultar painéis sem recarregar a página.
   ========================================================================== */

/**
 * Ativa a aba selecionada e desativa todas as outras.
 * O quiz é inicializado apenas na primeira vez que a aba é aberta
 * para evitar reiniciar a partida ao trocar de aba e voltar.
 *
 * @param {string} id  - Identificador da aba ('co2', 'solar' ou 'quiz')
 * @param {Element} btn - Botão clicado, que receberá a classe .active
 */
function abrirTab(id, btn) {
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('tab-' + id).classList.add('active');
    btn.classList.add('active');

    // Inicializa o quiz apenas se o container ainda estiver vazio (primeira abertura)
    if (id === 'quiz') {
        var c = document.getElementById('quiz-container');
        if (c && c.innerHTML === '') iniciarQuiz();
    }
}

/* ==========================================================================
   2. SIMULADOR DE VIABILIDADE SOLAR RESIDENCIAL
   Calcula se vale a pena instalar energia solar com base no estado do usuário
   (irradiação real) e no valor da conta de luz.

   Fórmulas utilizadas (baseadas em metodologia da ABSOLAR e EPE):
   - consumo (kWh)   = conta / preço médio kWh no Brasil (R$ 0,85)
   - geração/kWp/mês = irradiação_diária × 30 dias × 0,75 (performance ratio)
   - kWp necessário  = consumo / geração por kWp
   - painéis (550 W) = ceil(kWp / 0,55)
   - custo estimado  = kWp_real × R$ 4.800 (média mercado 2024/2025)
   - payback         = custo / (economia_mensal × 12)
   - CO₂ evitado     = consumo × 0,08 kg/kWh (fator médio da rede brasileira)
   ========================================================================== */

/**
 * Irradiação solar média diária por estado (kWh/m²/dia).
 * Fonte: Atlas Brasileiro de Energia Solar — INPE / CRESESB (2023).
 * O Nordeste lidera devido ao regime de ventos e menor nebulosidade.
 */
var irradiacao = {
    AC:5.0, AL:5.5, AM:5.2, AP:5.3, BA:5.7, CE:6.0, DF:5.7, ES:5.4,
    GO:5.6, MA:5.6, MG:5.6, MS:5.4, MT:5.5, PA:5.4, PB:5.8, PE:5.6,
    PI:6.0, PR:4.8, RJ:5.2, RN:6.0, RO:5.1, RR:5.5, RS:4.7, SC:4.7,
    SE:5.4, SP:5.0, TO:5.7
};

/**
 * Calcula e exibe o resultado do simulador solar.
 * Trata separadamente o caso de imóvel alugado, orientando sobre
 * microgeração compartilhada (Lei 14.300/2022) como alternativa viável.
 *
 * @param {Event} event - Evento de submit do formulário
 */
function calcularSolar(event) {
    event.preventDefault();
    var estado = document.getElementById('estado').value;
    var conta = parseFloat(document.getElementById('conta-solar').value);
    var imovelEl = document.querySelector('input[name="imovel"]:checked');

    if (!imovelEl) { alert('Selecione o tipo de imóvel.'); return; }
    var imovel = imovelEl.value;

    var resultadoDiv = document.getElementById('resultado-solar');

    // Imóveis alugados não permitem instalação; orienta sobre cooperativas solares
    if (imovel === 'alugado') {
        resultadoDiv.innerHTML = '<div class="co2-resultado"><div class="co2-comparacao" style="border-left:4px solid var(--amarelo)">' +
            '<h3>🏢 Imóvel alugado — alternativas disponíveis!</h3>' +
            '<p>Quem não tem telhado próprio ainda pode aproveitar energia solar por meio das <strong>Cooperativas de Energia Solar</strong> ou <strong>Microgeração Compartilhada</strong>, regulamentadas pela Lei 14.300/2022.</p>' +
            '<ul style="padding-left:1.25rem;margin-top:0.75rem">' +
            '<li>Você assina uma cota de geração em uma usina solar compartilhada</li>' +
            '<li>Os créditos são abatidos diretamente na sua conta de luz</li>' +
            '<li>Sem necessidade de instalação ou manutenção</li>' +
            '<li>Econômico a partir da primeira fatura</li>' +
            '</ul>' +
            '<p style="margin-top:1rem">Procure cooperativas de energia solar na sua região — é uma solução real e acessível!</p>' +
            '</div>' +
            '<button onclick="document.getElementById(\'form-solar\').reset();document.getElementById(\'resultado-solar\').style.display=\'none\';document.getElementById(\'form-solar\').style.display=\'block\'" class="btn-submit" style="background:#546e7a;margin-top:1rem">Simular novamente 🔄</button>' +
            '</div>';
        resultadoDiv.style.display = 'block';
        document.getElementById('form-solar').style.display = 'none';
        resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    // --- Cálculo do dimensionamento do sistema fotovoltaico ---
    var irr          = irradiacao[estado];
    var precoKwh     = 0.85;                            // R$/kWh médio Brasil com impostos
    var consumoMensal = conta / precoKwh;               // kWh/mês estimado
    var gerMensalPorKwp = irr * 30 * 0.75;             // kWh/mês que 1 kWp gera (PR = 75%)
    var kwpNecessario = consumoMensal / gerMensalPorKwp;
    var paineis      = Math.ceil(kwpNecessario / 0.55); // Arredonda p/ cima: painéis de 550 W
    var kwpReal      = paineis * 0.55;                  // Potência real após arredondamento
    var custoInstalacao = Math.round(kwpReal * 4800);   // R$ 4.800/kWp — média mercado 2024
    var economiasMensal = conta * 0.88;                 // 12% retido como taxa de disponibilidade
    var economiasAnual  = economiasMensal * 12;
    var payback      = (custoInstalacao / economiasAnual).toFixed(1);
    var economia25anos = Math.round(economiasAnual * 25 - custoInstalacao); // ROI em 25 anos
    var co2Anual     = (consumoMensal * 0.08 * 12 / 1000).toFixed(2);      // toneladas/ano

    // Payback ≤ 8 anos é considerado altamente viável pelo setor (vida útil: 25+ anos)
    var viavel = parseFloat(payback) <= 8;

    var html = '<div class="co2-resultado">' +
        '<h3>Resultado da Simulação — ' + estado + '</h3>' +
        '<div class="solar-cards">' +
            '<div class="solar-card"><span class="solar-icon">☀️</span><span class="solar-val">' + paineis + '</span><span class="solar-label">painéis (550 W)</span></div>' +
            '<div class="solar-card"><span class="solar-icon">⚡</span><span class="solar-val">' + kwpReal.toFixed(2) + ' kWp</span><span class="solar-label">potência do sistema</span></div>' +
            '<div class="solar-card"><span class="solar-icon">💰</span><span class="solar-val">R$ ' + custoInstalacao.toLocaleString('pt-BR') + '</span><span class="solar-label">investimento estimado</span></div>' +
            '<div class="solar-card"><span class="solar-icon">📉</span><span class="solar-val">R$ ' + Math.round(economiasMensal) + '/mês</span><span class="solar-label">economia na conta</span></div>' +
            '<div class="solar-card"><span class="solar-icon">⏱️</span><span class="solar-val">' + payback + ' anos</span><span class="solar-label">retorno do investimento</span></div>' +
            '<div class="solar-card"><span class="solar-icon">🌱</span><span class="solar-val">' + co2Anual + ' t</span><span class="solar-label">CO₂ evitado/ano</span></div>' +
        '</div>' +
        '<div class="co2-comparacao" style="border-left:4px solid ' + (viavel ? 'var(--verde)' : 'var(--amarelo)') + '">' +
            '<p>' + (viavel
                ? '✅ <strong>Energia solar é altamente viável para você!</strong> Com retorno em ' + payback + ' anos e economia de R$ ' + economia25anos.toLocaleString('pt-BR') + ' ao longo de 25 anos, o investimento se paga com folga.'
                : '⚠️ A viabilidade depende de condições específicas. Consulte um instalador certificado para uma análise personalizada do seu telhado.') +
            '</p>' +
            '<p>☀️ Irradiação solar no seu estado: <strong>' + irr + ' kWh/m²/dia</strong></p>' +
        '</div>' +
        '<button onclick="document.getElementById(\'form-solar\').reset();document.getElementById(\'resultado-solar\').style.display=\'none\';document.getElementById(\'form-solar\').style.display=\'block\'" class="btn-submit" style="background:#546e7a;margin-top:1rem">Simular novamente 🔄</button>' +
        '</div>';

    resultadoDiv.innerHTML = html;
    resultadoDiv.style.display = 'block';
    document.getElementById('form-solar').style.display = 'none';
    resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ==========================================================================
   3. QUIZ INTERATIVO
   Exibe perguntas uma a uma, registra acertos e gera feedback imediato.
   Usa innerHTML dinâmico para renderizar cada estado sem framework.
   ========================================================================== */

/**
 * Banco de perguntas do quiz.
 * Cada objeto contém:
 *  p  — texto da pergunta
 *  o  — array de opções (4 alternativas)
 *  c  — índice da opção correta (base 0)
 *  e  — explicação exibida após a resposta
 */
var quizPerguntas = [
    {
        p: 'Qual percentual da eletricidade brasileira vem de fontes renováveis?',
        o: ['83%', '45%', '60%', '92%'], c: 0,
        e: 'O Brasil gera mais de 83% de sua eletricidade de fontes renováveis — principalmente hidrelétricas, eólica e solar.'
    },
    {
        p: 'Qual estado brasileiro tem a maior capacidade de energia eólica instalada?',
        o: ['Bahia', 'Ceará', 'Rio Grande do Norte', 'Piauí'], c: 2,
        e: 'O Rio Grande do Norte lidera o ranking nacional de energia eólica, aproveitando os ventos constantes e intensos do Nordeste.'
    },
    {
        p: 'Em que ano foi sancionado o Marco Legal da Microgeração Distribuída no Brasil?',
        o: ['2015', '2019', '2022', '2024'], c: 2,
        e: 'A Lei 14.300/2022 regulamentou a micro e minigeração distribuída, facilitando a instalação de painéis solares residenciais.'
    },
    {
        p: 'Quanto o custo dos painéis solares caiu desde 2012?',
        o: ['Mais de 90%', 'Cerca de 50%', 'Cerca de 70%', 'Cerca de 30%'], c: 0,
        e: 'Os painéis solares ficaram mais de 90% mais baratos desde 2012, tornando-se a fonte de energia mais barata da história em várias regiões.'
    },
    {
        p: 'Qual é a principal fonte de eletricidade do Brasil?',
        o: ['Energia Solar', 'Energia Eólica', 'Energia Hidrelétrica', 'Gás Natural'], c: 2,
        e: 'A energia hidrelétrica representa cerca de 54-60% da geração elétrica brasileira, aproveitando a enorme riqueza hídrica do país.'
    }
];

var quizIndex    = 0;   // índice da pergunta atual
var quizPontos   = 0;   // contador de acertos acumulados
var quizRespondeu = false; // trava para impedir duplo clique na mesma pergunta

/** Reinicia o quiz do zero e exibe a primeira pergunta. */
function iniciarQuiz() {
    quizIndex  = 0;
    quizPontos = 0;
    renderizarPergunta();
}

/**
 * Renderiza a pergunta atual como HTML dinâmico no container do quiz.
 * A barra de progresso é calculada em percentual antes de renderizar.
 */
function renderizarPergunta() {
    var q = quizPerguntas[quizIndex];
    var progresso = Math.round((quizIndex / quizPerguntas.length) * 100);
    var html = '<div class="quiz-progresso-bg"><div class="quiz-progresso-bar" style="width:' + progresso + '%"></div></div>' +
        '<p class="quiz-contador">Pergunta ' + (quizIndex + 1) + ' de ' + quizPerguntas.length + ' &nbsp;|&nbsp; ✅ ' + quizPontos + ' corretas</p>' +
        '<h3 class="quiz-pergunta">' + q.p + '</h3>' +
        '<div class="quiz-opcoes">';
    q.o.forEach(function(op, i) {
        html += '<button class="quiz-opcao" onclick="responderQuiz(' + i + ')">' + op + '</button>';
    });
    html += '</div><div id="quiz-feedback" style="display:none"></div>';
    document.getElementById('quiz-container').innerHTML = html;
    quizRespondeu = false;
}

/**
 * Processa a resposta do usuário: marca certo/errado visualmente,
 * exibe a explicação e o botão para avançar.
 * A trava quizRespondeu impede que cliques rápidos contem duplo acerto.
 *
 * @param {number} idx - Índice da opção clicada pelo usuário
 */
function responderQuiz(idx) {
    if (quizRespondeu) return; // ignora cliques após já ter respondido
    quizRespondeu = true;

    var q = quizPerguntas[quizIndex];

    // Desabilita todos os botões e colore certo/errado
    document.querySelectorAll('.quiz-opcao').forEach(function(btn, i) {
        btn.disabled = true;
        if (i === q.c) btn.classList.add('correta');
        else if (i === idx) btn.classList.add('errada');
    });

    if (idx === q.c) quizPontos++;

    var acertou     = (idx === q.c);
    var fb          = document.getElementById('quiz-feedback');
    fb.className    = 'quiz-feedback ' + (acertou ? 'feedback-ok' : 'feedback-erro');
    var proximaLabel = (quizIndex < quizPerguntas.length - 1) ? 'Próxima →' : 'Ver resultado 🏆';
    var proximaFn   = (quizIndex < quizPerguntas.length - 1) ? 'proximaPergunta()' : 'finalizarQuiz()';
    fb.innerHTML    = (acertou ? '✅ Correto! ' : '❌ Errado. ') + q.e +
        '<br><button class="btn-submit" style="margin-top:0.75rem;width:auto;padding:0.5rem 1.5rem" onclick="' + proximaFn + '">' + proximaLabel + '</button>';
    fb.style.display = 'block';
}

/** Avança para a próxima pergunta. */
function proximaPergunta() { quizIndex++; renderizarPergunta(); }

/**
 * Exibe a tela de resultado final com pontuação e mensagem personalizada.
 * Oferece opção de jogar novamente ou ir para o conteúdo do site.
 */
function finalizarQuiz() {
    var pct = Math.round((quizPontos / quizPerguntas.length) * 100);
    var msg, emoji;
    if (pct === 100)      { msg = 'Perfeito! Você é um expert em energias renováveis!'; emoji = '🏆'; }
    else if (pct >= 60)   { msg = 'Muito bem! Você tem bom conhecimento sobre o tema.'; emoji = '🌟'; }
    else                  { msg = 'Continue estudando! Explore o conteúdo do site para aprender mais.'; emoji = '📚'; }

    document.getElementById('quiz-container').innerHTML =
        '<div class="quiz-resultado">' +
        '<div class="quiz-score">' + emoji +
        '<span class="quiz-pontos">' + quizPontos + '/' + quizPerguntas.length + '</span>' +
        '<span class="quiz-pct">' + pct + '% de acerto</span></div>' +
        '<p>' + msg + '</p>' +
        '<div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;margin-top:1.5rem">' +
        '<button class="btn-submit" style="width:auto;padding:0.6rem 1.5rem" onclick="iniciarQuiz()">Jogar novamente 🔄</button>' +
        '<a href="content.html" class="btn-submit" style="width:auto;padding:0.6rem 1.5rem;text-decoration:none">Estudar mais 📖</a>' +
        '</div></div>';
}

/* ==========================================================================
   4. GRÁFICO — EVOLUÇÃO DA MATRIZ ELÉTRICA BRASILEIRA
   Usa a biblioteca Chart.js (carregada via CDN em content.html).
   O guard "typeof Chart !== 'undefined'" evita erro nas páginas que
   não carregam o CDN do Chart.js.
   Fonte dos dados: ANEEL / EPE / ONS — Balanço Energético Nacional (2015-2024).
   ========================================================================== */

window.addEventListener('load', function() {
    var canvas = document.getElementById('graficoMatriz');
    if (canvas && typeof Chart !== 'undefined') {
        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024'],
                datasets: [
                    // 2021 registrou queda hídrica por seca histórica, evidenciando risco de concentração
                    { label: '💧 Hídrica (%)', data: [68,65,66,66,65,66,56,61,58,54], borderColor:'#1565C0', backgroundColor:'rgba(21,101,192,0.1)', tension:0.4, fill:true },
                    { label: '💨 Eólica (%)',  data: [5,6,8,9,9,10,12,13,14,15],      borderColor:'#2e9955', backgroundColor:'rgba(46,153,85,0.1)',  tension:0.4, fill:true },
                    { label: '☀️ Solar (%)',   data: [0.1,0.2,0.5,1,1.5,2,3,5,8,12], borderColor:'#f9a825', backgroundColor:'rgba(249,168,37,0.1)', tension:0.4, fill:true }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: { title: { display: true, text: '% da geração elétrica' }, min: 0, max: 80 }
                }
            }
        });
    }
});

/* ==========================================================================
   5. CALCULADORA DE PEGADA DE CARBONO
   Estima emissões anuais de CO₂ (kg) somando quatro categorias:
   transporte, energia elétrica, alimentação e viagens aéreas.
   Os valores por categoria são baseados em estudos do IPCC, SEEG/IMAFLORA
   e relatórios do Observatório do Clima (2022-2024).
   ========================================================================== */

/**
 * Emissões anuais de CO₂ por transporte (kg/ano).
 * Cruzamento entre modal e distância percorrida por dia.
 * Gasolina/diesel: fator CETESB 2023 (~0,22 kg CO₂/km).
 * Flex com etanol: redução de ~65% em relação à gasolina (ciclo curto).
 * Transporte público: emissão por passageiro-km (~0,04 kg CO₂/passageiro-km).
 */
var emissaoTransporte = {
    gasolina: { menos10: 800,  '10a30': 2000, '30a60': 4000, mais60: 7000 },
    flex:     { menos10: 300,  '10a30': 800,  '30a60': 1600, mais60: 2800 },
    moto:     { menos10: 500,  '10a30': 1200, '30a60': 2400, mais60: 4000 },
    publico:  { menos10: 100,  '10a30': 250,  '30a60': 500,  mais60: 800  },
    bicicleta:{ menos10: 0,    '10a30': 0,    '30a60': 0,    mais60: 0    }
};

/**
 * Emissões anuais de CO₂ pela energia elétrica residencial (kg/ano).
 * A rede elétrica brasileira tem fator de emissão muito baixo (~0,08 kg/kWh)
 * graças à predominância de hidrelétricas — um dos mais limpos do mundo.
 */
var emissaoEnergia = { menos100: 80, '100a200': 150, '200a400': 300, mais400: 500 };

/**
 * Emissões anuais de CO₂ pela alimentação (kg/ano).
 * Pecuária bovina: ~27 kg CO₂eq por kg de carne (metano entérico + desmatamento).
 * Fonte: IPCC AR6 / Our World in Data — Food emissions dataset (2023).
 */
var emissaoDieta = { carne_diaria: 2500, carne_semanal: 1500, vegetariano: 800, vegano: 400 };

/**
 * Emissões anuais de CO₂ por viagens aéreas (kg/ano).
 * Fator médio: ~0,115 kg CO₂ por passageiro-km (ICAO Carbon Emissions Calculator).
 * Voo doméstico médio Brasil: ~800 km → ~180 kg CO₂/trecho × 2 trechos ≈ 360 kg.
 */
var emissaoViagem = { nenhum: 0, domestico: 400, internacional: 1200, multiplos: 3000 };

/** Dicas de transporte personalizadas por modal selecionado. */
var dicasTransporte = {
    gasolina: 'Considere migrar para um carro flex ou elétrico — pode reduzir em até 70% as emissões do transporte.',
    flex:     'Prefira o etanol ao invés da gasolina: as emissões líquidas são até 70% menores.',
    moto:     'Motos emitem menos que carros, mas ainda poluem. Para distâncias curtas, a bicicleta zera as emissões.',
    publico:  'Ótima escolha! O transporte público emite até 10x menos CO₂ por passageiro que o carro individual.',
    bicicleta:'Parabéns! Bicicleta e caminhada têm emissão zero. Continue assim!'
};

/** Dicas de alimentação personalizadas por dieta selecionada. */
var dicasDieta = {
    carne_diaria:  'A pecuária é responsável por 14,5% das emissões globais. Reduzir o consumo de carne vermelha para 3x/semana pode cortar ~600 kg de CO₂/ano.',
    carne_semanal: 'Bom equilíbrio! Substituir uma refeição com carne por leguminosas por semana ainda reduz ~200 kg/ano.',
    vegetariano:   'Uma dieta vegetariana emite 50% menos CO₂ que uma onívora. Excelente escolha!',
    vegano:        'A dieta vegana tem a menor pegada alimentar possível. Muito bem!'
};

/**
 * Oculta o campo de distância quando o usuário seleciona bicicleta/a pé,
 * pois não há emissão e a distância se torna irrelevante para o cálculo.
 *
 * @param {HTMLSelectElement} sel - O elemento <select> de transporte
 */
function toggleDistancia(sel) {
    var grupo = document.getElementById('grupo-distancia');
    grupo.style.display = (sel.value === 'bicicleta') ? 'none' : 'block';
    if (sel.value === 'bicicleta') {
        // Limpa seleção anterior de distância para não interferir no cálculo
        document.querySelectorAll('input[name="distancia"]').forEach(function(r) { r.checked = false; });
    }
}

/**
 * Calcula a pegada de carbono anual somando as quatro categorias,
 * determina o nível (baixa/moderada/alta) em relação às médias de referência
 * e renderiza o resultado com barras proporcionais e dicas personalizadas.
 *
 * Referências de comparação:
 *  - Média brasileira: 2,2 t CO₂/ano por pessoa (SEEG 2023)
 *  - Média mundial:    4,7 t CO₂/ano por pessoa (Our World in Data 2023)
 *
 * @param {Event} event - Evento de submit do formulário
 */
function calcularCO2(event) {
    event.preventDefault();

    var transporte  = document.getElementById('transporte').value;
    var distanciaEl = document.querySelector('input[name="distancia"]:checked');
    var energia     = document.getElementById('energia').value;
    var dietaEl     = document.querySelector('input[name="dieta"]:checked');
    var viagem      = document.getElementById('viagem').value;

    if (transporte !== 'bicicleta' && !distanciaEl) {
        alert('Selecione a distância percorrida por dia.');
        return;
    }
    if (!dietaEl) { alert('Selecione sua alimentação.'); return; }

    // Bicicleta não tem emissão, usa 'menos10' como chave neutra (valor = 0)
    var distancia = (transporte === 'bicicleta') ? 'menos10' : distanciaEl.value;
    var dieta     = dietaEl.value;

    var co2Transporte = emissaoTransporte[transporte][distancia];
    var co2Energia    = emissaoEnergia[energia];
    var co2Dieta      = emissaoDieta[dieta];
    var co2Viagem     = emissaoViagem[viagem];
    var total         = co2Transporte + co2Energia + co2Dieta + co2Viagem;

    var totalT      = (total / 1000).toFixed(1);
    var mediaBR     = 2.2;   // t/ano — SEEG 2023
    var mediaMundial = 4.7;  // t/ano — Our World in Data 2023

    // Classificação por nível de emissão relativo às médias de referência
    var nivel, cor, emoji;
    if (total <= 2200)      { nivel = 'Baixa';    cor = '#2e9955'; emoji = '🟢'; }
    else if (total <= 4700) { nivel = 'Moderada'; cor = '#f9a825'; emoji = '🟡'; }
    else                    { nivel = 'Alta';     cor = '#e53935'; emoji = '🔴'; }

    // Identifica a maior fonte de emissão para personalizar a dica principal
    var maiorFonte = 'Transporte';
    var maiorVal   = co2Transporte;
    if (co2Dieta   > maiorVal) { maiorFonte = 'Alimentação';    maiorVal = co2Dieta; }
    if (co2Viagem  > maiorVal) { maiorFonte = 'Viagens';        maiorVal = co2Viagem; }
    if (co2Energia > maiorVal) { maiorFonte = 'Energia elétrica'; }

    /**
     * Gera o HTML de uma barra de progresso proporcional para cada categoria.
     * A largura em % é relativa ao total geral, não ao máximo possível,
     * para que o usuário visualize a contribuição relativa de cada fonte.
     */
    function barra(label, val, total) {
        var pct  = total > 0 ? Math.round((val / total) * 100) : 0;
        var valT = (val / 1000).toFixed(2);
        return '<div class="co2-item">' +
            '<span class="co2-item-label">' + label + '</span>' +
            '<div class="co2-barra-bg"><div class="co2-barra" style="width:' + pct + '%;background:' + cor + '"></div></div>' +
            '<span class="co2-item-val">' + valT + ' t</span>' +
            '</div>';
    }

    var comparacaoTexto = '';
    if (total < mediaBR * 1000) {
        comparacaoTexto = '✅ Você emite <strong>menos que a média brasileira</strong> de ' + mediaBR + ' t/ano. Parabéns!';
    } else if (total < mediaMundial * 1000) {
        comparacaoTexto = '⚠️ Você emite <strong>mais que a média brasileira</strong> (' + mediaBR + ' t), mas abaixo da média mundial (' + mediaMundial + ' t).';
    } else {
        comparacaoTexto = '❌ Você emite <strong>acima da média mundial</strong> de ' + mediaMundial + ' t/ano. Pequenas mudanças fazem grande diferença!';
    }

    var html = '<div class="co2-resultado">' +
        '<h3>Sua pegada de carbono estimada</h3>' +
        '<div class="co2-total" style="border-color:' + cor + '">' +
            '<span class="co2-numero" style="color:' + cor + '">' + emoji + ' ' + totalT + '</span>' +
            '<span class="co2-unidade">toneladas de CO₂ por ano</span>' +
            '<span class="co2-nivel" style="background:' + cor + '">' + nivel + '</span>' +
        '</div>' +
        '<h4 style="margin-top:1.5rem">Origem das emissões</h4>' +
        barra('🚗 Transporte', co2Transporte, total) +
        barra('⚡ Energia elétrica', co2Energia, total) +
        barra('🥩 Alimentação', co2Dieta, total) +
        barra('✈️ Viagens aéreas', co2Viagem, total) +
        '<div class="co2-comparacao">' +
            '<p>' + comparacaoTexto + '</p>' +
            '<div class="co2-medias">' +
                '<span>🇧🇷 Média brasileira: <strong>' + mediaBR + ' t/ano</strong></span>' +
                '<span>🌍 Média mundial: <strong>' + mediaMundial + ' t/ano</strong></span>' +
            '</div>' +
        '</div>' +
        '<div class="co2-dicas">' +
            '<h4>💡 Como reduzir sua pegada</h4>' +
            '<ul>' +
                '<li>' + dicasTransporte[transporte] + '</li>' +
                '<li>' + dicasDieta[dieta] + '</li>' +
                '<li>Seu maior impacto individual está em <strong>' + maiorFonte + '</strong>. Começar por aí é o caminho mais eficiente.</li>' +
            '</ul>' +
        '</div>' +
        '<button onclick="resetCalculadora()" class="btn-submit" style="background:#546e7a;margin-top:1rem">Calcular novamente 🔄</button>' +
    '</div>';

    var resultado = document.getElementById('resultado-co2');
    resultado.innerHTML = html;
    resultado.style.display = 'block';
    resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('form-co2').style.display = 'none';
}

/** Restaura o formulário de CO₂ ao estado inicial, limpando o resultado. */
function resetCalculadora() {
    document.getElementById('form-co2').reset();
    document.getElementById('form-co2').style.display = 'block';
    document.getElementById('resultado-co2').style.display = 'none';
    document.getElementById('grupo-distancia').style.display = 'block';
    document.getElementById('form-co2').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ==========================================================================
   6. TOAST DE BOAS-VINDAS
   Exibido automaticamente ao carregar qualquer página do site.
   Usa o evento 'load' para garantir que o DOM esteja completo.
   Remove a classe após 3,5 s via setTimeout para fade-out via CSS.
   ========================================================================== */

window.addEventListener('load', function() {
    var toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = '🌱 Bem-vindo ao EcoFuturo!';
        toast.classList.add('toast-visible');
        setTimeout(function() {
            toast.classList.remove('toast-visible');
        }, 3500);
    }
});

/* ==========================================================================
   7. ACCORDION — PERGUNTAS FREQUENTES
   Implementa o padrão "accordion exclusivo": apenas um item pode estar
   aberto por vez. Ao abrir um novo, fecha todos os anteriores.
   Evento: onclick declarado diretamente no HTML (atributo inline).
   ========================================================================== */

/**
 * Alterna a abertura/fechamento de um item do accordion.
 * Fecha todos os outros antes de abrir o clicado, garantindo
 * que nunca mais de uma resposta fique visível simultaneamente.
 *
 * @param {Element} btn - Botão do item clicado
 */
function toggleAcordeon(btn) {
    var conteudo  = btn.nextElementSibling;
    var icone     = btn.querySelector('.accordion-icon');
    var estaAberto = conteudo.classList.contains('open');

    // Fecha todos os itens antes de processar o clique atual
    document.querySelectorAll('.accordion-content').forEach(function(el) { el.classList.remove('open'); });
    document.querySelectorAll('.accordion-icon').forEach(function(el) { el.textContent = '+'; });

    // Se o item clicado estava fechado, abre-o; se já estava aberto, permanece fechado
    if (!estaAberto) {
        conteudo.classList.add('open');
        if (icone) icone.textContent = '−';
    }
}

/* ==========================================================================
   8. EFEITO HOVER NOS CARDS
   Aplica elevação visual via transform e box-shadow ao passar o mouse.
   Declarado como funções separadas para ser reutilizável em qualquer card
   via atributos onmouseover/onmouseout no HTML.
   ========================================================================== */

/**
 * Eleva o card visualmente ao receber o mouse (onmouseover).
 * @param {Element} card - Elemento .card que recebeu o evento
 */
function destacarCard(card) {
    card.style.transform  = 'translateY(-8px)';
    card.style.boxShadow  = '0 16px 32px rgba(26, 107, 60, 0.22)';
}

/**
 * Restaura o card à posição original ao sair o mouse (onmouseout).
 * @param {Element} card - Elemento .card que perdeu o foco do mouse
 */
function normalCard(card) {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
}

/* ==========================================================================
   9. FORMULÁRIO DE CONTATO — VALIDAÇÃO + ENVIO VIA FORMSPREE
   Valida os campos obrigatórios antes de submeter.
   Usa a Fetch API para enviar de forma assíncrona ao serviço Formspree,
   mantendo o usuário na página (sem redirecionamento).
   O botão é desabilitado durante o envio para evitar duplo submit.
   ========================================================================== */

/**
 * Valida o formulário de contato e o envia via Fetch + Formspree.
 * Em caso de sucesso, exibe mensagem e limpa os campos.
 * Em caso de falha de rede ou resposta HTTP de erro, alerta o usuário.
 *
 * @param {Event} event - Evento de submit do formulário
 */
function validarFormulario(event) {
    event.preventDefault();

    var nome     = document.getElementById('nome').value.trim();
    var email    = document.getElementById('email').value.trim();
    var mensagem = document.getElementById('mensagem').value.trim();
    var termos   = document.getElementById('termos').checked;

    // Validações em sequência — foca no campo com problema para UX
    if (!nome)                      { alert('Informe seu nome completo.');            document.getElementById('nome').focus();     return; }
    if (!email || !email.includes('@')) { alert('Informe um e-mail válido.');         document.getElementById('email').focus();    return; }
    if (!mensagem)                  { alert('Escreva uma mensagem.');                 document.getElementById('mensagem').focus(); return; }
    if (!termos)                    { alert('Você precisa aceitar os termos para enviar.'); return; }

    var form = event.target;
    var btn  = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Enviando...';

    fetch(form.action, {
        method: 'POST',
        body:    new FormData(form),
        headers: { 'Accept': 'application/json' } // Formspree retorna JSON quando Accept é json
    })
    .then(function(response) {
        if (response.ok) {
            var ok = document.getElementById('form-success');
            if (ok) { ok.style.display = 'block'; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            form.reset();
        } else {
            alert('Erro ao enviar. Tente novamente.');
        }
    })
    .catch(function() {
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
    })
    .finally(function() {
        // Reativa o botão independentemente do resultado, para nova tentativa
        btn.disabled    = false;
        btn.textContent = 'Enviar Mensagem ✉️';
    });
}
