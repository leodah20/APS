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

// validação do formulário de contato antes de enviar
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

    var ok = document.getElementById('form-success');
    if (ok) {
        ok.style.display = 'block';
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    event.target.reset();
}
