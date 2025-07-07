document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o usuário está logado
    let usuario = null;

    try {
        usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    } catch (erro) {
        console.warn('Erro ao ler dados do localStorage:', erro);
        usuario = null;
    }

    if (!usuario || !usuario.id_usuario) {
        // Usuário não está logado, mostrar mensagem e redirecionar
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="container">
                    <div class="login-required">
                        <div class="login-required-content">
                            <h2>🔒 Acesso Restrito</h2>
                            <p>Para criar e compartilhar eventos incríveis, você precisa estar logado em sua conta.</p>
                            <p><strong>Faça login ou crie uma conta gratuita para começar!</strong></p>
                            <div class="login-actions">
                                <button class="btn-primary" onclick="window.location.href='/paginas/pagina de cadastro/login.html'">
                                    🔑 Fazer Login
                                </button>
                                <button class="btn-secondary" onclick="window.location.href='/paginas/pagina de cadastro/cadastro.html'">
                                    ✨ Criar Conta
                                </button>
                            </div>
                            <div class="back-home">
                                <a href="/paginas/home/Home.html">← Voltar para a página inicial</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        return;
    }

    // Configurar validação da data final
    const dataInicioInput = document.getElementById('dataInicio');
    const dataFimInput = document.getElementById('dataFim');
    
    dataInicioInput.addEventListener('change', function() {
        dataFimInput.min = this.value;
        if (dataFimInput.value && dataFimInput.value < this.value) {
            dataFimInput.value = this.value;
        }
    });

    // Formulário de evento
    document.getElementById('formularioEvento').addEventListener('submit', async function (evento) {
        evento.preventDefault();

        // Validação da data final
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        
        if (dataFim && dataFim < dataInicio) {
            alert('A data de término não pode ser anterior à data de início.');
            return;
        }

        const dados = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            data_inicio: document.getElementById('dataInicio').value,
            data_fim: document.getElementById('dataFim').value || document.getElementById('dataInicio').value,
            hora_inicio: document.getElementById('horaInicio').value,
            hora_fim: document.getElementById('horaTermino').value,
            tipo_evento: document.querySelector('input[name="tipo"]:checked').value,
            local: document.getElementById('local').value,
            nomeLocal: document.getElementById('nomeLocal').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value,
            linkOnline: document.getElementById('linkOnline').value,
            categoria: document.getElementById('categoria').value,
            vagas_disponiveis: document.getElementById('vagasDisponiveis').value,
            id_organizador: usuario.id_usuario // Usar o ID do usuário logado
        };

        try {
            const resposta = await fetch('http://localhost:8080/eventos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (resposta.ok) {
                document.getElementById('alertaSucesso').style.display = 'block';
                this.reset();
            } else {
                document.getElementById('alertaErro').style.display = 'block';
            }

            setTimeout(() => {
                document.getElementById('alertaSucesso').style.display = 'none';
                document.getElementById('alertaErro').style.display = 'none';
            }, 5000);

            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Erro ao enviar evento:', error);
            alert('Erro ao enviar evento.');
        }
    });
});

// As funções de interação com o formulário continuam iguais:
function selecionarTipo(tipo) {
    document.querySelectorAll('.type-option').forEach(elemento => elemento.classList.remove('selected'));
    event.target.closest('.type-option').classList.add('selected');

    if (tipo === 'online') {
        document.getElementById('grupoLocal').style.display = 'none';
        document.getElementById('grupoEndereco').style.display = 'none';
        document.getElementById('grupoLink').style.display = 'block';
        document.getElementById('nomeLocal').removeAttribute('required');
        document.getElementById('local').removeAttribute('required');
        document.getElementById('cidade').removeAttribute('required');
        document.getElementById('estado').removeAttribute('required');
        document.getElementById('linkOnline').setAttribute('required', 'required');
    } else {
        document.getElementById('grupoLocal').style.display = 'block';
        document.getElementById('grupoEndereco').style.display = 'block';
        document.getElementById('grupoLink').style.display = 'none';
        document.getElementById('nomeLocal').setAttribute('required', 'required');
        document.getElementById('local').setAttribute('required', 'required');
        document.getElementById('cidade').setAttribute('required', 'required');
        document.getElementById('estado').setAttribute('required', 'required');
        document.getElementById('linkOnline').removeAttribute('required');
    }
}

function limparFormulario() {
    document.getElementById('formularioEvento').reset();
    document.querySelectorAll('.selected').forEach(elemento => elemento.classList.remove('selected'));
    document.getElementById('grupoLocal').style.display = 'block';
    document.getElementById('grupoEndereco').style.display = 'block';
    document.getElementById('grupoLink').style.display = 'none';
    document.getElementById('barraProgresso').style.width = '0%';
}

function manipularSelecaoArquivo(input) {
    const arquivo = input.files[0];
    if (arquivo) {
        const tamanhoMaximo = 5 * 1024 * 1024;
        if (arquivo.size > tamanhoMaximo) {
            alert('Arquivo muito grande. Tamanho máximo: 5MB');
            input.value = '';
            return;
        }

        const label = input.nextElementSibling;
        label.innerHTML = `
        <div class="file-upload-text">
            ✅ ${arquivo.name}<br>
            <small>Arquivo selecionado com sucesso</small>
        </div>`;
    }
}

document.getElementById('formularioEvento').addEventListener('input', function () {
    const camposObrigatorios = this.querySelectorAll('input[required], select[required], textarea[required]');
    const camposPreenchidos = Array.from(camposObrigatorios).filter(campo => campo.value.trim() !== '').length;
    const progresso = (camposPreenchidos / camposObrigatorios.length) * 100;
    document.getElementById('barraProgresso').style.width = progresso + '%';
});
