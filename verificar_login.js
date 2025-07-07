document.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');

    if (usuario) {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        // Remove botões padrão
        const loginLink = document.getElementById('botao_entrar');
        const cadastroLink = document.getElementById('botao_cadastar');
        if (loginLink) loginLink.remove();
        if (cadastroLink) cadastroLink.remove();

        // Container do menu do usuário
        const userMenuContainer = document.createElement('div');
        userMenuContainer.className = 'user-menu-container';
        
        // Ícone do usuário
        const userIcon = document.createElement('a');
        userIcon.href = '#';
        userIcon.className = 'user-icon-link';
        userIcon.innerHTML = `<img src="/assets/icone_usuario.png" alt="Usuário" class="icone-usuario" style="width: 35px; height: 35px; max-width: 35px; max-height: 35px; object-fit: cover;">`;
        
        // Menu dropdown
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <div class="user-menu-header">
                <span>Meu Perfil</span>
            </div>
            <div class="user-menu-item">
                <a href="/paginas/pagina perfil usuario/perfil.html">
                    <span>👤</span> Perfil
                </a>
            </div>
            <div class="user-menu-item">
                <a href="/paginas/pagina exibição de eventos/exibição_eventos.html?meus_eventos=criados">
                    <span>📝</span> Meus Eventos Criados
                </a>
            </div>
            <div class="user-menu-item">
                <a href="/paginas/pagina exibição de eventos/exibição_eventos.html?meus_eventos=inscritos">
                    <span>🎫</span> Eventos Inscritos
                </a>
            </div>
            <div class="user-menu-divider"></div>
            <div class="user-menu-item">
                <button class="btn-logout-menu">
                    <span>🚪</span> Sair
                </button>
            </div>
        `;
        
        userMenuContainer.appendChild(userIcon);
        userMenuContainer.appendChild(userMenu);
        nav.appendChild(userMenuContainer);

        // Event listeners para o menu
        userIcon.addEventListener('click', (e) => {
            e.preventDefault();
            userMenu.classList.toggle('active');
        });

        // Fechar menu quando clicar fora
        document.addEventListener('click', (e) => {
            if (!userMenuContainer.contains(e.target)) {
                userMenu.classList.remove('active');
            }
        });

        // Botão sair do menu
        const logoutBtn = userMenu.querySelector('.btn-logout-menu');
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogado');
            window.location.href = '/paginas/home/Home.html';
        });
    }
});
