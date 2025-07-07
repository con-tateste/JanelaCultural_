document.addEventListener('DOMContentLoaded', function () {
  const formCadastro = document.getElementById('formCadastro');

  function mostrarMensagem(mensagem, tipo) {
    const mensagemExistente = document.querySelector('.message');
    if (mensagemExistente) mensagemExistente.remove();

    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `message ${tipo}`;
    mensagemDiv.textContent = mensagem;

    const form = document.querySelector('.form');
    if (form) form.parentNode.insertBefore(mensagemDiv, form);
  }

  function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function formatarTelefone(telefone) {
    const limpo = telefone.replace(/\D/g, '');
    if (limpo.length === 11) return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
    if (limpo.length === 10) return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
    return telefone;
  }

  const telefoneInput = document.getElementById('telefone');
  if (telefoneInput) {
    telefoneInput.addEventListener('input', function (e) {
      e.target.value = formatarTelefone(e.target.value);
    });
  }

  if (formCadastro) {
    formCadastro.addEventListener('submit', async function (e) {
      e.preventDefault();

      const nome = document.getElementById('nome').value.trim();
      const email = document.getElementById('email').value.trim();
      const telefone = document.getElementById('telefone').value.trim();
      const senha = document.getElementById('senha').value;
      const confirmarSenha = document.getElementById('confirmarSenha').value;

      if (!nome || !email || !senha || !confirmarSenha || !telefone) {
        mostrarMensagem('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
      }

      if (!validarEmail(email)) {
        mostrarMensagem('Por favor, insira um email válido', 'error');
        return;
      }

      if (senha.length < 6) {
        mostrarMensagem('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
      }

      if (senha !== confirmarSenha) {
        mostrarMensagem('As senhas não coincidem', 'error');
        return;
      }

      // ENVIA PARA O SERVIDOR
      try {
        const response = await fetch('http://localhost:8080/cadastro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, telefone, senha })
        });

        const data = await response.json();

        if (response.ok) {
          mostrarMensagem(data.message, 'success');
          formCadastro.reset();
          setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
          mostrarMensagem(data.message || 'Erro ao cadastrar.', 'error');
        }
      } catch (err) {
        console.error('Erro na requisição:', err);
        mostrarMensagem('Erro de conexão com o servidor.', 'error');
      }
    });
  }
});
