require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://janelacultural-production.up.railway.app'],
}));


// Middlewares
app.use(express.json());
app.use(express.static('public')); // Serve arquivos HTML/CSS/JS da pasta 'public'

// Favicon route to prevent CSP errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});

// CSP middleware to allow favicon and other resources
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' data:;");
    next();
});

// PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Verifica conexão
pool.connect((err, client, done) => {
    if (err) {
        console.error('Deu ruim no banco:', err);
        return;
    }
    console.log('Finalmente conectado, agora vai!');
    client.release();
});

// Rota de cadastro
app.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        await pool.query(
            'INSERT INTO usuarios (nome_completo, email, senha) VALUES ($1, $2, $3)',
            [nome, email, senhaCriptografada]
        );

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
    }
});


//rota login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = resultado.rows[0];

        if (!usuario) {
            return res.status(401).json({ message: 'Usuário não encontrado.' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        // Autenticado com sucesso
        res.status(200).json({
            message: 'Login realizado com sucesso!',
            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome_completo
            }
        });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        res.status(500).json({ message: 'Erro ao realizar login.' });
    }
});


app.post('/eventos', async (req, res) => {
    const {
        titulo,
        descricao,
        data_inicio,
        data_fim,
        hora_inicio,
        hora_fim,
        tipo_evento,
        local, // endereço completo
        nomeLocal, // nome do local
        cidade, // cidade
        estado, // estado
        linkOnline, // string do input
        categoria,
        id_organizador, // precisa obter do login ou simular com valor fixo
        vagas_disponiveis
    } = req.body;

    // Verificar se o id_organizador foi fornecido
    if (!id_organizador) {
        return res.status(401).json({ message: 'Usuário não autenticado. Faça login para criar eventos.' });
    }

    try {
        // Verificar se o usuário existe no banco
        const userCheck = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE id_usuario = $1',
            [id_organizador]
        );

        if (userCheck.rows.length === 0) {
            return res.status(401).json({ message: 'Usuário não encontrado. Faça login novamente.' });
        }

        // Verifica ou insere o local
        let id_local = null;
        if (tipo_evento === 'presencial' && local) {
            const resultado = await pool.query(
                'INSERT INTO Local (nome, endereco, cidade, estado) VALUES ($1, $2, $3, $4) RETURNING id_local',
                [nomeLocal || 'Local não informado', local, cidade || '', estado || '']
            );
            id_local = resultado.rows[0].id_local;
        }

        // Obter id_categoria baseado no nome
        const catResult = await pool.query(
            'SELECT id_categoria FROM Categoria WHERE nome = $1',
            [categoria]
        );
        const id_categoria = catResult.rows[0]?.id_categoria;

        if (!id_categoria) {
            return res.status(400).json({ message: 'Categoria inválida.' });
        }

        // Inserir o evento
        await pool.query(
            `INSERT INTO Evento (
                titulo, descricao, data_inicio, data_fim,
                hora_inicio, hora_fim, tipo_evento,
                vagas_disponiveis, id_local, id_categoria, id_organizador
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
                titulo, descricao, data_inicio, data_fim,
                hora_inicio, hora_fim, tipo_evento,
                vagas_disponiveis, id_local, id_categoria, id_organizador
            ]
        );

        res.status(201).json({ message: 'Evento criado com sucesso!' });
    } catch (err) {
        console.error('Erro ao criar evento:', err);
        res.status(500).json({ message: 'Erro ao criar evento.' });
    }
});

//pegar eventos no banco

app.get('/eventos', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT 
                e.id_evento,
                e.titulo,
                e.descricao,
                e.data_inicio,
                e.hora_inicio,
                e.hora_fim,
                e.tipo_evento,
                e.vagas_disponiveis,
                l.nome AS nome_local,
                l.endereco AS endereco_local,
                l.cidade AS cidade_local,
                l.estado AS estado_local,
                l.endereco AS local,
                c.nome AS categoria,
                u.nome_completo AS nome_organizador,
                COUNT(i.id_inscricao) AS inscritos
            FROM Evento e
            LEFT JOIN Local l ON e.id_local = l.id_local
            LEFT JOIN Categoria c ON e.id_categoria = c.id_categoria
            LEFT JOIN usuarios u ON e.id_organizador = u.id_usuario
            LEFT JOIN Inscricao i ON e.id_evento = i.id_evento
            GROUP BY e.id_evento, e.titulo, e.descricao, e.data_inicio, e.hora_inicio, 
                     e.hora_fim, e.tipo_evento, e.vagas_disponiveis, l.nome, l.endereco, 
                     l.cidade, l.estado, c.nome, u.nome_completo
            ORDER BY e.data_inicio
        `);
        res.json(resultado.rows);
    } catch (erro) {
        console.error('Erro ao buscar eventos:', erro);
        res.status(500).json({ erro: 'Erro ao buscar eventos' });
    }
});

