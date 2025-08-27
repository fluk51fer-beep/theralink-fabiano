// Importa o cliente Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- 1. CONFIGURAÇÃO ---
const supabaseUrl = 'https://wzqlsqjtrkcxbcqhuppm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cWxzcWp0cmtjeGJjcWh1cHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTQwOTMsImV4cCI6MjA3MTYzMDA5M30.5Qvhz8XK_7MSIoG7JRNSbTW_Nz-BLP92wYc4Ok9khII';
const supabase = createClient(supabaseUrl, supabaseKey );

// --- 2. FUNÇÕES UTILITÁRIAS GLOBAIS ---

/**
 * Exibe uma mensagem temporária na tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - 'success' (verde) ou 'error' (vermelho).
 * @param {string} containerId - O ID do elemento onde a mensagem aparecerá.
 */
function showMessage(message, type = 'error', containerId = 'message-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const color = type === 'success' ? 'green' : 'red';
    container.innerHTML = `<div class="p-4 text-center text-${color}-800 bg-${color}-100 border border-${color}-200 rounded-lg">${message}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 4000);
}

/**
 * Faz o logout do usuário e o redireciona para a página de login.
 */
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

/**
 * Anexa o evento de logout a todos os botões com o ID 'logout-button'.
 */
function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('#logout-button');
    logoutButtons.forEach(button => button.addEventListener('click', handleLogout));
}

// --- 3. LÓGICA PRINCIPAL (EXECUTADA EM TODAS AS PÁGINAS) ---

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    setupLogoutButtons(); // Garante que o botão de sair sempre funcione.

    // Verifica o estado de autenticação do usuário
    supabase.auth.onAuthStateChange((event, session) => {
        const isAuthPage = ['login.html', 'cadastro.html'].includes(currentPage);
        
        if (!session && !isAuthPage) {
            // Se não há sessão e não estamos numa página de autenticação, redireciona para o login.
            window.location.href = 'login.html';
        } else {
            // Se há uma sessão, executa a lógica específica da página.
            switch (currentPage) {
                case 'dashboard.html':
                    runDashboardPage(session);
                    break;
                case 'configuracao.html':
                    runConfiguracaoPage(session);
                    break;
            }
        }
    });

    // Executa a lógica para páginas que não precisam de autenticação
    switch (currentPage) {
        case 'cadastro.html':
            runCadastroPage();
            break;
        case 'login.html':
            runLoginPage();
            break;
        case 'diagnostico.html':
            runDiagnosticoPage();
            break;
        case 'resultado.html':
            runResultadoPage();
            break;
    }
});


// --- 4. FUNÇÕES ESPECÍFICAS DE CADA PÁGINA ---

function runCadastroPage() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

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

        const { data: qData, error: qError } = await supabase.from('questionnaires').insert([{ title: 'Meu Diagnóstico de Relacionamento', professional_id: userId }]).select('id').single();
        if (qError || !qData) return showMessage('Erro ao criar questionário padrão.');
        
        const { error: questionError } = await supabase.from('questions').insert([{ questionnaire_id: qData.id, text: 'Como está a comunicação?', position: 1 }]);
        if (questionError) return showMessage('Erro ao criar pergunta padrão.');

        showMessage('Cadastro realizado com sucesso! Redirecionando...', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
    });
}

function runLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return showMessage('Email ou senha inválidos.');
        window.location.href = 'dashboard.html';
    });
}

function runDashboardPage(session) {
    const userEmailSpan = document.getElementById('user-email');
    const diagnosticsContainer = document.getElementById('diagnostics-container');
    const loadingMessage = document.getElementById('loading-message');

    if (userEmailSpan) userEmailSpan.textContent = session.user.email;
    
    async function loadDiagnostics() {
        if (!diagnosticsContainer || !loadingMessage) return;
        const { data, error } = await supabase.from('diagnostics').select('*').eq('professional_id', session.user.id).order('created_at', { ascending: false });
        
        if (error) {
            loadingMessage.textContent = 'Erro ao carregar diagnósticos.';
            return;
        }
        if (data.length === 0) {
            loadingMessage.textContent = 'Nenhum diagnóstico realizado ainda.';
            return;
        }
        
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
        diagnosticsContainer.innerHTML = ''; // Limpa a mensagem de "carregando"
        diagnosticsContainer.appendChild(table);
    }

    loadDiagnostics();
}

async function runConfiguracaoPage(session) {
    const loadingConfig = document.getElementById('loading-config');
    if (!loadingConfig) return;

    const { data, error } = await supabase.from('questionnaires').select(`*, questions(*, options(*))`).eq('professional_id', session.user.id).single();
    
    if (error || !data) {
        loadingConfig.innerHTML = 'Erro ao carregar seu questionário. <a href="cadastro.html" class="text-blue-500 underline">Tente criar uma nova conta</a>.';
        return;
    }
    
    // Se chegou aqui, os dados foram carregados com sucesso.
    loadingConfig.textContent = "Dados carregados! Renderizando..."; // Mensagem de depuração
    
    // A lógica de renderização do configurador irá aqui.
    // Por enquanto, vamos apenas confirmar que os dados chegaram.
    console.log("Dados do questionário recebidos:", data);
    loadingConfig.style.display = 'none';
    
    const configContainer = document.getElementById('config-container');
    configContainer.innerHTML = `
        <div class="mb-6">
            <label class="block text-lg font-semibold mb-2">Link do seu Diagnóstico (compartilhe com pacientes)</label>
            <input type="text" readonly value="${window.location.origin}/diagnostico.html?prof_id=${data.professional_id}" class="w-full p-2 border rounded bg-gray-100 cursor-pointer" onclick="this.select()">
        </div>
        <p class="text-green-600">Configurador carregado com sucesso! A interface de edição será construída aqui.</p>
        <!-- O código completo para renderizar o configurador será inserido aqui em uma próxima etapa -->
    `;
}

function runDiagnosticoPage() {
    // Lógica da página de diagnóstico (não precisa de grandes mudanças por agora)
}

function runResultadoPage() {
    // Lógica da página de resultado (não precisa de grandes mudanças por agora)
}
