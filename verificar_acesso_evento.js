// Script para verificar acesso ao cadastro de eventos
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o usuário está logado
    let usuario = null;

    try {
        usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    } catch (erro) {
        console.warn('Erro ao ler dados do localStorage:', erro);
        usuario = null;
    }

    // Função para interceptar cliques no link "Criar evento"
    function interceptarCriarEvento(event) {
        if (!usuario || !usuario.id_usuario) {
            event.preventDefault();
            
            // Mostrar modal de acesso restrito
            const modal = document.createElement('div');
            modal.className = 'modal-acesso-restrito';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔒 Acesso Restrito</h3>
                        <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <p>Para criar e compartilhar eventos incríveis, você precisa estar logado em sua conta.</p>
                        <p><strong>Faça login ou crie uma conta gratuita para começar!</strong></p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-primary" onclick="window.location.href='/paginas/pagina de cadastro/login.html'">
                            🔑 Fazer Login
                        </button>
                        <button class="btn-secondary" onclick="window.location.href='/paginas/pagina de cadastro/cadastro.html'">
                            ✨ Criar Conta
                        </button>
                        <button class="btn-cancel" onclick="this.parentElement.parentElement.parentElement.remove()">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Adicionar estilos inline para o modal
            const style = document.createElement('style');
            style.textContent = `
                .modal-acesso-restrito {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 15px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #eee;
                }
                
                .modal-header h3 {
                    color: #8e44ad;
                    margin: 0;
                }
                
                .close-modal {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                }
                
                .modal-body {
                    padding: 1.5rem;
                }
                
                .modal-body p {
                    margin: 0.5rem 0;
                    color: #666;
                    line-height: 1.6;
                }
                
                .modal-footer {
                    padding: 1.5rem;
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                }
                
                .btn-primary, .btn-secondary, .btn-cancel {
                    padding: 0.75rem 1.5rem;
                    border-radius: 25px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                }
                
                .btn-primary {
                    background: #8e44ad;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #7d3c98;
                }
                
                .btn-secondary {
                    background: #f8f9fa;
                    color: #333;
                    border: 2px solid #8e44ad;
                }
                
                .btn-secondary:hover {
                    background: #8e44ad;
                    color: white;
                }
                
                .btn-cancel {
                    background: #f8f9fa;
                    color: #666;
                    border: 1px solid #ddd;
                }
                
                .btn-cancel:hover {
                    background: #e9ecef;
                }
                
                @media (max-width: 768px) {
                    .modal-footer {
                        flex-direction: column;
                    }
                    
                    .btn-primary, .btn-secondary, .btn-cancel {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Adicionar listener para todos os links "Criar evento"
    const linksCriarEvento = document.querySelectorAll('a[href="/paginas/cadastro de evntos/cadastro_evento.html"]');
    linksCriarEvento.forEach(link => {
        link.addEventListener('click', interceptarCriarEvento);
    });
}); 