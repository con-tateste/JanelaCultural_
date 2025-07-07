document.addEventListener('DOMContentLoaded', function () {
    const nomeUsuario = document.getElementById('nomeUsuario');
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    if (usuarioLogado) {
        try {
            const usuario = JSON.parse(usuarioLogado);
            nomeUsuario.textContent = usuario.nome || 'Nome não encontrado';
        } catch (e) {
            nomeUsuario.textContent = 'Erro ao carregar nome.';
        }
    } else {
        nomeUsuario.textContent = 'Usuário não logado.';
    }
});
