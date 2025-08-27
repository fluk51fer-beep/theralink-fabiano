// Importa o cliente Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- 1. CONFIGURAÇÃO ---
const supabaseUrl = 'https://wzqlsqjtrkcxbcqhuppm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cWxzcWp0cmtjeGJjcWh1cHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTQwOTMsImV4cCI6MjA3MTYzMDA5M30.5Qvhz8XK_7MSIoG7JRNSbTW_Nz-BLP92wYc4Ok9khII';
const supabase = createClient(supabaseUrl, supabaseKey );

// --- 2. FUNÇÕES UTILITÁRIAS GLOBAIS ---
function showMessage(message, type = 'success', containerId = 'message-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const color = type === 'success' ? 'green' : 'red';
    container.innerHTML = `<div class="p-4 text-center text-${color}-800 bg-${color}-100 border border-${color}-200 rounded-lg">${message}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 4000);
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

function setupLogoutButtons() {
    document.querySelectorAll('#logout-button').forEach(button => button.addEventListener('click', handleLogout));
}

// --- 3. LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    setupLogoutButtons();

    const authRequiredPages = ['dashboard.html', 'configuracao.html'];

    supabase.auth.onAuthStateChange((event, session) => {
        if (!session && authRequiredPages.includes(currentPage)) {
            window.location.href = 'login.html';
            return;
        }
        
        if (session) {
            switch (currentPage) {
                case 'dashboard.html': runDashboardPage(session); break;
                case 'configuracao.html': runConfiguracaoPage(session); break;
            }
        }
    });

    switch (currentPage) {
        case 'cadastro.html': runCadastroPage(); break;
        case 'login.html': runLoginPage(); break;
        case 'diagnostico.html': runDiagnosticoPage(); break;
        case 'resultado.html': runResultadoPage(); break;
    }
});

// --- 4. FUNÇÕES DE PÁGINA ---

function runCadastroPage() {
    const form = document.getElementById('signup-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;

        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) return showMessage('Erro ao cadastrar: ' + authError.message, 'error');

        const { error: profileError } = await supabase.from('profiles').insert([{ id: authData.user.id, full_name: name, email }]);
        if (profileError) return showMessage('Erro ao salvar perfil: ' + profileError.message, 'error');

        showMessage('Cadastro realizado com sucesso! Redirecionando...');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
    });
}

function runLoginPage() {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({ email: form.email.value, password: form.password.value });
        if (error) return showMessage('Email ou senha inválidos.', 'error');
        window.location.href = 'dashboard.html';
    });
}

async function runDashboardPage(session) {
    const userEmailSpan = document.getElementById('user-email');
    if (userEmailSpan) userEmailSpan.textContent = session.user.email;

    const container = document.getElementById('diagnostics-container');
    const loadingMsg = document.getElementById('loading-message');
    if (!container || !loadingMsg) return;

    const { data, error } = await supabase.from('diagnostics').select('*').eq('professional_id', session.user.id).order('created_at', { ascending: false });
    if (error) return loadingMsg.textContent = 'Erro ao carregar diagnósticos.';
    
    if (data.length === 0) {
        loadingMsg.textContent = 'Nenhum diagnóstico realizado ainda.';
        return;
    }
    
    loadingMsg.style.display = 'none';
    const table = document.createElement('table');
    table.className = 'w-full text-left';
    table.innerHTML = `<thead><tr class="border-b"><th class="py-2">Data</th><th class="py-2">Pontuação</th><th class="py-2">Análise</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector('tbody');
    data.forEach(diag => {
        tbody.innerHTML += `<tr class="border-b"><td class="py-3">${new Date(diag.created_at).toLocaleDateString('pt-BR')}</td><td class="py-3">${diag.score}</td><td class="py-3">${diag.analysis}</td></tr>`;
    });
    container.appendChild(table);
}

// Função para criar um atraso
const delay = ms => new Promise(res => setTimeout(res, ms));

async function runConfiguracaoPage(session) {
    const loadingEl = document.getElementById('loading-config');
    if (!loadingEl) return;

    let { data: questionnaire, error } = await supabase.from('questionnaires').select(`*, questions(*, options(*))`).eq('professional_id', session.user.id).single();

    if (error && error.code === 'PGRST116') {
        loadingEl.textContent = "Nenhum questionário encontrado. Criando um padrão para você...";
        const { data: newQ, error: newQError } = await supabase.from('questionnaires').insert({ title: 'Meu Diagnóstico de Relacionamento', professional_id: session.user.id }).select().single();
        if (newQError || !newQ) return loadingEl.textContent = "Falha crítica ao criar questionário.";

        const { data: newQuestion, error: newQuestionError } = await supabase.from('questions').insert({ questionnaire_id: newQ.id, text: 'Como você avalia a comunicação no seu relacionamento?', position: 1 }).select().single();
        if (newQuestionError || !newQuestion) return loadingEl.textContent = "Falha crítica ao criar pergunta padrão.";

        await supabase.from('options').insert([
            { question_id: newQuestion.id, text: 'Excelente', value: 3 },
            { question_id: newQuestion.id, text: 'Boa', value: 2 },
            { question_id: newQuestion.id, text: 'Regular', value: 1 },
            { question_id: newQuestion.id, text: 'Ruim', value: 0 }
        ]);
        
        // *** MUDANÇA PRINCIPAL AQUI ***
        loadingEl.textContent = "Finalizando configuração, aguarde um instante...";
        await delay(1500); // Adiciona um atraso de 1.5 segundos

        const { data: reloadedQ, error: reloadError } = await supabase.from('questionnaires').select(`*, questions(*, options(*))`).eq('professional_id', session.user.id).single();
        if (reloadError || !reloadedQ) {
            loadingEl.textContent = "Erro ao recarregar dados após criação. Por favor, atualize a página.";
            return;
        }
        questionnaire = reloadedQ;
    } else if (error) {
        return loadingEl.textContent = `Erro inesperado: ${error.message}`;
    }

    loadingEl.style.display = 'none';
    renderConfigurator(questionnaire, session.user.id);
}

