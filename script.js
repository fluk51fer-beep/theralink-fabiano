// TheraLink Final Script - Rebuilt for Stability and Reliability

// --- 1. SETUP ---
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://wzqlsqjtrkcxbcqhuppm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cWxzcWp0cmtjeGJjcWh1cHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTQwOTMsImV4cCI6MjA3MTYzMDA5M30.5Qvhz8XK_7MSIoG7JRNSbTW_Nz-BLP92wYc4Ok9khII';
const supabase = createClient(supabaseUrl, supabaseKey );

// --- 2. UTILITIES ---
const showMessage = (message, type = 'success', containerId = 'message-container') => {
    const container = document.getElementById(containerId);
    if (container) {
        const color = type === 'success' ? 'green' : 'red';
        container.innerHTML = `<div class="p-4 text-center text-${color}-800 bg-${color}-100 rounded-lg">${message}</div>`;
        setTimeout(() => container.innerHTML = '', 5000);
    }
};

const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace('login.html');
};

// --- 3. CORE LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    document.querySelectorAll('#logout-button').forEach(btn => btn.addEventListener('click', handleLogout));

    const authRequired = ['dashboard.html', 'configuracao.html'];

    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            if (currentPage === 'dashboard.html') await runDashboardPage(session);
            if (currentPage === 'configuracao.html') await runConfiguracaoPage(session);
        } else if (authRequired.includes(currentPage)) {
            window.location.replace('login.html');
        }
    });

    if (currentPage === 'cadastro.html') runCadastroPage();
    if (currentPage === 'login.html') runLoginPage();
    if (currentPage === 'diagnostico.html') runDiagnosticoPage();
    if (currentPage === 'resultado.html') runResultadoPage();
});

// --- 4. PAGE-SPECIFIC FUNCTIONS ---

const runCadastroPage = () => {
    const form = document.getElementById('signup-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { name, email, password } = Object.fromEntries(new FormData(e.target));
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return showMessage(error.message, 'error');
        const { error: profileError } = await supabase.from('profiles').insert({ id: data.user.id, full_name: name, email });
        if (profileError) return showMessage(profileError.message, 'error');
        showMessage('Cadastro realizado! Redirecionando para o login...');
        setTimeout(() => window.location.replace('login.html'), 2000);
    });
};

const runLoginPage = () => {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { email, password } = Object.fromEntries(new FormData(e.target));
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return showMessage('Email ou senha inválidos.', 'error');
        window.location.replace('dashboard.html');
    });
};

const runDashboardPage = async (session) => {
    document.getElementById('user-email').textContent = session.user.email;
    const container = document.getElementById('diagnostics-container');
    const { data, error } = await supabase.from('diagnostics').select('*').eq('professional_id', session.user.id).order('created_at', { ascending: false });
    if (error) return container.innerHTML = `<p class="text-red-500">Erro ao carregar diagnósticos.</p>`;
    if (!data.length) return container.innerHTML = `<p>Nenhum diagnóstico realizado ainda.</p>`;
    
    container.innerHTML = `
        <table class="w-full text-left">
            <thead><tr class="border-b"><th class="py-2">Data</th><th class="py-2">Pontuação</th><th class="py-2">Análise</th></tr></thead>
            <tbody>
                ${data.map(d => `
                    <tr class="border-b"><td class="py-3">${new Date(d.created_at).toLocaleDateString('pt-BR')}</td><td class="py-3">${d.score}</td><td class="py-3">${d.analysis}</td></tr>
                `).join('')}
            </tbody>
        </table>`;
};

