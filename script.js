document.addEventListener('DOMContentLoaded', function () {
    const quizForm = document.getElementById('quizForm');
    const submitBtn = document.getElementById('submitBtn');

    const questions = [
        {
            question: "Com que frequência você e seu/sua parceiro(a) conversam abertamente sobre seus sentimentos?",
            options: ["Sempre", "Frequentemente", "Às vezes", "Raramente"]
        },
        {
            question: "Como vocês resolvem desentendimentos?",
            options: ["Com diálogo calmo", "Com uma discussão acalorada, mas resolvemos", "Evitando o assunto", "Com brigas que não resolvem"]
        },
        {
            question: "Você se sente ouvido(a) e compreendido(a) na relação?",
            options: ["Sim, na maioria das vezes", "Às vezes, depende do assunto", "Raramente", "Não me sinto ouvido(a)"]
        },
        {
            question: "Com que frequência vocês fazem atividades juntos que ambos gostam?",
            options: ["Toda semana", "Algumas vezes no mês", "Raramente", "Quase nunca"]
        },
        {
            question: "Vocês compartilham objetivos e planos para o futuro?",
            options: ["Sim, estamos muito alinhados", "Temos alguns objetivos em comum", "Temos visões muito diferentes", "Não conversamos sobre isso"]
        },
        {
            question: "Como você descreveria o nível de confiança mútua?",
            options: ["Confiança total", "Boa, mas com algumas inseguranças", "Frágil", "Não há confiança"]
        },
        {
            question: "Você se sente apoiado(a) em suas decisões e projetos pessoais?",
            options: ["Totalmente apoiado(a)", "Recebo algum apoio", "Sinto falta de apoio", "Sinto que há desaprovação"]
        },
        {
            question: "Com que frequência vocês expressam carinho e admiração um pelo outro?",
            options: ["Diariamente", "Frequentemente", "Ocasionalmente", "Raramente"]
        },
        {
            question: "Quando surge um problema (financeiro, familiar, etc.), como vocês o enfrentam?",
            options: ["Como uma equipe unida", "Juntos, mas com estresse", "Cada um por si", "Isso gera muitas brigas"]
        },
        {
            question: "Olhando para sua relação hoje, qual sentimento predomina?",
            options: ["Felicidade e parceria", "Conforto, mas com monotonia", "Incerteza e dúvida", "Tristeza e frustração"]
        }
    ];

    // Carrega as perguntas na página
    questions.forEach((q, index) => {
        const questionBlock = document.createElement('div');
        questionBlock.className = 'mb-6';
        
        const questionTitle = document.createElement('p');
        questionTitle.className = 'text-lg font-semibold text-gray-700 mb-3';
        questionTitle.textContent = `${index + 1}. ${q.question}`;
        questionBlock.appendChild(questionTitle);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'space-y-2';
        
        q.options.forEach((option, optionIndex) => {
            const label = document.createElement('label');
            label.className = 'flex items-center p-3 border rounded-lg hover:bg-gray-100 cursor-pointer';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `question${index}`;
            radio.value = 3 - optionIndex; // Pontuação: 3 para a melhor resposta, 0 para a pior
            radio.className = 'mr-3';
            radio.required = true;

            label.appendChild(radio);
            label.appendChild(document.createTextNode(option));
            optionsContainer.appendChild(label);
        });

        questionBlock.appendChild(optionsContainer);
        quizForm.appendChild(questionBlock);
    });

    // Calcula o resultado e redireciona
    submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (quizForm.checkValidity()) {
            let totalScore = 0;
            const formData = new FormData(quizForm);
            for (let value of formData.values()) {
                totalScore += parseInt(value);
            }
            window.location.href = `resultado.html?score=${totalScore}`;
        } else {
            alert("Por favor, responda a todas as perguntas.");
        }
    });
});
