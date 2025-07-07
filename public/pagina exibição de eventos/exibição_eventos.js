let dadosEventos = [];
let paginaAtual = 1;
let eventosPorPagina = 6;
let eventosFiltrados = [];
let termoBusca = '';
let categoriasSelecionadas = ['todos'];
let tiposSelecionados = ['todos-tipos'];

let gradeEventos;
let inputBusca;
let botaoBusca;
let botaoAnterior;
let botaoProximo;
let numeroPaginas;

// Parâmetros da URL
let filtroMeusEventos = null;

const nomeCategorias = {
    'todos': 'Todos os eventos',
    'palestras e debates': 'Palestras e Debates',
    'oficinas culturais e criativas': 'Oficinas Culturais e Criativas',
    'formação e educação': 'Formação e Educação',
    'espaços de escuta e apoio': 'Espaços de escuta e apoio',
    'sáude e bem estar': 'Saúde e Bem Estar',
    'orientação jurídica e direitos': 'Orientação Jurídica e Direitos'
};

const nomeTipos = {
    'todos-tipos': 'Todos os tipos',
    'presencial': 'Presencial',
    'online': 'Online'
};

async function carregarEventosDoServidor() {
    try {
        // Verificar se há filtros de usuário na URL
        const meusEventos = getUrlParameter('meus_eventos');
        const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
        
        console.log('=== DEBUG CARREGAMENTO EVENTOS ===');
        console.log('Filtro meus eventos:', meusEventos);
        console.log('Usuário logado:', usuario);
        
        let url = 'http://localhost:8080/eventos';
        
        // Se há filtro de usuário e usuário está logado, usar rota específica
        if (meusEventos && usuario) {
            if (meusEventos === 'criados') {
                url = `http://localhost:8080/eventos/usuario/${usuario.id_usuario}`;
                console.log('URL para eventos criados:', url);
            } else if (meusEventos === 'inscritos') {
                url = `http://localhost:8080/eventos/inscritos/${usuario.id_usuario}`;
                console.log('URL para eventos inscritos:', url);
            }
        }
        
        console.log('Fazendo requisição para:', url);
        const resposta = await fetch(url);
        console.log('Status da resposta:', resposta.status);
        
        if (!resposta.ok) {
            throw new Error('Erro ao buscar eventos');
        }
        const eventos = await resposta.json();
        console.log('Eventos recebidos do servidor:', eventos);

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

        console.log('Dados convertidos:', dadosEventos);
        eventosFiltrados = [...dadosEventos];
        
        // Verificar inscrições do usuário logado (apenas se não for filtro de eventos inscritos)
        if (!meusEventos || meusEventos !== 'inscritos') {
            await verificarInscricoesUsuario();
        } else {
            // Se é filtro de eventos inscritos, marcar todos como inscritos
            dadosEventos.forEach(evento => {
                evento.inscrito = true;
            });
        }
        
        // Verificar filtros de usuário (meus eventos criados/inscritos)
        verificarFiltrosUsuario();
        
        aplicarFiltros(); // Atualiza a visualização
        console.log('=== FIM DEBUG ===');
    } catch (erro) {
        console.error('Erro ao carregar eventos:', erro);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Inicializar elementos do DOM
    gradeEventos = document.getElementById('gradeEventos');
    inputBusca = document.getElementById('inputBusca');
    botaoBusca = document.getElementById('botaoBusca');
    botaoAnterior = document.getElementById('botaoAnterior');
    botaoProximo = document.getElementById('botaoProximo');
    numeroPaginas = document.getElementById('numeroPaginas');
    
    // Verificar se há parâmetros de busca na URL
    const urlParams = new URLSearchParams(window.location.search);
    const buscaParam = urlParams.get('busca');
    const categoriaParam = urlParams.get('categoria');
    
    if (buscaParam) {
        inputBusca.value = buscaParam;
        termoBusca = buscaParam.toLowerCase().trim();
    }
    
    if (categoriaParam) {
        // Aplicar filtro de categoria
        categoriasSelecionadas = [categoriaParam];
        
        // Desmarcar "todos" e marcar a categoria específica
        const checkboxTodos = document.querySelector('input[value="todos"]');
        if (checkboxTodos) {
            checkboxTodos.checked = false;
        }
        
        // Marcar o checkbox da categoria correspondente
        const checkboxCategoria = document.querySelector(`input[value="${categoriaParam}"]`);
        if (checkboxCategoria) {
            checkboxCategoria.checked = true;
        }
    }
    
    configurarEventListeners();
    carregarEventosDoServidor();
    atualizarPaginacao();
    
    // Configurar modal
    const fecharModal = document.getElementById('fecharModal');
    const modalEvento = document.getElementById('modalEvento');
    
    if (fecharModal) {
        fecharModal.addEventListener('click', () => {
            modalEvento.classList.add('hidden');
        });
    }
    
    if (modalEvento) {
        modalEvento.addEventListener('click', (e) => {
            if (e.target.id === 'modalEvento') {
                modalEvento.classList.add('hidden');
            }
        });
    }
});