const runConfiguracaoPage = async (session) => {
    const container = document.getElementById('config-container');
    container.innerHTML = `<p>Verificando configuração...</p>`;

    let { data: questionnaire, error } = await supabase.from('questionnaires').select('*, questions(*, options(*))').eq('professional_id', session.user.id).single();

    if (error && error.code === 'PGRST116') { // Not found, needs to be created
        container.innerHTML = `<p>Criando questionário padrão...</p>`;
        const { data: newQ, error: qError } = await supabase.from('questionnaires').insert({ title: 'Diagnóstico de Relacionamento', professional_id: session.user.id }).select().single();
        if (qError) return container.innerHTML = `<p class="text-red-500">Erro fatal ao criar questionário. Por favor, contate o suporte.</p>`;
        
        const { data: newP, error: pError } = await supabase.from('questions').insert({ questionnaire_id: newQ.id, text: 'Como você avalia a comunicação?', position: 1 }).select().single();
        if (pError) return container.innerHTML = `<p class="text-red-500">Erro fatal ao criar pergunta. Por favor, contate o suporte.</p>`;
        
        const { error: oError } = await supabase.from('options').insert([{ question_id: newP.id, text: 'Excelente', value: 3 }, { question_id: newP.id, text: 'Boa', value: 2 }]);
        if (oError) return container.innerHTML = `<p class="text-red-500">Erro fatal ao criar opções. Por favor, contate o suporte.</p>`;

        // Reload the data
        const { data: reloadedQ, error: rError } = await supabase.from('questionnaires').select('*, questions(*, options(*))').eq('professional_id', session.user.id).single();
        if (rError) return container.innerHTML = `<p class="text-red-500">Questionário criado, mas falha ao recarregar. Por favor, atualize a página.</p>`;
        questionnaire = reloadedQ;
    } else if (error) {
        return container.innerHTML = `<p class="text-red-500">Erro inesperado ao buscar dados: ${error.message}</p>`;
    }

    renderConfigurator(container, questionnaire, session.user.id);
};

const renderConfigurator = (container, qData, userId) => {
    container.innerHTML = `
        <div class="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label class="block text-lg font-semibold mb-2 text-blue-800">Link do seu Diagnóstico</label>
            <p class="text-sm text-gray-600 mb-2">Compartilhe este link com seus pacientes.</p>
            <input type="text" readonly value="${window.location.origin}/diagnostico.html?prof_id=${userId}" class="w-full p-2 border rounded bg-gray-100" onclick="this.select()">
        </div>
        <div class="mb-6"><label class="block text-lg font-semibold mb-2">Título</label><input type="text" id="q-title" value="${qData.title}" class="w-full p-2 border rounded text-xl"></div>
        <div id="questions-list" class="space-y-6"></div>
        <button id="add-question-btn" class="mt-8 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">Adicionar Pergunta</button>`;

    const qList = document.getElementById('questions-list');
    qData.questions.sort((a, b) => a.position - b.position).forEach(q => qList.appendChild(createQuestionEl(q)));

    document.getElementById('q-title').addEventListener('blur', async (e) => {
        await supabase.from('questionnaires').update({ title: e.target.value }).eq('id', qData.id);
    });
    document.getElementById('add-question-btn').addEventListener('click', async () => {
        const { data, error } = await supabase.from('questions').insert({ questionnaire_id: qData.id, text: 'Nova Pergunta', position: qData.questions.length + 1 }).select('*, options(*)').single();
        if (error) return showMessage('Erro ao adicionar pergunta', 'error');
        qList.appendChild(createQuestionEl(data));
    });
};

const createQuestionEl = (q) => {
    const el = document.createElement('div');
    el.className = 'p-6 border rounded-xl bg-gray-50';
    el.innerHTML = `<div class="flex justify-between items-center mb-4"><input type="text" value="${q.text}" class="w-full p-2 border rounded font-semibold text-lg question-text"><button class="ml-4 text-red-500 delete-question-btn p-2 rounded-full hover:bg-red-100">Excluir</button></div><div class="options-list space-y-2 ml-4 border-l-2 pl-4"></div><button class="mt-3 text-sm text-blue-500 add-option-btn">+ Adicionar Opção</button>`;
    const optionsList = el.querySelector('.options-list');
    q.options.forEach(opt => optionsList.appendChild(createOptionEl(opt)));
    
    const update = async (table, data, id) => await supabase.from(table).update(data).eq('id', id);
    const del = async (table, id) => await supabase.from(table).delete().eq('id', id);

    el.querySelector('.question-text').addEventListener('blur', (e) => update('questions', { text: e.target.value }, q.id));
    el.querySelector('.delete-question-btn').addEventListener('click', async () => { if (confirm('Tem certeza?')) { await del('questions', q.id); el.remove(); } });
    el.querySelector('.add-option-btn').addEventListener('click', async () => {
        const { data, error } = await supabase.from('options').insert({ question_id:
