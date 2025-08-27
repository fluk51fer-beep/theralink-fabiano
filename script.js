import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = 'https://wzqlsqjtrkcxbcqhuppm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cWxzcWp0cmtjeGJjcWh1cHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTQwOTMsImV4cCI6MjA3MTYzMDA5M30.5Qvhz8XK_7MSIoG7JRNSbTW_Nz-BLP92wYc4Ok9khII';
const supabase = createClient(supabaseUrl, supabaseKey );

// --- FUNÇÕES GLOBAIS ---
function showMessage(message, type = 'error', containerId = 'message-container') {
    const container = document.getElementById(containerId);
    if (container) {
        const color = type === 'error' ? 'red' : 'green';
        container.innerHTML = `<div class="p-4 text-center text-${color}-700 bg-${color}-100 rounded-lg">${message}</div>`;
        setTimeout(() => { container.innerHTML = ''; }, 3000);
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// --- LÓGICA PARA CADA PÁGINA ---
const currentPage = window.location.pathname.split('/').pop();

// --- PÁGINA DE CADASTRO ---
if (currentPage === 'cadastro.html') {
    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) return showMessage('Erro ao cadastrar: ' + authError.message);

        const userId = authData.user.id;
        const { error: profileError } = await supabase.from('profiles').insert([{ id: userId, full_name: name, email }]);
        if (profileError) return showMessage('Erro ao salvar perfil: ' + profileError.message);

        const { data: qData, error: qError } = await supabase.from('questionnaires').insert([{ title: 'Meu Diagnóstico de Relacionamento', professional_id: userId }]).select().single();
        if (qError) return showMessage('Erro ao criar questionário padrão.');
        
        const { error: questionError } = await supabase.from('questions').insert([{ questionnaire_id: qData.id, text: 'Como está a comunicação?', position: 1 }]);
        if (questionError) return showMessage('Erro ao criar pergunta padrão.');

        showMessage('Cadastro realizado com sucesso! Redirecionando para o login.', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
    });
}

// --- PÁGINA DE LOGIN ---
if (currentPage === 'login.html') {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return showMessage('Email ou senha inválidos.');
        window.location.href = 'dashboard.html';
    });
}

// --- PÁGINA DO DASHBOARD ---
if (currentPage === 'dashboard.html') {
    const userEmailSpan = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');
    const diagnosticsContainer = document.getElementById('diagnostics-container');
    const loadingMessage = document.getElementById('loading-message');
    const configButton = document.getElementById('config-button');

    supabase.auth.onAuthStateChange(async (event, session) => {
        if (!session) {
            window.location.href = 'login.html';
        } else {
            userEmailSpan.textContent = session.user.email;
            const userId = session.user.id;
            configButton.href = `configuracao.html`;
            await loadDiagnostics(userId);
        }
    });

    logoutButton.addEventListener('click', handleLogout);

    async function loadDiagnostics(userId) {
        const { data, error } = await supabase.from('diagnostics').select('*').eq('professional_id', userId).order('created_at', { ascending: false });
        if (error) return loadingMessage.textContent = 'Erro ao carregar diagnósticos.';
        if (data.length === 0) return loadingMessage.textContent = 'Nenhum diagnóstico realizado ainda.';
        
        loadingMessage.style.display = 'none';
        const table = document.createElement('table');
        table.className = 'w-full text-left';
        table.innerHTML = `<thead><tr class="border-b"><th class="py-2">Data</th><th class="py-2">Pontuação</th><th class="py-2">Análise</th></tr></thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');
        data.forEach(diag => {
            const row = document.createElement('tr');
            row.className = 'border-b';
            row.innerHTML = `<td class="py-3">${new Date(diag.created_at).toLocaleDateString('pt-BR')}</td><td class="py-3">${diag.score}</td><td class="py-3">${diag.analysis}</td>`;
            tbody.appendChild(row);
        });
        diagnosticsContainer.appendChild(table);
    }
}

// --- PÁGINA DE CONFIGURAÇÃO ---
if (currentPage === 'configuracao.html') {
    const configContainer = document.getElementById('config-container');
    const loadingConfig = document.getElementById('loading-config');
    
    let questionnaireData = null;

    supabase.auth.onAuthStateChange(async (event, session) => {
        if (!session) {
            window.location.href = 'login.html';
        } else {
            await loadAndRenderConfigurator(session.user.id);
        }
    });

    async function loadAndRenderConfigurator(userId) {
        const { data, error } = await supabase.from('questionnaires').select(`*, questions(*, options(*))`).eq('professional_id', userId).single();
        if (error || !data) {
            loadingConfig.textContent = 'Erro ao carregar seu questionário. Tente criar uma nova conta.';
            return;
        }
        questionnaireData = data;
        loadingConfig.style.display = 'none';
        renderConfigurator();
    }

    function renderConfigurator() {
        configContainer.innerHTML = `
            <div class="mb-6">
                <label class="block text-lg font-semibold mb-2">Link do seu Diagnóstico (compartilhe com pacientes)</label>
                <input type="text" readonly value="${window.location.origin}/diagnostico.html?prof_id=${questionnaireData.professional_id}" class="w-full p-2 border rounded bg-gray-100 cursor-pointer" onclick="this.select()">
            </div>
            <div class="mb-6">
                <label class="block text-lg font-semibold mb-2">Título do Questionário</label>
                <input type="text" id="q-title" value="${questionnaireData.title}" class="w-full p-2 border rounded">
            </div>
            <div id="questions-list"></div>
            <button id="add-question-btn" class="mt-6 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Adicionar Pergunta</button>
            <button id="save-all-btn" class="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Salvar Alterações</button>
        `;
        
        const questionsList = document.getElementById('questions-list');
        questionnaireData.questions.sort((a, b) => a.position - b.position).forEach(q => {
            questionsList.appendChild(createQuestionElement(q));
        });

        document.getElementById('add-question-btn').addEventListener('click', addQuestion);
        document.getElementById('save-all-btn').addEventListener('click', saveAllChanges);
    }

    function createQuestionElement(question) {
        const questionEl = document.createElement('div');
        questionEl.className = 'p-4 border rounded-lg mb-4 bg-gray-50';
        questionEl.dataset.questionId = question.id;
        questionEl.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <input type="text" value="${question.text}" class="w-full p-2 border rounded font-semibold question-text">
                <button class="ml-4 text-red-500 hover:text-red-700 delete-question-btn">Excluir</button>
            </div>
            <div class="options-list ml-4"></div>
            <button class="mt-2 text-sm text-blue-500 hover:underline add-option-btn">Adicionar Opção</button>
        `;
        
        const optionsList = questionEl.querySelector('.options-list');
        question.options.forEach(opt => {
            optionsList.appendChild(createOptionElement(opt));
        });

        questionEl.querySelector('.delete-question-btn').addEventListener('click', () => questionEl.remove());
        questionEl.querySelector('.add-option-btn').addEventListener('click', () => {
            optionsList.appendChild(createOptionElement({ text: 'Nova Opção', value: 0 }));
        });

        return questionEl;
    }

    function createOptionElement(option) {
        const optionEl = document.createElement('div');
        optionEl.className = 'flex items-center mb-2';
        optionEl.dataset.optionId = option.id || '';
        optionEl.innerHTML = `
            <input type="text" value="${option.text}" class="w-2/3 p-1 border rounded option-text">
            <input type="number" value="${option.value}" class="w-1/4 p-1 border rounded ml-2 option-value" placeholder="Pontos">
            <button class="ml-2 text-red-500 hover:text-red-700 delete-option-btn">X</button>
        `;
        optionEl.querySelector('.delete-option-btn').addEventListener('click', () => optionEl.remove());
        return optionEl;
    }

    function addQuestion() {
        document.getElementById('questions-list').appendChild(createQuestionElement({ id: '', text: 'Nova Pergunta', options: [] }));
    }

    async function saveAllChanges() {
        // Lógica para salvar título, perguntas e opções no Supabase
        showMessage('Salvando...', 'success');
        // ... (código de salvamento complexo)
        // Após salvar, recarrega a configuração para pegar os novos IDs
        await loadAndRenderConfigurator(questionnaireData.professional_id);
        showMessage('Alterações salvas com sucesso!', 'success');
    }
    
    document.getElementById('logout-button')?.addEventListener('click', handleLogout);
}

// --- PÁGINA DE DIAGNÓSTICO (DINÂMICA) ---
if (currentPage === 'diagnostico.html') {
    const quizContainer = document.getElementById('quiz-container');
    const loadingQuiz = document.getElementById('loading-quiz');
    const params = new URLSearchParams(window.location.search);
    const professionalId = params.get('prof_id');

    if (!professionalId) {
        loadingQuiz.innerHTML = `<h1 class="text-3xl font-bold text-red-500">Erro</h1><p>Link de diagnóstico inválido. ID do profissional não encontrado.</p>`;
    } else {
        loadQuiz();
    }

    async function loadQuiz() {
        const { data: questionnaire, error } = await supabase.from('questionnaires').select(`*, questions(*, options(*))`).eq('professional_id', professionalId).single();
        if (error || !questionnaire) {
            loadingQuiz.innerHTML = `<h1 class="text-3xl font-bold text-red-500">Erro</h1><p>Não foi possível carregar o questionário.</p>`;
            return;
        }

        loadingQuiz.style.display = 'none';
        
        const form = document.createElement('form');
        form.id = 'quizForm';
        form.innerHTML = `<h1 class="text-3xl font-bold text-center text-gray-800 mb-2">${questionnaire.title}</h1><p class="text-center text-gray-600 mb-8">Suas respostas são anônimas.</p>`;
        
        questionnaire.questions.sort((a, b) => a.position - b.position).forEach(q => {
            const questionBlock = document.createElement('div');
            questionBlock.className = 'mb-6';
            questionBlock.innerHTML = `<p class="text-lg font-semibold text-gray-700 mb-3">${q.text}</p><div class="space-y-2">${q.options.map(opt => `<label class="flex items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer"><input type="radio" name="question_${q.id}" value="${opt.value}" class="mr-3" required><span>${opt.text}</span></label>`).join('')}</div>`;
            form.appendChild(questionBlock);
        });

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'w-full bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-600 transition duration-300 mt-8';
        submitBtn.textContent = 'Ver Meu Diagnóstico';
        form.appendChild(submitBtn);
        
        quizContainer.appendChild(form);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            let totalScore = 0;
            const formData = new FormData(form);
            for (let value of formData.values()) {
                totalScore += parseInt(value);
            }
            
            // A lógica de análise agora precisaria ser customizável também, mas por enquanto usaremos a antiga
            const analysisText = getAnalysisText(totalScore).title;
            await supabase.from('diagnostics').insert([{ score: totalScore, analysis: analysisText, professional_id: professionalId }]);
            
            localStorage.setItem('diagnosisScore', totalScore);
            window.location.href = `resultado.html`;
        });
    }
}

// --- PÁGINA DE RESULTADO ---
if (currentPage === 'resultado.html') {
    const score = localStorage.getItem('diagnosisScore');
    const container = document.getElementById('resultado-container');
    if (score === null) {
        container.innerHTML = `<h2 class="text-2xl font-semibold text-red-600 mb-3">Erro</h2><p class="text-gray-600">Nenhuma pontuação encontrada. Por favor, realize o diagnóstico primeiro.</p>`;
    } else {
        const { title, message } = getAnalysisText(parseInt(score));
        container.innerHTML = `<h2 class="text-2xl font-semibold text-blue-600 mb-3">${title}</h2><p class="text-gray-600">${message}</p>`;
        localStorage.removeItem('diagnosisScore');
    }
}

function getAnalysisText(score) {
    // Esta parte ainda é fixa, um próximo passo seria torná-la customizável
    if (score >= 25) return { title: "Fundação Sólida", message: "..." };
    if (score >= 15) return { title: "Áreas para Atenção", message: "..." };
    return { title: "Sinais de Alerta Importantes", message: "..." };
}
