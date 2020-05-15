var url="https://opentdb.com/api.php?amount=1&category=15&difficulty=easy&type=multiple"
const answerButtonsElement = document.getElementById('answer-buttons')

$("#start-btn").click(function(){
  startGame();
})

$("#next-btn").click(function(){
  setNextQuestion();
})

function startGame(){
  $("#start-btn").addClass("hide");
  $("#question-container").removeClass("hide");
  setNextQuestion();
}

function setNextQuestion(){
  resetState();
  showQuestion();
  
}

function resetState(){
  clearStatusClass(document.body);
  $("#next-btn").addClass("hide");
  while (answerButtonsElement.firstChild) {
    answerButtonsElement.removeChild(answerButtonsElement.firstChild)
  };
}

function setStatusClass(element, correct) {
  clearStatusClass(element)
  if (correct) {
    element.classList.add('correct')
  } else {
    element.classList.add('wrong')
  }
}

function clearStatusClass(element) {
  element.classList.remove('correct')
  element.classList.remove('wrong')
}

function showQuestion(){
  $.getJSON(url)
  .done(function(data){
  $("#question").html(data.results[0].question);
    var answers = data.results[0].incorrect_answers;
    answers.push(data.results[0].correct_answer);
    console.log(data.results[0].correct_answer)
    source = [{text:answers[0],correct:false},{text:answers[1],correct:false},{text:answers[2],correct:false},{text:answers[3],correct:true}];
    let returnedAnswer = Object.assign(answers, source);  
    let shuffledAnswers = arrayShuffle(returnedAnswer);
    shuffledAnswers.forEach(function(shuffledAnswer){
      var button = document.createElement('button');
      button.innerText = shuffledAnswer.text;
      button.classList.add('btn');
      if(shuffledAnswer.correct){
        button.dataset.correct = shuffledAnswer.correct
      }
      button.addEventListener("click", selectAnswer);
      answerButtonsElement.appendChild(button)
    })  
  })    
}

function selectAnswer(e) {
  const selectedButton = e.target
  const correct = selectedButton.dataset.correct
  setStatusClass(document.body, correct)
  Array.from(answerButtonsElement.children).forEach(button => {
    setStatusClass(button, button.dataset.correct)
  })
    $("#next-btn").removeClass('hide')
}



function arrayShuffle(arr){
  let newPos,
      temp;
  for (let i = arr.length-1;i>0;i--){
    newPos = Math.floor(Math.random() * (i+1));
    temp = arr[i];
    arr[i] = arr[newPos];
    arr[newPos] = temp;
  };
  return arr;
}

