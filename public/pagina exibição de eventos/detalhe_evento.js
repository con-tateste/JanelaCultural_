// Variáveis globais
let eventoAtual = null;

// Função para obter parâmetros da URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Função para carregar dados do evento
async function carregarEvento() {
    const idEvento = getUrlParameter('id');
    
    if (!idEvento || idEvento === 'undefined' || idEvento === 'null') {
        mostrarErro('ID do evento não encontrado ou inválido');
        return;
    }

    // Validar se é um número
    if (isNaN(parseInt(idEvento))) {
        mostrarErro('ID do evento deve ser um número válido');
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:8080/eventos/${idEvento}`);
        
        if (!resposta.ok) {
            throw new Error('Evento não encontrado');
        }

        eventoAtual = await resposta.json();
        preencherDadosEvento(eventoAtual);
        verificarInscricaoUsuario(idEvento);
        
    } catch (erro) {
        console.error('Erro ao carregar evento:', erro);
        mostrarErro('Erro ao carregar dados do evento');
    }
}

// Função para mostrar estado de carregamento
function mostrarCarregamento() {
    const mainContent = document.querySelector('.event-page');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="container">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <h3>Carregando evento...</h3>
                    <p>Aguarde enquanto buscamos os detalhes do evento</p>
                </div>
            </div>
        `;
    }
}

// Função para ocultar carregamento
function ocultarCarregamento() {
    // O carregamento é ocultado quando os dados são preenchidos
    // Esta função pode ser usada para casos específicos
}

// Função para preencher os dados do evento na página
function preencherDadosEvento(evento) {
    // Título e categoria
    document.getElementById('event-category').textContent = evento.categoria;
    document.getElementById('event-title').textContent = evento.titulo;
    document.getElementById('breadcrumb-evento').textContent = evento.titulo;
    
    // Descrição do evento (apenas na seção de descrição)
    const descricaoElement = document.getElementById('event-description');
    if (descricaoElement) {
        // Quebrar a descrição em parágrafos se houver quebras de linha
        const paragrafos = evento.descricao.split('\n').filter(p => p.trim() !== '');
        if (paragrafos.length > 0) {
            descricaoElement.innerHTML = paragrafos.map(p => `<p>${p}</p>`).join('');
        } else {
            descricaoElement.innerHTML = `<p>${evento.descricao}</p>`;
        }
    }
    
    // Data e hora
    const dataEvento = new Date(evento.data_inicio);
    const diaSemana = dataEvento.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaMes = dataEvento.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    
    const eventDateElement = document.getElementById('event-date');
    if (eventDateElement) {
        eventDateElement.innerHTML = `
            <strong>${diaMes}</strong><br>
            <small>${diaSemana}</small>
        `;
    }
    
    // Hora
    const horaInicio = evento.hora_inicio?.slice(0, 5) || '00:00';
    const horaFim = evento.hora_fim?.slice(0, 5) || '00:00';
    const eventTimeElement = document.getElementById('event-time');
    if (eventTimeElement) {
        eventTimeElement.textContent = `${horaInicio} - ${horaFim}`;
    }
    
    // Localização
    const tipoIcone = evento.tipo_evento === 'online' ? '💻' : '📍';
    const tipoTexto = evento.tipo_evento === 'online' ? 'Online' : 'Presencial';
    const localTexto = evento.tipo_evento === 'online' ? 'Online' : (evento.local || 'Local a definir');
    
    const locationIconElement = document.getElementById('location-icon');
    const locationTypeElement = document.getElementById('location-type');
    if (locationIconElement) locationIconElement.textContent = tipoIcone;
    if (locationTypeElement) locationTypeElement.textContent = localTexto;
    
    // Mapa/descrição do local
    const mapContainer = document.getElementById('location-details');
    if (mapContainer) {
        if (evento.tipo_evento === 'online') {
            mapContainer.textContent = 'Evento online - Link será enviado após inscrição';
        } else {
            mapContainer.textContent = evento.local || 'Local a definir';
        }
    }
    
    // Vagas disponíveis
    const vagasRestantes = evento.vagas_disponiveis - (evento.inscritos || 0);
    const vagasStatus = vagasRestantes > 0 ? `${vagasRestantes} vagas disponíveis` : 'Evento lotado';
    const vagasElement = document.getElementById('vagas-status');
    if (vagasElement) {
        vagasElement.textContent = vagasStatus;
    }
    
    // Organizador
    const organizadorElement = document.getElementById('organizer-name');
    const avatarElement = document.getElementById('organizer-avatar');
    if (organizadorElement) {
        organizadorElement.textContent = evento.nome_organizador || 'Organizador não informado';
    }
    if (avatarElement) {
        // Criar iniciais do nome do organizador
        const nome = evento.nome_organizador || 'Organizador';
        const iniciais = nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatarElement.textContent = iniciais || '--';
    }
    
    // Tags baseadas na categoria e tipo
    const tagsContainer = document.getElementById('tags-container');
    if (tagsContainer) {
        const tags = [evento.categoria, evento.tipo_evento];
        tagsContainer.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    }
    
    // Atualizar título da página
    document.title = `${evento.titulo} - JanelaCultural`;
    
    // Atualizar botão de inscrição
    const btnRegister = document.getElementById('btn-register');
    if (btnRegister) {
        btnRegister.textContent = 'Inscrever-se';
        btnRegister.disabled = vagasRestantes <= 0;
    }
}

