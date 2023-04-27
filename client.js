const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const uInput = document.getElementById('usernameInput');
var username = "";
var playerNum = "";
let boardSize = 7;
let winningPlayer = "";
let gamestart = false;
let gameover = false;
let size = canvas.width / boardSize;
var soundIsplaying = false;
let gameMsg = document.getElementById('gameMsg');
const searchMsg = document.getElementById('searchMsg');
const errorMsg = document.getElementById('startErrorMsg');
const turnErrorMsg = document.getElementById('turnErrorMsg');
const winMsg = document.getElementById('winMsg');
const loseMsg = document.getElementById('loseMsg');

class Game {
    constructor() {
        this.id = 0;
        this.p1 = "true";
        this.p2 = "";
        this.turn = "p1";
        this.moveNum = 0;
        this.boardSize = 7;
        this.board = [
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
        ];
        this.moves = [
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
            ['', '', '', '', '', '', '',],
        ];
    }
}

let thisGame = new Game();

function playsound(sound) {
    if (soundIsplaying == false) {
        soundIsplaying = true;
        var audio = new Audio(sound);
        audio.play();
        setTimeout(soundIsplaying = false, audio.duration + 500)
        // console.log("sound is playing");
    } else {
        // console.log("sound is already playing");
    }
}

const socket = io();

let playerTurn = true;

startBtn.addEventListener('click', function (e) {
    const searchMsg = document.getElementById('searchMsg');
    const errorMsg = document.getElementById('startErrorMsg');
    if (uInput.value == "") {
        errorMsg.hidden = false;
    } else {
        errorMsg.hidden = true;
        searchMsg.hidden = false;
        socket.emit('joinGame', uInput.value, boardSize);
        username = uInput.value;
        startBtn.style.background = "#FF3366"
    }
    if (thisGame !== null) {
        drawBoard();
    }
});

canvas.addEventListener('click', function (event) {
    const x = event.offsetX;
    const y = event.offsetY;

    // NxN cell division
    const row = Math.floor(y / size);
    const col = Math.floor(x / size);

    if (gamestart == false) { // if game is not started, meaning player2 is not joined
        let oldMSg = errorMsg.innerText;
        errorMsg.innerText = "First Start A Game. Then wait for another player to join.";
        errorMsg.hidden = false;
        setTimeout(() => {
            errorMsg.hidden = true;
            errorMsg.innerText = oldMSg;
        }, 3000);
        playsound("click.mp3");
        return false;
    }
    if (playerTurn && gameover == false) {
        if (thisGame.turn == "p1" & username == thisGame.p1) {
            if (thisGame.board[row][col] === '') {
                let turn = "p2";
                thisGame.board[row][col] = 'X';
                drawBoard();
                socket.emit('playerMove', row, col, turn, playerNum, thisGame);
                playsound("select.wav");
                if (username == thisGame.p2) {
                    gameMsg.innerText = "It's your turn to make a move."
                } else {
                    gameMsg.innerText = "It's " + thisGame.p2 + "'s turn to make a move."
                }
                playerTurn = false;
            }
        } else if (thisGame.turn == "p2" & username == thisGame.p2) {
            if (thisGame.board[row][col] === '') {
                let turn = "p1";
                thisGame.board[row][col] = "O";
                drawBoard();
                socket.emit('playerMove', row, col, turn, playerNum, thisGame);
                playsound("select.wav");
                if (username == thisGame.p2) {
                    gameMsg.innerText = "It's your turn to make a move."
                } else {
                    gameMsg.innerText = "It's " + thisGame.p2 + "'s turn to make a move."
                }
                playerTurn = false;
            }
        } else {
            if (thisGame.moveNum == 0 & username == "") { //if no moves have been made yet and the user has not started searching for a game yet
                errorMsg.hidden = false;
                setTimeout(() => { errorMsg.hidden = true; }, 2000);
                playsound("click.mp3");
            } else if (gameover == false) { // if game is not over
                turnErrorMsg.hidden = false;
                setTimeout(() => { turnErrorMsg.hidden = true; }, 2000);
                playsound("badMove.wav");
            }
        }
    }

});

socket.on("serverConnected", function (numberGames) {
    console.log("Server connected. ");
    console.log("Socket.IO ID:", socket.id)
    var gameId = document.getElementById('gameID');
    gameId.innerText = numberGames;
})

socket.on('p1-joined', function (game) {
    var p1text = document.getElementById('p1Txt');
    console.log("p1-joined event: ", game);
    if (game.p1 == username) {
        playerNum = 1;
        thisGame = game;
        p1text.innerText = username;
    }
    playerTurn = true;
});

socket.on('p2-joined', function (game, self) {
    console.log("p2-joined event: ", game);
    var p2text = document.getElementById('p2Txt');
    var p1text = document.getElementById('p1Txt');
    var gameId = document.getElementById('gameID');
    var searchMsg = document.getElementById('searchMsg');
    var foundMsg = document.getElementById('foundMsg');
    gameId.innerText = game.id;
    if (game.p2 == username) {
        thisGame = game;
        playerNum = 2;
        p2text.innerText = username;
        p1text.innerText = game.p1;
        // gameMsg.innerText = "It's " + game.p1 + "'s turn to make a move."
    } else if (game.p1 == username) {
        thisGame = game;
        p2text.innerText = game.p2;
        p1text.innerText = game.p1;
        // gameMsg.innerText = "It's Your turn to make a move."
    }
    searchMsg.hidden = true;
    foundMsg.hidden = false;
    setTimeout(() => {
        foundMsg.hidden = true;
        gameMsg.hidden = false;
    }, 3000)
    drawBoard();
    playsound("GameStart.mp3");
    gamestart = true;
    timeControl();

});

