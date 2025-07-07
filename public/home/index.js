let dadosEventos = [];

const nomeCategorias = {
    'palestras e debates': 'Palestras e Debates',
    'oficinas culturais e criativas': 'Oficinas Culturais e Criativas',
    'formação e educação': 'Formação e Educação',
    'espaços de escuta e apoio': 'Espaços de escuta e apoio',
    'sáude e bem estar': 'Saúde e Bem Estar',
    'orientação jurídica e direitos': 'Orientação Jurídica e Direitos'
};

async function carregarEventosDoServidor() {
    try {
        const resposta = await fetch('http://localhost:8080/eventos');
        if (!resposta.ok) {
            throw new Error('Erro ao buscar eventos');
        }
        const eventos = await resposta.json();

        // Converte os dados para o formato esperado pelo front
        dadosEventos = eventos.map(e => ({
            id_evento: e.id_evento,
            id: e.id_evento,
            titulo: e.titulo,
            descricao: e.descricao,
            local: e.local || 'Local não informado',
            data_inicio: e.data_inicio,
            hora_inicio: e.hora_inicio,
            hora_fim: e.hora_fim,
            tipo_evento: e.tipo_evento,
            vagas_disponiveis: e.vagas_disponiveis,
            inscritos: e.inscritos || 0,
            categoria: e.categoria,
            nome_organizador: e.nome_organizador,
            data: {
                dia: new Date(e.data_inicio).getDate().toString().padStart(2, '0'),
                mes: new Date(e.data_inicio).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()
            },
            hora: e.hora_inicio?.slice(0, 5) || '00:00',
            tipo: e.tipo_evento || 'presencial',
            imagem: 'purple'
        }));

        exibirEventosNaHome();
    } catch (erro) {
        console.error('Erro ao carregar eventos:', erro);
        exibirMensagemErro();
    }
}

function exibirEventosNaHome() {
    // Separar eventos por tipo
    const eventosPresenciais = dadosEventos.filter(e => e.tipo === 'presencial').slice(0, 3);
    const eventosOnline = dadosEventos.filter(e => e.tipo === 'online').slice(0, 3);

    // Exibir eventos presenciais
    const containerPresenciais = document.getElementById('eventosPresenciais');
    if (containerPresenciais) {
        if (eventosPresenciais.length === 0) {
            containerPresenciais.innerHTML = '<div class="no-events"><p>Nenhum evento presencial encontrado</p></div>';
        } else {
            containerPresenciais.innerHTML = eventosPresenciais.map(evento => criarCardEvento(evento)).join('');
        }
    }

    // Exibir eventos online
    const containerOnline = document.getElementById('eventosOnline');
    if (containerOnline) {
        if (eventosOnline.length === 0) {
            containerOnline.innerHTML = '<div class="no-events"><p>Nenhum evento online encontrado</p></div>';
        } else {
            containerOnline.innerHTML = eventosOnline.map(evento => criarCardEvento(evento)).join('');
        }
    }

    // Adicionar event listeners aos cards
    adicionarEventListenersCards();
}

function criarCardEvento(evento) {
    const tipoIcone = evento.tipo_evento === 'online' ? '💻' : '📍';
    const tipoTexto = evento.tipo_evento === 'online' ? 'Online' : 'Presencial';
    
    // Calcular vagas restantes
    const vagasRestantes = evento.vagas_disponiveis - (evento.inscritos || 0);
    const vagasStatus = vagasRestantes > 0 ? `${vagasRestantes} vagas` : 'Lotado';
    const vagasClass = vagasRestantes > 0 ? 'vagas-disponiveis' : 'vagas-lotado';
    
    return `
        <div class="event-card" data-evento-id="${evento.id_evento}">
            <div class="event-image">
                <div class="gradient-bg ${evento.categoria.toLowerCase().replace(/\s+/g, '-')}"></div>
                <div class="event-date">
                    <span class="day">${new Date(evento.data_inicio).getDate()}</span>
                    <span class="month">${new Date(evento.data_inicio).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                </div>
            </div>
            <div class="event-info">
                <h3>${evento.titulo}</h3>
                <p class="event-location">📍 ${evento.local || 'Local a definir'}</p>
                <p class="event-time">🕒 ${evento.hora_inicio}</p>
                <p class="event-type">${tipoIcone} ${tipoTexto}</p>
                <p class="event-category">${evento.categoria}</p>
                <p class="event-organizer">👤 ${evento.nome_organizador}</p>
                <p class="${vagasClass}">🎫 ${vagasStatus}</p>
            </div>
        </div>
    `;
}

function adicionarEventListenersCards() {
    const cardsEventos = document.querySelectorAll('.event-card');
    cardsEventos.forEach(card => {
        card.addEventListener('click', () => {
            const eventoId = card.dataset.eventoId;
            console.log('Evento selecionado:', eventoId);
            if (eventoId) {
                window.location.href = `/paginas/pagina exibição de eventos/detalhe_evento.html?id=${eventoId}`;
            }
        });
    });
}

function exibirMensagemErro() {
    const containerPresenciais = document.getElementById('eventosPresenciais');
    const containerOnline = document.getElementById('eventosOnline');
    
    if (containerPresenciais) {
        containerPresenciais.innerHTML = '<div class="error-message"><p>Erro ao carregar eventos presenciais</p></div>';
    }
    
    if (containerOnline) {
        containerOnline.innerHTML = '<div class="error-message"><p>Erro ao carregar eventos online</p></div>';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Carregar eventos do servidor
    carregarEventosDoServidor();

    // Configurar busca
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');

    searchBtn.addEventListener('click', function () {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            // Redirecionar para a página de eventos com o termo de busca
            window.location.href = `/paginas/pagina exibição de eventos/exibição_eventos.html?busca=${encodeURIComponent(searchTerm)}`;
        }
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Configurar categorias clicáveis
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            const categoria = this.dataset.categoria;
            if (categoria) {
                // Redirecionar para a página de eventos com filtro de categoria
                window.location.href = `/paginas/pagina exibição de eventos/exibição_eventos.html?categoria=${encodeURIComponent(categoria)}`;
            }
        });
    });

    // Configurar botão criar evento
    const createEventBtn = document.querySelector('.btn-create-event');
    if (createEventBtn) {
        createEventBtn.addEventListener('click', function () {
            window.location.href = '/paginas/cadastro de evntos/cadastro_evento.html';
        });
    }
});