function configurarEventListeners() {
    const opcoesFiltro = document.querySelectorAll('.filter-option input[type="checkbox"]');
    opcoesFiltro.forEach(opcao => {
        opcao.addEventListener('change', (e) => {
            const valor = e.target.value;
            
            // Determinar se é filtro de tipo ou categoria baseado no valor
            if (valor === 'todos-tipos' || valor === 'presencial' || valor === 'online') {
                gerenciarFiltroTipo(e);
            } else {
                gerenciarFiltroCategoria(e);
            }
        });
    });

    inputBusca.addEventListener('input', gerenciarBusca);
    botaoBusca.addEventListener('click', gerenciarBusca);

    botaoAnterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarEventos();
            atualizarPaginacao();
        }
    });

    botaoProximo.addEventListener('click', () => {
        const totalPaginas = Math.ceil(eventosFiltrados.length / eventosPorPagina);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarEventos();
            atualizarPaginacao();
        }
    });
}

function gerenciarFiltroCategoria(e) {
    const valor = e.target.value;
    const marcado = e.target.checked;

    if (valor === 'todos') {
        if (marcado) {
            categoriasSelecionadas = ['todos'];
            // Desmarca apenas os filtros de categoria, não os de tipo
            document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(input => {
                if (input.value !== 'todos' && 
                    input.value !== 'todos-tipos' && 
                    input.value !== 'presencial' && 
                    input.value !== 'online') {
                    input.checked = false;
                }
            });
        }
    } else {
        const checkboxTodos = document.querySelector('input[value="todos"]');
        if (checkboxTodos) {
            checkboxTodos.checked = false;
        }

        if (marcado) {
            categoriasSelecionadas = categoriasSelecionadas.filter(cat => cat !== 'todos');
            categoriasSelecionadas.push(valor);
        } else {
            categoriasSelecionadas = categoriasSelecionadas.filter(cat => cat !== valor);
        }

        if (categoriasSelecionadas.length === 0) {
            categoriasSelecionadas = ['todos'];
            if (checkboxTodos) {
                checkboxTodos.checked = true;
            }
        }
    }

    aplicarFiltros();
}

function gerenciarFiltroTipo(e) {
    const valor = e.target.value;
    const marcado = e.target.checked;

    if (valor === 'todos-tipos') {
        if (marcado) {
            tiposSelecionados = ['todos-tipos'];
            // Desmarca outros filtros de tipo
            document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(input => {
                if (input.value === 'presencial' || input.value === 'online') {
                    input.checked = false;
                }
            });
        }
    } else {
        const checkboxTodosTipos = document.querySelector('input[value="todos-tipos"]');
        if (checkboxTodosTipos) {
            checkboxTodosTipos.checked = false;
        }

        if (marcado) {
            tiposSelecionados = tiposSelecionados.filter(tipo => tipo !== 'todos-tipos');
            tiposSelecionados.push(valor);
        } else {
            tiposSelecionados = tiposSelecionados.filter(tipo => tipo !== valor);
        }

        if (tiposSelecionados.length === 0) {
            tiposSelecionados = ['todos-tipos'];
            if (checkboxTodosTipos) {
                checkboxTodosTipos.checked = true;
            }
        }
    }

    aplicarFiltros();
}

function gerenciarBusca() {
    termoBusca = inputBusca.value.toLowerCase().trim();
    aplicarFiltros();
}

function normalizarTexto(texto) {
    return (texto || '').toLowerCase().trim();
}

