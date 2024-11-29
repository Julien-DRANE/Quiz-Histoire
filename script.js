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
  return array.sort(() => Math.random() - 0.5);
}

// Fonction pour démarrer le jeu
function startGame(epoch) {
  currentEpoch = epoch;
  currentScore = 0;
  currentQuestionIndex = 0;

  document.getElementById("epoch-select").style.display = "none";
  document.getElementById("quiz").style.display = "block";

  document.getElementById("game-container").style.backgroundImage = `url('${backgrounds[epoch]}')`;

  // Mélange les questions et sélectionne 7 questions uniques
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
  document.getElementById("question").innerText = currentQuestion.question;

  const answers = [...currentQuestion.answers];
  const correctAnswer = answers[currentQuestion.correct];
  const shuffledAnswers = shuffleArray([correctAnswer, ...answers.filter((_, idx) => idx !== currentQuestion.correct).slice(0, 2)]);

  const cardsContainer = document.getElementById("cards");
  cardsContainer.innerHTML = shuffledAnswers
    .map((answer, idx) => `
      <div class="card" onclick="checkCard('${answer === correctAnswer}', '${correctAnswer}')">
        <div class="card-inner">
          <div class="card-front">${answer}</div>
          <div class="card-back"></div>
        </div>
      </div>
    `)
    .join("");
}

// Affiche la carte correcte au centre de l'écran
function showCorrectAnswer(correctAnswer) {
  const correctCard = document.getElementById("correct-answer-card");
  const cardFront = correctCard.querySelector(".card-front");

  // Met à jour le contenu de la face avant avec la bonne réponse
  cardFront.textContent = correctAnswer;

  // Affiche et retourne la carte correcte
  correctCard.style.display = "block";
  correctCard.classList.add("show");

  // Cache la carte après 3 secondes
  setTimeout(() => {
    correctCard.classList.remove("show");
    correctCard.style.display = "none";
  }, 3000);
}

// Vérifie si la carte cliquée est correcte
function checkCard(isCorrect, correctAnswer) {
  if (isCorrect === "true") {
    currentScore += 5; // Ajoute 5 points pour une bonne réponse
    showFeedback("✅ Bonne réponse !", true);
    correctSound.play(); // Joue le son pour une bonne réponse
    updateProgressTrack(true); // Met à jour le parcours pour une bonne réponse
  } else {
    currentScore -= 1; // Retire 1 point pour une mauvaise réponse
    showFeedback("❌ Mauvaise réponse !", false);
    showCorrectAnswer(correctAnswer); // Affiche la carte correcte
    updateProgressTrack(false); // Met à jour le parcours pour une mauvaise réponse
  }
  updateScore();
  currentQuestionIndex++;
  setTimeout(() => loadQuestion(), 3000); // Attend que la carte correcte disparaisse avant de charger la suivante
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
  const pointId = `point-${currentQuestionIndex + 1}`;
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
// Déclenche une pluie de confettis
function triggerConfetti() {
    const duration = 5 * 1000; // 5 secondes
    const end = Date.now() + duration;
  
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
  
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }
// Fin du jeu et retour à la page de démarrage
function endGame() {
    document.getElementById("question").innerText = "Félicitations, vous avez terminé votre quête !";
    document.getElementById("cards").innerHTML = "";
  
    // Vérifie si toutes les réponses sont correctes
    const allCorrect = currentQuestions.length === 7 && currentScore === 35;
  
    if (allCorrect) {
      showFeedback("🎉 Parfait ! Toutes les réponses sont correctes !", true);
      triggerConfetti(); // Déclenche les confettis
    } else {
      showFeedback(`🎉 Votre score final est de ${currentScore}`, true);
    }
  
    setTimeout(() => {
      // Retour à la page de démarrage
      document.getElementById("epoch-select").style.display = "block";
      document.getElementById("quiz").style.display = "none";
      document.getElementById("game-container").style.backgroundImage = "none";
    }, 3000);
  }

// Charger les questions et les sons au démarrage
loadQuestions();
loadSounds();