function renderConfigurator(qData, userId) {
    const container = document.getElementById('config-container');
    container.innerHTML = `
        <div class="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label class="block text-lg font-semibold mb-2 text-blue-800">Link do seu Diagnóstico</label>
            <p class="text-sm text-gray-600 mb-2">Compartilhe este link com seus pacientes para que eles possam realizar o diagnóstico.</p>
            <input type="text" readonly value="${window.location.origin}/diagnostico.html?prof_id=${userId}" class="w-full p-2 border rounded bg-gray-100 cursor-pointer" onclick="this.select()">
        </div>
        <div class="mb-6">
            <label class="block text-lg font-semibold mb-2">Título do Questionário</label>
            <input type="text" id="q-title" value="${qData.title}" data-id="${qData.id}" class="w-full p-2 border rounded text-xl">
        </div>
        <div id="questions-list" class="space-y-6"></div>
        <button id="add-question-btn" class="mt-8 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105">Adicionar Pergunta</button>
    `;

    const qList = document.getElementById('questions-list');
    qData.questions.sort((a, b) => a.position - b.position).forEach(q => qList.appendChild(createQuestionEl(q)));

    document.getElementById('add-question-btn').addEventListener('click', async () => {
        const { data, error } = await supabase.from('questions').insert({ questionnaire_id: qData.id, text: 'Nova Pergunta', position: qData.questions.length + 1 }).select().single();
        if (error) return showMessage('Erro ao adicionar pergunta', 'error');
        data.options = [];
        qList.appendChild(createQuestionEl(data));
    });
}

function createQuestionEl(q) {
    const el = document.createElement('div');
    el.className = 'p-6 border rounded-xl bg-gray-50 shadow-sm';
    el.dataset.questionId = q.id;
    el.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <input type="text" value="${q.text}" class="w-full p-2 border rounded font-semibold text-lg question-text" placeholder="Digite sua pergunta">
            <button class="ml-4 text-red-500 hover:text-red-700 delete-question-btn p-2 rounded-full hover:bg-red-100">Excluir</button>
        </div>
        <div class="options-list space-y-2 ml-4 border-l-2 pl-4"></div>
        <button class="mt-3 text-sm text-blue-500 hover:underline add-option-btn">+ Adicionar Opção</button>
    `;

    const optionsList = el.querySelector('.options-list');
    q.options.forEach(opt => optionsList.appendChild(createOptionEl(opt)));

    el.querySelector('.question-text').addEventListener('blur', async (e) => {
        await supabase.from('questions').update({ text: e.target.value }).eq('id', q.id);
        showMessage('Pergunta salva!');
    });
    el.querySelector('.delete-question-btn').addEventListener('click', async () => {
        if (!confirm('Tem certeza que deseja excluir esta pergunta e todas as suas opções?')) return;
        await supabase.from('questions').delete().eq('id', q.id);
        el.remove();
        showMessage('Pergunta excluída!');
    });
    el.querySelector('.add-option-btn').addEventListener('click', async () => {
        const { data, error } = await supabase.from('options').insert({ question_id: q.id, text: 'Nova Opção', value: 0 }).select().single();
        if (error) return showMessage('Erro ao adicionar opção', 'error');
        optionsList.appendChild(createOptionEl(data));
    });
    return el;
}

function createOptionEl(opt) {
    const el = document.createElement('div');
    el.className = 'flex items-center';
    el.dataset.optionId = opt.id;
    el.innerHTML = `
        <input type="text" value="${opt.text}" class="w-2/3 p-1 border rounded option-text" placeholder="Texto da opção">
        <input type="number" value="${opt.value}" class="w-1/4 p-1 border rounded ml-2 option-value" placeholder="Pontos">
        <button class="ml-2 text-gray-400 hover:text-red-600 delete-option-btn p-1 rounded-full">X</button>
    `;
    el.querySelector('.option-text').addEventListener('blur', async (e) => {
        await supabase.from('options').update({ text: e.target.value }).eq('id', opt.id);
        showMessage('Opção salva!');
    });
    el.querySelector('.option-value').addEventListener('blur', async (e) => {
        await supabase.from('options').update({ value: parseInt(e.target.value) || 0 }).eq('id', opt.id);
        showMessage('Pontuação salva!');
    });
    el.querySelector('.delete-option-btn').addEventListener('click', async () => {
        await supabase.from('options').delete().eq('id', opt.id);
        el.remove();
        showMessage('Opção excluída!');
    });
    return el;
}

// ... (as funções runDiagnosticoPage e runResultadoPage podem ser adicionadas aqui)
