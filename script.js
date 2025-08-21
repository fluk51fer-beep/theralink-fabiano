// Lógica para a avaliação de casal (Fabiano Lucas)
if (document.getElementById("quizForm") && window.location.pathname.includes("fabiano")) {
  document.getElementById("quizForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const q1 = parseInt(document.querySelector('input[name="q1"]:checked').value);
    const q2 = parseInt(document.querySelector('input[name="q2"]:checked').value);
    const q3 = parseInt(document.querySelector('input[name="q3"]:checked').value);
    const q4 = parseInt(document.querySelector('input[name="q4"]:checked').value);
    const q5 = parseInt(document.querySelector('input[name="q5"]:checked').value);
    const q6 = parseInt(document.querySelector('input[name="q6"]:checked').value);
    const q7 = parseInt(document.querySelector('input[name="q7"]:checked').value);
    const q8 = parseInt(document.querySelector('input[name="q8"]:checked').value);
    const q9 = parseInt(document.querySelector('input[name="q9"]:checked').value);
    const q10 = parseInt(document.querySelector('input[name="q10"]:checked').value);

    const total = q1 + q2 + q3 + q4 + q5 + q6 + q7 + q8 + q9 + q10;
    const media = total / 10;

    let resultText = "";
    let recommendation = "";
    let bgColor = "#f0f7ff";

    if (media >= 2.8) {
      resultText = "Seu relacionamento está saudável e com boa conexão emocional.";
      recommendation = "Parabéns! Vocês têm uma base sólida. A terapia pode ajudar a fortalecer ainda mais sua comunicação, intimidade e projetos em comum.";
      bgColor = "#e8f5e8";
    } else if (media >= 2.0) {
      resultText = "Seu relacionamento tem pontos fortes, mas também desafios importantes.";
      recommendation = "Há sinais de distanciamento, conflitos ou falta de diálogo. A terapia de casal pode ajudar a reconectar, alinhar expectativas e restaurar a parceria.";
      bgColor = "#fff9e6";
    } else if (media >= 1.2) {
      resultText = "Seu relacionamento está em fase de desgaste ou crise.";
      recommendation = "Conflitos frequentes, desconfiança ou ressentimentos indicam necessidade de apoio profissional para decidir se vale a pena reconstruir ou se despedir com respeito.";
      bgColor = "#fff4e6";
    } else {
      resultText = "Seu relacionamento está em situação de alta tensão ou desistência.";
      recommendation = "O distanciamento emocional, falta de esperança e repetição de ciclos tóxicos exigem intervenção terapêutica urgente — seja para recomeçar ou para um desligamento consciente.";
      bgColor = "#ffeaea";
    }

    localStorage.setItem("resultText", resultText);
    localStorage.setItem("recommendation", recommendation);
    localStorage.setItem("bgColor", bgColor);

    window.location.href = "results.html";
  });
}
