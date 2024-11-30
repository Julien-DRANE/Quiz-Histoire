let questions = {}; // Les questions seront chargées depuis le fichier JSON
const backgrounds = {
  "antiquity": "images/antiquity.png",
  "middle-age": "images/middle-age.png",
  "renaissance": "images/renaissance.png",
  "revolution": "images/revolution.png",
  "20th-century": "images/20th-century.png",
  "contemporary": "images/contemporary.png"
};
let currentScore = 0;
let currentEpoch = "";
let currentQuestionIndex = 0;
let currentQuestions = [];
let correctSound;
let isProcessing = false;

// Échappe les caractères spéciaux pour éviter les erreurs HTML ou les attaques XSS
function escapeHTML(string) {
    return String(string)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

// Détecte si l'appareil est tactile
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Charge les questions depuis un fichier JSON
function loadQuestions() {
  fetch("questions.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Erreur de chargement du fichier JSON.");
      }
      return response.json();
    })
    .then(data => {
      questions = data;
      console.log("Questions chargées :", questions);
    })
    .catch(error => console.error("Erreur lors du chargement des questions :", error));
}

// Charge les sons
function loadSounds() {
  correctSound = new Audio("audio/correct.mp3");
  correctSound.preload = 'auto'; // Précharge le son
}

// Affiche un message dans la div feedback
function showFeedback(message, isCorrect) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.style.backgroundColor = isCorrect ? "rgba(0, 128, 0, 0.8)" : "rgba(255, 0, 0, 0.8)";
  feedback.classList.add("show");

  setTimeout(() => feedback.classList.remove("show"), 3000);
}

// Mélange un tableau
function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Fonction pour démarrer le jeu
function startGame(epoch) {
  currentEpoch = epoch;
  currentScore = 0;
  currentQuestionIndex = 0;

  document.getElementById("epoch-select").style.display = "none";
  document.getElementById("quiz").style.display = "block";

  document.getElementById("game-container").style.backgroundImage = `url('${backgrounds[epoch]}')`;

  currentQuestions = shuffleArray(questions[epoch] || []).slice(0, 7);
  resetProgressTrack();
  loadQuestion();
}

// Charge une question
function loadQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    endGame();
    return;
  }

  const currentQuestion = currentQuestions[currentQuestionIndex];

  if (
    !currentQuestion.question ||
    !Array.isArray(currentQuestion.answers) ||
    currentQuestion.correct === undefined ||
    currentQuestion.correct < 0 ||
    currentQuestion.correct >= currentQuestion.answers.length
  ) {
    console.error("Question invalide détectée :", currentQuestion);
    showFeedback("❌ Une erreur est survenue avec cette question !", false);
    currentQuestionIndex++;
    setTimeout(() => loadQuestion(), 3000);
    return;
  }

  document.getElementById("question").innerText = currentQuestion.question;

  const answers = shuffleArray([...currentQuestion.answers]);
  const correctAnswer = currentQuestion.answers[currentQuestion.correct];

  const cardsContainer = document.getElementById("cards");
  cardsContainer.innerHTML = answers
    .map((answer, index) => `
      <div class="card" tabindex="0" role="button" aria-pressed="false" aria-label="Réponse ${index + 1}: ${escapeHTML(answer)}">
        <div class="card-inner">
          <div class="card-front">${escapeHTML(answer)}</div>
          <div class="card-back"></div>
        </div>
      </div>
    `)
    .join("");

  // Ajouter des écouteurs d'événements avec pointerup
  const cardElements = cardsContainer.querySelectorAll('.card');
  cardElements.forEach(card => {
    const front = card.querySelector('.card-front');
    const answer = front.textContent;

    // Utilisez pointerup au lieu de click et keypress
    card.addEventListener('pointerup', () => handleCardClick(answer, correctAnswer, card));
  });
}

// Gère le clic/tap sur une carte
function handleCardClick(selectedAnswer, correctAnswer, cardElement) {
  if (isProcessing) return;
  isProcessing = true;

  console.log("Carte cliquée :", selectedAnswer);

  // Inverser la carte en ajoutant une classe 'selected'
  cardElement.classList.add('selected');
  console.log("Classe 'selected' ajoutée à la carte");

  if (selectedAnswer === correctAnswer) {
    // Bonne réponse
    currentScore += 5;
    showFeedback("✅ Bonne réponse !", true);
    correctSound.play();
    updateProgressTrack(true);
    console.log("Bonne réponse détectée");
  } else {
    // Mauvaise réponse
    currentScore -= 1;
    showFeedback("❌ Mauvaise réponse !", false);
    showCorrectAnswer(correctAnswer);
    updateProgressTrack(false);
    console.log("Mauvaise réponse détectée");
  }

  updateScore();
  currentQuestionIndex++;

  setTimeout(() => {
    isProcessing = false;
    loadQuestion();
  }, 3000);
}

// Affiche la carte correcte au centre de l'écran
function showCorrectAnswer(correctAnswer) {
  const correctCard = document.getElementById("correct-answer-card");
  const cardFront = correctCard.querySelector(".card-front");

  cardFront.textContent = correctAnswer;
  correctCard.style.display = "block";
  correctCard.classList.add("show");

  setTimeout(() => {
    correctCard.classList.remove("show");
    correctCard.style.display = "none";
  }, 3000);
}

// Met à jour l'affichage du score
function updateScore() {
  document.getElementById("score").innerText = `Score : ${currentScore}`;
}

// Réinitialise le parcours visuel
function resetProgressTrack() {
  for (let i = 1; i <= 7; i++) {
    const point = document.getElementById(`point-${i}`);
    if (point) {
      point.classList.remove("active", "correct", "incorrect");
    }
  }
}

// Met à jour le parcours visuel
function updateProgressTrack(isCorrect) {
  const pointId = `point-${currentQuestionIndex}`;
  const pointElement = document.getElementById(pointId);

  if (pointElement) {
    pointElement.classList.add("active");
    if (isCorrect) {
      pointElement.classList.add("correct");
    } else {
      pointElement.classList.add("incorrect");
    }
  }
}

// Fin du jeu et retour à l'écran de démarrage
function endGame() {
  document.getElementById("question").innerText = "Félicitations, vous avez terminé votre quête !";
  document.getElementById("cards").innerHTML = "";

  const allCorrect = currentQuestions.length === 7 && currentScore === 35;

  if (allCorrect) {
    showFeedback("🎉 Parfait ! Toutes les réponses sont correctes !", true);
    triggerConfetti();
  } else {
    showFeedback(`🎉 Votre score final est de ${currentScore}`, true);
  }

  setTimeout(() => {
    // Retourner à l'écran de sélection de l'époque après l'animation
    document.getElementById("epoch-select").style.display = "block";
    document.getElementById("quiz").style.display = "none";
    document.getElementById("game-container").style.backgroundImage = "none";
    // Réinitialiser le score si nécessaire
    currentScore = 0;
    updateScore();
  }, 5000); // Assurez-vous que cette durée correspond à la durée des confettis
}

// Déclenche une pluie de confettis
function triggerConfetti() {
  const duration = 5 * 1000; // 5 secondes
  const end = Date.now() + duration;

  // Vérifiez si la fonction confetti est disponible
  if (typeof confetti !== 'function') {
    console.error("La fonction confetti n'est pas définie. Assurez-vous que Canvas Confetti est correctement inclus.");
    return;
  }

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#bb0000', '#ffffff']
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#00bb00', '#0000ff']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// Charger les questions et les sons au démarrage
document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();
  loadSounds();
});
