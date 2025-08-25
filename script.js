import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- CONFIGURAÇÃO DO SUPABASE ---
// Conecta o nosso site ao backend do Supabase
const supabaseUrl = 'https://wzqlsqjtrkcxbcqhuppm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cWxzcWp0cmtjeGJjcWh1cHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTQwOTMsImV4cCI6MjA3MTYzMDA5M30.5Qvhz8XK_7MSIoG7JRNSbTW_Nz-BLP92wYc4Ok9khII';
const supabase = createClient(supabaseUrl, supabaseKey );


// --- FUNÇÕES GLOBAIS ---

/**
 * Mostra uma mensagem de erro ou sucesso para o usuário
 * @param {string} message - A mensagem a ser exibida
 * @param {boolean} isError - Se a mensagem é de erro (vermelha) ou sucesso (verde)
 */
function showMessage(message, isError = true) {
    const container = document.getElementById('message-container');
    if (container) {
        container.textContent = message;
        container.className = isError ? 'text-center text-red-500 mb-4' : 'text-center text-green-500 mb-4';
    }
}


// --- LÓGICA PARA CADA PÁGINA ---

// Pega o nome do arquivo da página atual (ex: "login.html")
const currentPage = window.location.pathname.split('/').pop();

// --- PÁGINA DE CADASTRO (cadastro.html) ---
if (currentPage === 'cadastro.html') {
    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // 1. Tenta criar o usuário no sistema de autenticação
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) {
            return showMessage('Erro ao cadastrar: ' + authError.message);
        }

        // 2. Se o cadastro deu certo, salva o nome no perfil do usuário
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: authData.user.id, full_name: name, email: email }]);
        
        if (profileError) {
            return showMessage('Erro ao salvar perfil: ' + profileError.message);
        }

        showMessage('Cadastro realizado com sucesso! Você será redirecionado para o login.', false);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    });
}

// --- PÁGINA DE LOGIN (login.html) ---
if (currentPage === 'login.html') {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            return showMessage('Email ou senha inválidos.');
        }

        window.location.href = 'dashboard.html';
    });
}