// Endpoint para buscar um evento específico por ID
app.get('/eventos/:id_evento', async (req, res) => {
    const { id_evento } = req.params;

    // Validar se o id_evento é um número válido
    if (!id_evento || isNaN(parseInt(id_evento))) {
        return res.status(400).json({ message: 'ID do evento inválido' });
    }

    try {
        const resultado = await pool.query(`
            SELECT 
                e.id_evento,
                e.titulo,
                e.descricao,
                e.data_inicio,
                e.data_fim,
                e.hora_inicio,
                e.hora_fim,
                e.tipo_evento,
                e.vagas_disponiveis,
                l.nome AS nome_local,
                l.endereco AS endereco_local,
                l.cidade AS cidade_local,
                l.estado AS estado_local,
                l.endereco AS local,
                c.nome AS categoria,
                u.nome_completo AS nome_organizador,
                COUNT(i.id_inscricao) AS inscritos
            FROM Evento e
            LEFT JOIN Local l ON e.id_local = l.id_local
            LEFT JOIN Categoria c ON e.id_categoria = c.id_categoria
            LEFT JOIN usuarios u ON e.id_organizador = u.id_usuario
            LEFT JOIN Inscricao i ON e.id_evento = i.id_evento
            WHERE e.id_evento = $1
            GROUP BY e.id_evento, e.titulo, e.descricao, e.data_inicio, e.data_fim,
                     e.hora_inicio, e.hora_fim, e.tipo_evento, e.vagas_disponiveis,
                     l.nome, l.endereco, l.cidade, l.estado, c.nome, u.nome_completo
        `, [parseInt(id_evento)]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ message: 'Evento não encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error('Erro ao buscar evento:', erro);
        res.status(500).json({ message: 'Erro ao buscar evento' });
    }
});

// Endpoint para inscrever usuário em evento
app.post('/eventos/:id_evento/inscrever', async (req, res) => {
    const { id_evento } = req.params;
    const { id_usuario } = req.body;

    if (!id_usuario) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
        // Verificar se o usuário existe
        const userCheck = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE id_usuario = $1',
            [id_usuario]
        );

        if (userCheck.rows.length === 0) {
            return res.status(401).json({ message: 'Usuário não encontrado.' });
        }

        // Verificar se o evento existe e tem vagas disponíveis
        const eventoCheck = await pool.query(`
            SELECT e.vagas_disponiveis, COUNT(i.id_inscricao) as inscritos
            FROM Evento e
            LEFT JOIN Inscricao i ON e.id_evento = i.id_evento
            WHERE e.id_evento = $1
            GROUP BY e.vagas_disponiveis
        `, [id_evento]);

        if (eventoCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        const evento = eventoCheck.rows[0];
        const vagasOcupadas = parseInt(evento.inscritos) || 0;
        const vagasDisponiveis = parseInt(evento.vagas_disponiveis);

        if (vagasOcupadas >= vagasDisponiveis) {
            return res.status(400).json({ message: 'Evento lotado. Não há mais vagas disponíveis.' });
        }

        // Verificar se o usuário já está inscrito
        const inscricaoExistente = await pool.query(
            'SELECT id_inscricao FROM Inscricao WHERE id_evento = $1 AND id_usuario = $2',
            [id_evento, id_usuario]
        );

        if (inscricaoExistente.rows.length > 0) {
            return res.status(400).json({ message: 'Você já está inscrito neste evento.' });
        }

        // Fazer a inscrição
        await pool.query(
            'INSERT INTO Inscricao (id_evento, id_usuario, data_inscricao) VALUES ($1, $2, NOW())',
            [id_evento, id_usuario]
        );

        res.status(201).json({ message: 'Inscrição realizada com sucesso!' });
    } catch (err) {
        console.error('Erro ao inscrever usuário:', err);
        res.status(500).json({ message: 'Erro ao realizar inscrição.' });
    }
});

// Endpoint para cancelar inscrição
app.delete('/eventos/:id_evento/inscrever', async (req, res) => {
    const { id_evento } = req.params;
    const { id_usuario } = req.body;

    if (!id_usuario) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
        // Verificar se a inscrição existe
        const inscricaoCheck = await pool.query(
            'SELECT id_inscricao FROM Inscricao WHERE id_evento = $1 AND id_usuario = $2',
            [id_evento, id_usuario]
        );

        if (inscricaoCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Inscrição não encontrada.' });
        }

        // Cancelar a inscrição
        await pool.query(
            'DELETE FROM Inscricao WHERE id_evento = $1 AND id_usuario = $2',
            [id_evento, id_usuario]
        );

        res.json({ message: 'Inscrição cancelada com sucesso!' });
    } catch (err) {
        console.error('Erro ao cancelar inscrição:', err);
        res.status(500).json({ message: 'Erro ao cancelar inscrição.' });
    }
});

