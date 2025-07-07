document.addEventListener('DOMContentLoaded', function () {
    const formLogin = document.getElementById('formLogin');

    function mostrarMensagem(mensagem, tipo) {
        const mensagemExistente = document.querySelector('.message');
        if (mensagemExistente) {
            mensagemExistente.remove();
        }

        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `message ${tipo}`;
        mensagemDiv.textContent = mensagem;

        const form = document.querySelector('.form');
        if (form) {
            form.parentNode.insertBefore(mensagemDiv, form);
        }
    }

    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    if (formLogin) {
        formLogin.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;
            const lembrar = document.getElementById('lembrar').checked;

            if (!email || !senha) {
                mostrarMensagem('Por favor, preencha todos os campos', 'error');
                return;
            }

            if (!validarEmail(email)) {
                mostrarMensagem('Por favor, insira um email válido', 'error');
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (response.ok) {

                    mostrarMensagem(data.message, 'success');

                    localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));

                    if (lembrar) {
                        localStorage.setItem('emailUsuario', email);
                    }
                    setTimeout(() => {
                        window.location.href = '/paginas/home/Home.html';
                    }, 2000);
                } else {
                    mostrarMensagem(data.message, 'error');
                }
            } catch (err) {
                console.error('Erro na requisição de login:', err);
                mostrarMensagem('Erro de conexão com o servidor.', 'error');
            }
        });
    }

    // Preenche automaticamente se estiver salvo no localStorage
    const emailSalvo = localStorage.getItem('emailUsuario');
    if (emailSalvo) {
        const emailInput = document.getElementById('email');
        const lembrarCheckbox = document.getElementById('lembrar');
        if (emailInput) emailInput.value = emailSalvo;
        if (lembrarCheckbox) lembrarCheckbox.checked = true;
    }
});
