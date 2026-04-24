let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 5;

const setupScreen = document.getElementById('setup-screen');
const loadingScreen = document.getElementById('loading-screen');
const questionScreen = document.getElementById('question-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const difficultySelect = document.getElementById('difficulty');
const amountInput = document.getElementById('amount');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progress = document.getElementById('progress');
const questionCounter = document.getElementById('question-counter');
const currentScoreDisplay = document.getElementById('current-score');

const finalScoreText = document.getElementById('final-score-text');
const scorePercentage = document.getElementById('score-percentage');

const translateText = async (text) => {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt-BR&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data[0]) {
            let translatedText = "";
            data[0].forEach(part => {
                if (part[0]) translatedText += part[0];
            });
            return translatedText || text;
        }
        return text;
    } catch (error) {
        console.error('Erro na tradução:', error);
        return text; 
    }
};

const fetchQuestions = async (amount, difficulty) => {
    try {
        const url = `https://opentdb.com/api.php?amount=${amount}&difficulty=${difficulty}&type=multiple`;
        const response = await fetch(url);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Erro ao buscar perguntas:', error);
        alert('Erro ao carregar perguntas. Tente novamente.');
        return [];
    }
};

const showScreen = (screen) => {
    [setupScreen, loadingScreen, questionScreen, resultScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
};

const decodeHTML = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

const startGame = async () => {
    totalQuestions = parseInt(amountInput.value);
    const difficulty = difficultySelect.value;
    
    showScreen(loadingScreen);
    
    const rawQuestions = await fetchQuestions(totalQuestions, difficulty);
    
    questions = await Promise.all(rawQuestions.map(async (q) => {
        const translatedQuestion = await translateText(decodeHTML(q.question));
        const translatedCorrectAnswer = await translateText(decodeHTML(q.correct_answer));
        const translatedIncorrectAnswers = await Promise.all(
            q.incorrect_answers.map(ans => translateText(decodeHTML(ans)))
        );
        
        return {
            question: translatedQuestion,
            correct_answer: translatedCorrectAnswer,
            incorrect_answers: translatedIncorrectAnswers
        };
    }));

    currentQuestionIndex = 0;
    score = 0;
    updateScoreDisplay();
    showQuestion();
    showScreen(questionScreen);
};

const showQuestion = () => {
    if(currentQuestionIndex >= questions.length) {
        showResult();
        return;
    }
    const question = questions[currentQuestionIndex];
    questionText.textContent = question.question;
    
    const options = [...question.incorrect_answers, question.correct_answer];
    options.sort(() => Math.random() - 0.5);
    
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-btn');
        button.onclick = () => handleAnswer(option, question.correct_answer, button);
        optionsContainer.appendChild(button);
    });
    
    updateProgress();
};

const handleAnswer = (selected, correct, button) => {
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    if (selected === correct) {
        score++;
        button.classList.add('correct');
    } else {
        button.classList.add('incorrect');
        buttons.forEach(btn => {
            if (btn.textContent === correct) btn.classList.add('correct');
        });
    }
    
    updateScoreDisplay();
    
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showResult();
        }
    }, 1500);
};

const updateProgress = () => {
    const percent = ((currentQuestionIndex + 1) / questions.length) * 100;
    progress.style.width = `${percent}%`;
    questionCounter.textContent = `Questão ${currentQuestionIndex + 1} de ${questions.length}`;
};

const updateScoreDisplay = () => {
    currentScoreDisplay.textContent = `Placar: ${score}`;
};

const showResult = () => {
    const percentage = Math.round((score / questions.length) * 100);
    finalScoreText.textContent = `Você acertou ${score} de ${questions.length} questões.`;
    scorePercentage.textContent = `${percentage}%`;
    
    if (percentage >= 70) scorePercentage.style.borderColor = 'var(--success-color)';
    else if (percentage >= 40) scorePercentage.style.borderColor = 'var(--secondary-color)';
    else scorePercentage.style.borderColor = 'var(--error-color)';
    
    showScreen(resultScreen);
};

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    showScreen(setupScreen);
    currentQuestionIndex = 0;
    score = 0;
});