// Endpoint para verificar se usuário está inscrito em um evento
app.get('/eventos/:id_evento/inscricao/:id_usuario', async (req, res) => {
    const { id_evento, id_usuario } = req.params;

    try {
        const inscricao = await pool.query(
            'SELECT id_inscricao FROM Inscricao WHERE id_evento = $1 AND id_usuario = $2',
            [id_evento, id_usuario]
        );

        res.json({ inscrito: inscricao.rows.length > 0 });
    } catch (err) {
        console.error('Erro ao verificar inscrição:', err);
        res.status(500).json({ message: 'Erro ao verificar inscrição.' });
    }
});

// Endpoint para buscar eventos criados por um usuário específico
app.get('/eventos/usuario/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    if (!id_usuario || isNaN(parseInt(id_usuario))) {
        return res.status(400).json({ message: 'ID do usuário inválido' });
    }

    try {
        const resultado = await pool.query(`
            SELECT 
                e.id_evento,
                e.titulo,
                e.descricao,
                e.data_inicio,
                e.hora_inicio,
                e.hora_fim,
                e.tipo_evento,
                e.vagas_disponiveis,
                l.nome AS nome_local,
                l.endereco AS endereco_local,
                l.cidade AS cidade_local,
                l.estado AS estado_local,
                l.endereco AS local,
                c.nome AS categoria,
                u.nome_completo AS nome_organizador,
                COUNT(i.id_inscricao) AS inscritos
            FROM Evento e
            LEFT JOIN Local l ON e.id_local = l.id_local
            LEFT JOIN Categoria c ON e.id_categoria = c.id_categoria
            LEFT JOIN usuarios u ON e.id_organizador = u.id_usuario
            LEFT JOIN Inscricao i ON e.id_evento = i.id_evento
            WHERE e.id_organizador = $1
            GROUP BY e.id_evento, e.titulo, e.descricao, e.data_inicio, e.hora_inicio, 
                     e.hora_fim, e.tipo_evento, e.vagas_disponiveis, l.nome, l.endereco, 
                     l.cidade, l.estado, c.nome, u.nome_completo
            ORDER BY e.data_inicio
        `, [parseInt(id_usuario)]);

        res.json(resultado.rows);
    } catch (erro) {
        console.error('Erro ao buscar eventos do usuário:', erro);
        res.status(500).json({ erro: 'Erro ao buscar eventos do usuário' });
    }
});

// Endpoint para buscar eventos em que um usuário está inscrito
app.get('/eventos/inscritos/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    if (!id_usuario || isNaN(parseInt(id_usuario))) {
        return res.status(400).json({ message: 'ID do usuário inválido' });
    }

    try {
        const resultado = await pool.query(`
            SELECT 
                e.id_evento,
                e.titulo,
                e.descricao,
                e.data_inicio,
                e.hora_inicio,
                e.hora_fim,
                e.tipo_evento,
                e.vagas_disponiveis,
                l.nome AS nome_local,
                l.endereco AS endereco_local,
                l.cidade AS cidade_local,
                l.estado AS estado_local,
                l.endereco AS local,
                c.nome AS categoria,
                u.nome_completo AS nome_organizador,
                COUNT(i2.id_inscricao) AS inscritos
            FROM Evento e
            LEFT JOIN Local l ON e.id_local = l.id_local
            LEFT JOIN Categoria c ON e.id_categoria = c.id_categoria
            LEFT JOIN usuarios u ON e.id_organizador = u.id_usuario
            LEFT JOIN Inscricao i2 ON e.id_evento = i2.id_evento
            INNER JOIN Inscricao i ON e.id_evento = i.id_evento AND i.id_usuario = $1
            GROUP BY e.id_evento, e.titulo, e.descricao, e.data_inicio, e.hora_inicio, 
                     e.hora_fim, e.tipo_evento, e.vagas_disponiveis, l.nome, l.endereco, 
                     l.cidade, l.estado, c.nome, u.nome_completo
            ORDER BY e.data_inicio
        `, [parseInt(id_usuario)]);

        res.json(resultado.rows);
    } catch (erro) {
        console.error('Erro ao buscar eventos inscritos:', erro);
        res.status(500).json({ erro: 'Erro ao buscar eventos inscritos' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
