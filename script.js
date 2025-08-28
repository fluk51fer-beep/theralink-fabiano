document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'diagnostico.html') {
        renderQuiz();
    }

    if (currentPage === 'resultado.html') {
        displayResults();
    }
});

function renderQuiz() {
    const quizForm = document.getElementById('quiz-form');
    if (!quizForm) return;

    const questions = [
        {
            text: "Com que frequência vocês expressam apreço um pelo outro?",
            options: [
                { text: "Diariamente", value: 3 },
                { text: "Algumas vezes na semana", value: 2 },
                { text: "Raramente", value: 1 },
                { text: "Nunca", value: 0 }
            ]
        },
        {
            text: "Como vocês lidam com desacordos ou conflitos?",
            options: [
                { text: "Conversamos calmamente até chegar a uma solução", value: 3 },
                { text: "Discutimos, mas eventualmente nos resolvemos", value: 2 },
                { text: "Evitamos o conflito e deixamos para lá", value: 1 },
                { text: "Gritamos ou nos ofendemos", value: 0 }
            ]
        },
        {
            text: "Vocês compartilham objetivos e sonhos para o futuro?",
            options: [
                { text: "Sim, estamos muito alinhados", value: 3 },
                { text: "Temos alguns objetivos em comum", value: 2 },
                { text: "Não conversamos muito sobre isso", value: 1 },
                { text: "Temos objetivos muito diferentes", value: 0 }
            ]
        },
        // Adicione mais perguntas aqui se desejar
    ];

    let questionsHTML = '';
    questions.forEach((q, index) => {
        questionsHTML += `<div class="mb-8">`;
        questionsHTML += `<p class="text-lg font-semibold text-gray-700 mb-4">${index + 1}. ${q.text}</p>`;
        questionsHTML += `<div class="space-y-3">`;
        q.options.forEach(opt => {
            questionsHTML += `<label class="flex items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer"><input type="radio" name="question_${index}" value="${opt.value}" class="mr-3" required><span>${opt.text}</span></label>`;
        });
        questionsHTML += `</div></div>`;
    });

    quizForm.innerHTML = questionsHTML + `<button type="submit" class="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold mt-8 text-lg">Ver Meu Diagnóstico</button>`;

    quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let totalScore = 0;
        const formData = new FormData(quizForm);
        for (let value of formData.values()) {
            totalScore += parseInt(value);
        }
        // Salva a pontuação no navegador para usar na próxima página
        localStorage.setItem('diagnosisScore', totalScore);
        window.location.href = 'resultado.html';
    });
}

function displayResults() {
    const container = document.getElementById('resultado-container');
    if (!container) return;

    const score = localStorage.getItem('diagnosisScore');

    if (score === null) {
        container.innerHTML = `<h2 class="text-2xl font-semibold text-red-600 mb-3">Erro</h2><p class="text-gray-600">Nenhuma pontuação encontrada. Por favor, <a href="diagnostico.html" class="text-blue-500 underline">realize o diagnóstico primeiro</a>.</p>`;
        return;
    }

    let result = {};
    const totalQuestions = 3; // Mude este número se adicionar mais perguntas
    const maxScore = totalQuestions * 3;
    const percentage = (score / maxScore) * 100;

    if (percentage > 70) {
        result = {
            title: "Fundação Sólida",
            message: "Seu relacionamento demonstra uma base de comunicação e parceria muito forte. Este é um excelente alicerce para continuar crescendo juntos."
        };
    } else if (percentage > 40) {
        result = {
            title: "Áreas para Atenção",
            message: "Existem pontos fortes, mas também áreas que merecem atenção e diálogo para fortalecer ainda mais o vínculo de vocês. Pequenos ajustes podem fazer uma grande diferença."
        };
    } else {
        result = {
            title: "Sinais de Alerta Importantes",
            message: "O diagnóstico indica desafios significativos que podem estar causando desconforto. Este é um momento crucial para buscar novas formas de comunicação e entendimento."
        };
    }

    container.innerHTML = `
        <h2 class="text-3xl font-bold text-blue-600 mb-4">${result.title}</h2>
        <p class="text-gray-700 text-lg mb-8">${result.message}</p>
        <div class="mt-10 p-6 bg-green-50 rounded-lg">
            <h3 class="text-2xl font-bold text-gray-800 mb-3">Dê o Próximo Passo</h3>
            <p class="text-gray-600 mb-6">A terapia pode ser uma ferramenta poderosa para aprofundar sua conexão. Estou aqui para ajudar.</p>
            <a href="https://calendly.com/fabianolucas/terapia" target="_blank" class="inline-block bg-green-500 text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-green-600 transition duration-300 shadow-lg">
                Agende uma Sessão
            </a>
        </div>
    `;

    // Limpa a pontuação para que não seja usada novamente
    localStorage.removeItem('diagnosisScore' );
}