function aplicarFiltros() {
    eventosFiltrados = dadosEventos.filter(evento => {
        const categoriaEvento = (evento.categoria || '').toLowerCase();
        const categoriasNorm = categoriasSelecionadas.map(cat => cat.toLowerCase());
        const categoriaValida = categoriasNorm.includes('todos') || categoriasNorm.includes(categoriaEvento);

        const tipoValido = tiposSelecionados.includes('todos-tipos') ||
            tiposSelecionados.includes(evento.tipo_evento);

        const buscaValida = termoBusca === '' ||
            evento.titulo.toLowerCase().includes(termoBusca) ||
            evento.local.toLowerCase().includes(termoBusca);

        return categoriaValida && tipoValido && buscaValida;
    });

    paginaAtual = 1;
    renderizarEventos();
    atualizarPaginacao();
    atualizarCabecalhoEventos();
}

function atualizarCabecalhoEventos() {
    const cabecalhoEventos = document.querySelector('.events-header h1');
    const totalEventos = eventosFiltrados.length;

    if (cabecalhoEventos) {
        let textoCabecalho = '';
        
        if (termoBusca) {
            textoCabecalho = `Resultados para "${termoBusca}"`;
        } else if (!categoriasSelecionadas.includes('todos') || !tiposSelecionados.includes('todos-tipos')) {
            const filtros = [];
            
            if (!categoriasSelecionadas.includes('todos')) {
                const textoCategoria = categoriasSelecionadas.map(cat => nomeCategorias[cat]).join(', ');
                filtros.push(textoCategoria);
            }
            
            if (!tiposSelecionados.includes('todos-tipos')) {
                const textoTipo = tiposSelecionados.map(tipo => nomeTipos[tipo]).join(', ');
                filtros.push(textoTipo);
            }
            
            textoCabecalho = filtros.join(' - ');
        } else {
            textoCabecalho = 'Todos os Eventos';
        }
        
        cabecalhoEventos.textContent = `${textoCabecalho} (${totalEventos} eventos)`;
    }
}

function renderizarEventos() {
    if (!gradeEventos) return;

    gradeEventos.innerHTML = '<div class="loading">Carregando eventos...</div>';

    setTimeout(() => {
        if (eventosFiltrados.length === 0) {
            gradeEventos.innerHTML = '<div class="no-results"><h3>Nenhum evento encontrado</h3><p>Tente ajustar seus filtros.</p></div>';
            return;
        }

        const indiceInicio = (paginaAtual - 1) * eventosPorPagina;
        const indiceFim = indiceInicio + eventosPorPagina;
        const eventosMostrar = eventosFiltrados.slice(indiceInicio, indiceFim);

        gradeEventos.innerHTML = eventosMostrar.map(evento => criarCardEvento(evento)).join('');

        adicionarEventListenersCards();
    }, 300);
}