// --- PÁGINA DO DASHBOARD (dashboard.html) ---
if (currentPage === 'dashboard.html') {
    const userEmailSpan = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');
    const diagnosticsContainer = document.getElementById('diagnostics-container');
    const loadingMessage = document.getElementById('loading-message');

    // 1. Verifica se o usuário está logado
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (!session) {
            // Se não estiver logado, redireciona para a página de login
            window.location.href = 'login.html';
        } else {
            // Se estiver logado, mostra o email e busca os diagnósticos
            userEmailSpan.textContent = session.user.email;
            await loadDiagnostics();
        }
    });

    // 2. Função de Logout
    logoutButton.addEventListener('click', async () => {
        await supabase.auth.signOut();
        // O onAuthStateChange vai detectar o logout e redirecionar
    });

    // 3. Função para carregar os diagnósticos do banco de dados
    async function loadDiagnostics() {
        const { data, error } = await supabase
            .from('diagnostics')
            .select('*')
            .order('created_at', { ascending: false }); // Mais recentes primeiro

        if (error) {
            loadingMessage.textContent = 'Erro ao carregar diagnósticos.';
            return;
        }

        if (data.length === 0) {
            loadingMessage.textContent = 'Nenhum diagnóstico realizado ainda.';
            return;
        }

        loadingMessage.style.display = 'none'; // Esconde a mensagem de "carregando"
        
        // Cria a tabela para exibir os resultados
        const table = document.createElement('table');
        table.className = 'w-full text-left';
        table.innerHTML = `
            <thead>
                <tr class="border-b">
                    <th class="py-2">Data</th>
                    <th class="py-2">Pontuação</th>
                    <th class="py-2">Análise</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');

        data.forEach(diag => {
            const row = document.createElement('tr');
            row.className = 'border-b';
            row.innerHTML = `
                <td class="py-3">${new Date(diag.created_at).toLocaleDateString('pt-BR')}</td>
                <td class="py-3">${diag.score}</td>
                <td class="py-3">${diag.analysis}</td>
            `;
            tbody.appendChild(row);
        });

        diagnosticsContainer.appendChild(table);
    }
}

// --- PÁGINA DO DIAGNÓSTICO (diagnostico.html) ---
if (currentPage === 'diagnostico.html') {
    const quizForm = document.getElementById('quizForm');
    const submitBtn = document.getElementById('submitBtn');

    const questions = [
        { question: "Com que frequência você e seu/sua parceiro(a) conversam abertamente sobre seus sentimentos?", options: ["Sempre", "Frequentemente", "Às vezes", "Raramente"] },
        { question: "Como vocês resolvem desentendimentos?", options: ["Com diálogo calmo", "Com uma discussão acalorada, mas resolvemos", "Evitando o assunto", "Com brigas que não resolvem"] },
        { question: "Você se sente ouvido(a) e compreendido(a) na relação?", options: ["Sim, na maioria das vezes", "Às vezes, depende do assunto", "Raramente", "Não me sinto ouvido(a)"] },
        { question: "Com que frequência vocês fazem atividades juntos que ambos gostam?", options: ["Toda semana", "Algumas vezes no mês", "Raramente", "Quase nunca"] },
        { question: "Vocês compartilham objetivos e planos para o futuro?", options: ["Sim, estamos muito alinhados", "Temos alguns objetivos em comum", "Temos visões muito diferentes", "Não conversamos sobre isso"] },
        { question: "Como você descreveria o nível de confiança mútua?", options: ["Confiança total", "Boa, mas com algumas inseguranças", "Frágil", "Não há confiança"] },
        { question: "Você se sente apoiado(a) em suas decisões e projetos pessoais?", options: ["Totalmente apoiado(a)", "Recebo algum apoio", "Sinto falta de apoio", "Sinto que há desaprovação"] },
        { question: "Com que frequência vocês expressam carinho e admiração um pelo outro?", options: ["Diariamente", "Frequentemente", "Ocasionalmente", "Raramente"] },
        { question: "Quando surge um problema (financeiro, familiar, etc.), como vocês o enfrentam?", options: ["Como uma equipe unida", "Juntos, mas com estresse", "Cada um por si", "Isso gera muitas brigas"] },
        { question: "Olhando para sua relação hoje, qual sentimento predomina?", options: ["Felicidade e parceria", "Conforto, mas com monotonia", "Incerteza e dúvida", "Tristeza e frustração"] }
    ];

    questions.forEach((q, index) => {
        const questionBlock = document.createElement('div');
        questionBlock.className = 'mb-6';
        questionBlock.innerHTML = `
            <p class="text-lg font-semibold text-gray-700 mb-3">${index + 1}. ${q.question}</p>
            <div class="space-y-2">
                ${q.options.map((option, optionIndex) => `
                    <label class="flex items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer">
                        <input type="radio" name="question${index}" value="${3 - optionIndex}" class="mr-3" required>
                        <span>${option}</span>
                    </label>
                `).join('')}
            </div>
        `;
        quizForm.appendChild(questionBlock);
    });

    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!quizForm.checkValidity()) {
            return showMessage("Por favor, responda a todas as perguntas.");
        }
        
        let totalScore = 0;
        const formData = new FormData(quizForm);
        for (let value of formData.values()) {
            totalScore += parseInt(value);
        }

        // Salva o resultado no localStorage para passar para a próxima página
        localStorage.setItem('diagnosisScore', totalScore);
        
        // Salva o diagnóstico no banco de dados
        let analysisText = getAnalysisText(totalScore).title;
        await supabase.from('diagnostics').insert([{ score: totalScore, analysis: analysisText }]);

        window.location.href = 'resultado.html';
    });
}

// --- PÁGINA DE RESULTADO (resultado.html) ---
if (currentPage === 'resultado.html') {
    const score = localStorage.getItem('diagnosisScore');
    const container = document.getElementById('resultado-container');

    if (score === null) {
        container.innerHTML = `<h2 class="text-2xl font-semibold text-red-600 mb-3">Erro</h2><p class="text-gray-600">Nenhuma pontuação encontrada. Por favor, realize o diagnóstico primeiro.</p>`;
    } else {
        const { title, message } = getAnalysisText(parseInt(score));
        container.innerHTML = `<h2 class="text-2xl font-semibold text-blue-600 mb-3">${title}</h2><p class="text-gray-600">${message}</p>`;
        localStorage.removeItem('diagnosisScore'); // Limpa o score após exibir
    }
}

/**
 * Retorna o texto de análise baseado na pontuação
 * @param {number} score - A pontuação final
 * @returns {{title: string, message: string}}
 */
function getAnalysisText(score) {
    if (score >= 25) {
        return {
            title: "Fundação Sólida",
            message: "Seu relacionamento parece ter uma base forte de comunicação e parceria. Continuem nutrindo esses pontos positivos e celebrando a conexão que vocês construíram. A terapia pode ajudar a fortalecer ainda mais esses laços."
        };
    } else if (score >= 15) {
        return {
            title: "Áreas para Atenção",
            message: "Existem pontos fortes na sua relação, mas também alguns desafios que merecem atenção. A comunicação pode não estar fluindo como deveria em certas áreas. Este é um bom momento para dialogar e entender as necessidades um do outro. A terapia é um excelente espaço para facilitar essa conversa."
        };
    } else {
        return {
            title: "Sinais de Alerta Importantes",
            message: "O diagnóstico sugere que há dificuldades significativas na comunicação e na parceria. É crucial abordar esses pontos para evitar que o desgaste aumente. Não hesite em procurar ajuda profissional. Um terapeuta pode oferecer um caminho seguro para reconstruir a confiança e o diálogo."
        };
    }
}