let updateTime = false;

setInterval(function () { timeControl(); }, 1000);

function timeControl() {
    if (gameover == false && gamestart == true) {
        if (thisGame.turn == "p1") {
            thisGame.p1time++;
        } else if (thisGame.turn == "p2") {
            thisGame.p2time++;
        }
        var p1time = document.getElementById("p1time");
        let t1 = Math.floor(thisGame.p1time / 60) + ":" + (thisGame.p1time % 60);
        if ((thisGame.p1time % 60) < 10)
            t1 = Math.floor(thisGame.p1time / 60) + ":0" + (thisGame.p1time % 60);
        p1time.innerText = t1;
        // console.log("p1 time: " + t1)
        var p2time = document.getElementById("p2time");
        let t2 = Math.floor(thisGame.p2time / 60) + ":" + (thisGame.p2time % 60);
        if ((thisGame.p2time % 60) < 10)
            t1 = Math.floor(thisGame.p2time / 60) + ":0" + (thisGame.p2time % 60);
        p2time.innerText = t2;
        // console.log("p2 time: " + t2)
    }
}

let newGameBtn = document.getElementById("newGameBtn");

newGameBtn.addEventListener("click", () => {
    gameover = false;
    thisGame = new Game();
    loseMsg.hidden = true;
    winMsg.hidden = true;
    gameMsg.hidden = true;
    drawBoard();
    newGameBtn.hidden = true;
    socket.emit('joinGame', uInput.value, boardSize);
});

socket.on('winner', function (winner) {
    newGameBtn.hidden = false;
    gameMsg.hidden = false;
    gamestart = false;
    gameover = true;
    if (winner == "draw") {
        gameMsg.innerText = "Game Over: There is a Draw!"
        playsound("DrawGame.wav")
    } else {
        console.log("winner: " + winner);
        winningPlayer = winner;
        if (winningPlayer != username) {
            playsound("LoseGame.wav")
            gameMsg.innerText = "Game Over: You lose, " + winner + "has won!"
            loseMsg.hidden = false;
        } else {
            gameMsg.innerText = "Game Over: You win, " + winner + "has won!"
            winMsg.hidden = false;
            playsound("WinGame.wav")
        }
        setTimeout(() => { gameMsg.hidden = true; errorMsg.hidden = true; turnErrorMsg.hidden = true; }, 3000);
    }
})

socket.on('opponentMove', function (move, playerNumber, game) {
    thisGame = game;
    errorMsg.hidden = true;
    if (playerNumber == 1) {
        thisGame.board[move.row][move.col] = 'X';
        gameMsg.innerText = "An 'X' had been placedon the board @: [" + move.row + "][" + move.col + "]";
        setTimeout(() => { gameMsg.innerText = "It's " + thisGame.p2 + "'s turn to make a move." }, 2500)
    } else if (playerNumber == 2) {
        thisGame.board[move.row][move.col] = 'O';
        gameMsg.innerText = "An 'O' had been placed on the board at: [" + move.row + "][" + move.col + "]";
        setTimeout(() => { gameMsg.innerText = "It's " + thisGame.p1 + "'s turn to make a move." }, 2500)
    }
    // updateTime = true;
    timeControl();
    drawBoard();
    if (playerNumber == playerNum) {
        playerTurn = true;
    } else {
        playsound("newTurn.wav");
    }

});

function drawBoard() {
    //Clear the board
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw X's and O's
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const value = thisGame.board[row][col];
            const x = col * size + size / 2;
            const y = row * size + size / 2;

            //set line thickness for the X's and O's
            context.lineWidth = 3;
            if (value == 'X') {
                //color is greenish
                // context.fillStyle = "#33FF33";
                // context.moveTo(x - 30, y - 30);
                // context.lineTo(x + 30, y + 30);
                // context.moveTo(x + 30, y - 30);
                // context.lineTo(x - 30, y + 30);
                // context.stroke();

                context.beginPath();
                context.arc(x, y, 25, 0, 2 * Math.PI, false);
                context.fillStyle = 'green';
                context.fill();
                context.lineWidth = 5;
                context.strokeStyle = '#006600';
                context.stroke();
            }
            if (value == 'O') {
                // color is reddish
                // context.fillStyle = "#FF3333";
                // context.beginPath();
                // context.arc(x, y, 30, 0, Math.PI * 2);
                // context.stroke();

                context.beginPath();
                context.arc(x, y, 25, 0, 2 * Math.PI, false);
                context.fillStyle = 'red';
                context.fill();
                context.lineWidth = 5;
                context.strokeStyle = '#660000';
                context.stroke();
            }
            //reset the fill color and line thickness
            context.fillStyle = "#000000";
            context.lineWidth = 1;
        }
    }

    context.beginPath();

    context.strokeStyle = 'black';
    context.lineWidth = 3;
    for (var i = 1; i < boardSize; i++) {
        let dist = canvas.width / boardSize;
        // Draw vertical lines
        context.moveTo(dist * i, 0);
        context.lineTo(dist * i, canvas.height);
        // Draw horizontal lines
        context.moveTo(0, dist * i);
        context.lineTo(canvas.width, dist * i);
    }

    context.stroke();
}

drawBoard();