function criarCardEvento(evento) {
    const tipoIcone = evento.tipo_evento === 'online' ? '💻' : '📍';
    const tipoTexto = evento.tipo_evento === 'online' ? 'Online' : 'Presencial';
    
    // Calcular vagas restantes
    const vagasRestantes = evento.vagas_disponiveis - (evento.inscritos || 0);
    const vagasStatus = vagasRestantes > 0 ? `${vagasRestantes} vagas` : 'Lotado';
    const vagasClass = vagasRestantes > 0 ? 'vagas-disponiveis' : 'vagas-lotado';
    
    // Formatar local com os novos campos
    let localFormatado = 'Local a definir';
    if (evento.tipo_evento === 'online') {
        localFormatado = 'Evento Online';
    } else if (evento.nome_local && evento.endereco_local) {
        localFormatado = `${evento.nome_local} - ${evento.endereco_local}`;
        if (evento.cidade_local && evento.estado_local) {
            localFormatado += `, ${evento.cidade_local}/${evento.estado_local}`;
        }
    } else if (evento.local) {
        localFormatado = evento.local;
    }
    
    // Verificar se o usuário está logado
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
    const botaoInscricao = usuario ? 
        `<button class="btn-inscrever" onclick="inscreverEvento(${evento.id_evento}, event)" data-evento-id="${evento.id_evento}">
            ${evento.inscrito ? 'Cancelar Inscrição' : 'Inscrever-se'}
        </button>` : 
        `<button class="btn-inscrever" onclick="window.location.href='/paginas/pagina de cadastro/login.html'">
            Faça login para se inscrever
        </button>`;
    
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
                <div class="event-location">📍 ${evento.nome_local ? `${evento.nome_local} - ${evento.endereco_local || evento.local || 'Local a definir'}` : (evento.local || 'Local a definir')}</div>
                <div class="event-time">🕒 ${evento.hora_inicio}</div>
                <div class="event-type">${tipoIcone} ${tipoTexto}</div>
                <div class="event-category">${evento.categoria}</div>
                <div class="event-organizer">👤 ${evento.nome_organizador}</div>
                <div class="${vagasClass}">🎫 ${vagasStatus}</div>
                ${botaoInscricao}
            </div>
        </div>
    `;
}

function adicionarEventListenersCards() {
    const cardsEventos = document.querySelectorAll('.event-card');
    cardsEventos.forEach(card => {
        card.addEventListener('click', () => {
            const eventoId = card.dataset.eventoId;
            gerenciarCliqueEvento(eventoId);
        });
    });
}

function gerenciarCliqueEvento(eventoId) {
    // Redirecionar para a página de detalhes do evento
    window.location.href = `/paginas/pagina exibição de eventos/detalhe_evento.html?id=${eventoId}`;
}

function atualizarPaginacao() {
    const totalPaginas = Math.ceil(eventosFiltrados.length / eventosPorPagina);

    if (botaoAnterior) {
        botaoAnterior.disabled = paginaAtual === 1;
    }

    if (botaoProximo) {
        botaoProximo.disabled = paginaAtual === totalPaginas || totalPaginas === 0;
    }

    if (numeroPaginas) {
        numeroPaginas.innerHTML = '';

        if (totalPaginas <= 1) return;

        for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {
            const elementoPagina = document.createElement('span');
            elementoPagina.className = `page-number ${i === paginaAtual ? 'active' : ''}`;
            elementoPagina.textContent = i;
            elementoPagina.addEventListener('click', () => {
                paginaAtual = i;
                renderizarEventos();
                atualizarPaginacao();
            });
            numeroPaginas.appendChild(elementoPagina);
        }
    }
}

// Função para inscrever usuário em evento
async function inscreverEvento(idEvento, event) {
    event.stopPropagation(); // Evita que o clique propague para o card
    
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) {
        window.location.href = '/paginas/pagina de cadastro/login.html';
        return;
    }

    const botao = event.target;
    const estaInscrito = botao.textContent.includes('Cancelar');

    try {
        const url = estaInscrito ? 
            `http://localhost:8080/eventos/${idEvento}/inscrever` :
            `http://localhost:8080/eventos/${idEvento}/inscrever`;
        
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
            
            // Mostrar mensagem de sucesso
            mostrarMensagem(data.message, 'success');
            
            // Recarregar eventos para atualizar contadores
            await carregarEventosDoServidor();
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

// Função para verificar inscrições do usuário
async function verificarInscricoesUsuario() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;

    try {
        const promises = dadosEventos.map(evento => 
            fetch(`http://localhost:8080/eventos/${evento.id_evento}/inscricao/${usuario.id_usuario}`)
                .then(res => res.json())
                .then(data => ({ id_evento: evento.id_evento, inscrito: data.inscrito }))
        );

        const inscricoes = await Promise.all(promises);
        
        // Atualizar dados dos eventos com status de inscrição
        dadosEventos.forEach(evento => {
            const inscricao = inscricoes.find(i => i.id_evento === evento.id_evento);
            if (inscricao) {
                evento.inscrito = inscricao.inscrito;
            }
        });
    } catch (error) {
        console.error('Erro ao verificar inscrições:', error);
    }
}

// Função para obter parâmetros da URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Função para verificar se deve mostrar eventos específicos do usuário
function verificarFiltrosUsuario() {
    const meusEventos = getUrlParameter('meus_eventos');
    if (meusEventos) {
        filtroMeusEventos = meusEventos;
        atualizarCabecalhoEventos();
    }
}

// Função para atualizar o cabeçalho baseado nos filtros
function atualizarCabecalhoEventos() {
    const tituloElement = document.querySelector('.events-header h1');
    if (tituloElement) {
        if (filtroMeusEventos === 'criados') {
            tituloElement.textContent = 'Meus Eventos Criados';
        } else if (filtroMeusEventos === 'inscritos') {
            tituloElement.textContent = 'Eventos Inscritos';
        } else {
            tituloElement.textContent = 'Todos os Eventos';
        }
    }
} 