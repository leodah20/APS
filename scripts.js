// ===== CALCULADORA DE PEGADA DE CARBONO =====

var emissaoTransporte = {
    gasolina: { menos10: 800,  '10a30': 2000, '30a60': 4000, mais60: 7000 },
    flex:     { menos10: 300,  '10a30': 800,  '30a60': 1600, mais60: 2800 },
    moto:     { menos10: 500,  '10a30': 1200, '30a60': 2400, mais60: 4000 },
    publico:  { menos10: 100,  '10a30': 250,  '30a60': 500,  mais60: 800  },
    bicicleta:{ menos10: 0,    '10a30': 0,    '30a60': 0,    mais60: 0    }
};

var emissaoEnergia = { menos100: 80, '100a200': 150, '200a400': 300, mais400: 500 };

var emissaoDieta = { carne_diaria: 2500, carne_semanal: 1500, vegetariano: 800, vegano: 400 };

var emissaoViagem = { nenhum: 0, domestico: 400, internacional: 1200, multiplos: 3000 };

var dicasTransporte = {
    gasolina: 'Considere migrar para um carro flex ou elétrico — pode reduzir em até 70% as emissões do transporte.',
    flex: 'Prefira o etanol ao invés da gasolina: as emissões líquidas são até 70% menores.',
    moto: 'Motos emitem menos que carros, mas ainda poluem. Para distâncias curtas, a bicicleta zera as emissões.',
    publico: 'Ótima escolha! O transporte público emite até 10x menos CO₂ por passageiro que o carro individual.',
    bicicleta: 'Parabéns! Bicicleta e caminhada têm emissão zero. Continue assim!'
};

var dicasDieta = {
    carne_diaria: 'A pecuária é responsável por 14,5% das emissões globais. Reduzir o consumo de carne vermelha para 3x/semana pode cortar ~600 kg de CO₂/ano.',
    carne_semanal: 'Bom equilíbrio! Substituir uma refeição com carne por leguminosas por semana ainda reduz ~200 kg/ano.',
    vegetariano: 'Uma dieta vegetariana emite 50% menos CO₂ que uma onívora. Excelente escolha!',
    vegano: 'A dieta vegana tem a menor pegada alimentar possível. Muito bem!'
};

function toggleDistancia(sel) {
    var grupo = document.getElementById('grupo-distancia');
    grupo.style.display = (sel.value === 'bicicleta') ? 'none' : 'block';
    if (sel.value === 'bicicleta') {
        document.querySelectorAll('input[name="distancia"]').forEach(function(r) { r.checked = false; });
    }
}

function calcularCO2(event) {
    event.preventDefault();

    var transporte = document.getElementById('transporte').value;
    var distanciaEl = document.querySelector('input[name="distancia"]:checked');
    var energia = document.getElementById('energia').value;
    var dietaEl = document.querySelector('input[name="dieta"]:checked');
    var viagem = document.getElementById('viagem').value;

    if (transporte !== 'bicicleta' && !distanciaEl) {
        alert('Selecione a distância percorrida por dia.');
        return;
    }
    if (!dietaEl) {
        alert('Selecione sua alimentação.');
        return;
    }

    var distancia = (transporte === 'bicicleta') ? 'menos10' : distanciaEl.value;
    var dieta = dietaEl.value;

    var co2Transporte = emissaoTransporte[transporte][distancia];
    var co2Energia = emissaoEnergia[energia];
    var co2Dieta = emissaoDieta[dieta];
    var co2Viagem = emissaoViagem[viagem];
    var total = co2Transporte + co2Energia + co2Dieta + co2Viagem;

    var totalT = (total / 1000).toFixed(1);
    var mediaBR = 2.2;
    var mediaMundial = 4.7;

    var nivel, cor, emoji;
    if (total <= 2200) { nivel = 'Baixa'; cor = '#2e9955'; emoji = '🟢'; }
    else if (total <= 4700) { nivel = 'Moderada'; cor = '#f9a825'; emoji = '🟡'; }
    else { nivel = 'Alta'; cor = '#e53935'; emoji = '🔴'; }

    var maiorFonte = 'Transporte';
    var maiorVal = co2Transporte;
    if (co2Dieta > maiorVal) { maiorFonte = 'Alimentação'; maiorVal = co2Dieta; }
    if (co2Viagem > maiorVal) { maiorFonte = 'Viagens'; maiorVal = co2Viagem; }
    if (co2Energia > maiorVal) { maiorFonte = 'Energia elétrica'; }

    function barra(label, val, total) {
        var pct = total > 0 ? Math.round((val / total) * 100) : 0;
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

function resetCalculadora() {
    document.getElementById('form-co2').reset();
    document.getElementById('form-co2').style.display = 'block';
    document.getElementById('resultado-co2').style.display = 'none';
    document.getElementById('grupo-distancia').style.display = 'block';
    document.getElementById('form-co2').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// mostrar toast de boas-vindas quando a página carrega
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

// abre e fecha os itens das perguntas frequentes
function toggleAcordeon(btn) {
    var conteudo = btn.nextElementSibling;
    var icone = btn.querySelector('.accordion-icon');
    var estaAberto = conteudo.classList.contains('open');

    document.querySelectorAll('.accordion-content').forEach(function(el) {
        el.classList.remove('open');
    });
    document.querySelectorAll('.accordion-icon').forEach(function(el) {
        el.textContent = '+';
    });

    if (!estaAberto) {
        conteudo.classList.add('open');
        if (icone) icone.textContent = '−';
    }
}

// efeito de destaque nos cards ao passar o mouse
function destacarCard(card) {
    card.style.transform = 'translateY(-8px)';
    card.style.boxShadow = '0 16px 32px rgba(26, 107, 60, 0.22)';
}

function normalCard(card) {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
}

// validação e envio do formulário via Formspree
function validarFormulario(event) {
    event.preventDefault();

    var nome = document.getElementById('nome').value.trim();
    var email = document.getElementById('email').value.trim();
    var mensagem = document.getElementById('mensagem').value.trim();
    var termos = document.getElementById('termos').checked;

    if (!nome) {
        alert('Informe seu nome completo.');
        document.getElementById('nome').focus();
        return;
    }

    if (!email || !email.includes('@')) {
        alert('Informe um e-mail válido.');
        document.getElementById('email').focus();
        return;
    }

    if (!mensagem) {
        alert('Escreva uma mensagem.');
        document.getElementById('mensagem').focus();
        return;
    }

    if (!termos) {
        alert('Você precisa aceitar os termos para enviar.');
        return;
    }

    var form = event.target;
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
    })
    .then(function(response) {
        if (response.ok) {
            var ok = document.getElementById('form-success');
            if (ok) {
                ok.style.display = 'block';
                ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            form.reset();
        } else {
            alert('Erro ao enviar. Tente novamente.');
        }
    })
    .catch(function() {
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
    })
    .finally(function() {
        btn.disabled = false;
        btn.textContent = 'Enviar Mensagem ✉️';
    });
}