// Função para verificar se o usuário está inscrito
async function verificarInscricaoUsuario(idEvento) {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;

    try {
        const resposta = await fetch(`http://localhost:8080/eventos/${idEvento}/inscricao/${usuario.id_usuario}`);
        const data = await resposta.json();
        
        const botaoInscricao = document.getElementById('btn-register');
        if (botaoInscricao) {
            if (data.inscrito) {
                botaoInscricao.textContent = 'Cancelar Inscrição';
                botaoInscricao.classList.add('inscrito');
            } else {
                botaoInscricao.textContent = 'Inscrever-se';
                botaoInscricao.classList.remove('inscrito');
            }
        }
    } catch (erro) {
        console.error('Erro ao verificar inscrição:', erro);
    }
}

// Função para inscrição/cancelamento no evento
async function registerForEvent() {
    if (!eventoAtual) return;
    
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) {
        window.location.href = '/paginas/pagina de cadastro/login.html';
        return;
    }

    const botao = document.getElementById('btn-register');
    const estaInscrito = botao.textContent.includes('Cancelar');

    try {
        const url = `http://localhost:8080/eventos/${eventoAtual.id_evento}/inscrever`;
        const method = estaInscrito ? 'DELETE' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_usuario: usuario.id_usuario
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Atualizar o botão
            botao.textContent = estaInscrito ? 'Inscrever-se' : 'Cancelar Inscrição';
            botao.classList.toggle('inscrito');
            
            // Mostrar mensagem de sucesso
            mostrarMensagem(data.message, 'success');
            
            // Recarregar dados do evento para atualizar contadores
            await carregarEvento();
        } else {
            mostrarMensagem(data.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao inscrever:', error);
        mostrarMensagem('Erro ao processar inscrição', 'error');
    }
}

// Função para mostrar mensagens
function mostrarMensagem(mensagem, tipo) {
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `mensagem ${tipo}`;
    mensagemDiv.textContent = mensagem;
    
    document.body.appendChild(mensagemDiv);
    
    setTimeout(() => {
        mensagemDiv.remove();
    }, 3000);
}

// Função para mostrar erro
function mostrarErro(mensagem) {
    const mainContent = document.querySelector('.event-page');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="container">
                <div class="erro-container">
                    <h2>❌ Erro</h2>
                    <p>${mensagem}</p>
                    <button onclick="window.location.href='/paginas/pagina exibição de eventos/exibição_eventos.html'">
                        Voltar para Eventos
                    </button>
                </div>
            </div>
        `;
    }
}

// Animação suave para elementos quando entram na tela
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados do evento
    carregarEvento();
    
    // Aplicar animação aos cards
    const cards = document.querySelectorAll('.info-card, .event-main');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
});
