const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const uInput = document.getElementById('usernameInput');
var username = "";
var playerNum = "";
let boardSize = 5;
let winningPlayer = "";
let gameover = false;
let size = canvas.width / boardSize;
var soundIsplaying = false;
let gameMsg = document.getElementById('gameMsg');
const searchMsg = document.getElementById('searchMsg');
const errorMsg = document.getElementById('startErrorMsg');

class Game {
    constructor() {
        this.id = 0;
        this.p1 = "true";
        this.p2 = "";
        this.turn = "p1";
        this.moveNum = 0;
        this.boardSize = 5;
        this.board = [
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
        ];
        this.moves = [
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
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
});

canvas.addEventListener('click', function (event) {
    const x = event.offsetX;
    const y = event.offsetY;

    // NxN cell division
    const row = Math.floor(y / size);
    const col = Math.floor(x / size);

    if (thisGame == null) {
        playsound("click.mp3");
        return false;
    }
    if (playerTurn && !gameover) {
        if (thisGame.turn == "p1" & username == thisGame.p1) {
            if (thisGame.board[row][col] === '') {
                let turn = "p2";
                thisGame.board[row][col] = 'X';
                drawBoard();
                socket.emit('playerMove', row, col, turn, playerNum, thisGame);
                playsound("select.wav");
                gameMsg.innerText = "It's " + thisGame.p2 + "'s turn to make a move."
            }
            playerTurn = false;
        } else
            if (thisGame.turn == "p2" & username == thisGame.p2) {
                if (thisGame.board[row][col] === '') {
                    let turn = "p1";
                    thisGame.board[row][col] = "O";
                    drawBoard();
                    socket.emit('playerMove', row, col, turn, playerNum, thisGame);
                    playsound("select.wav");

                }
                playerTurn = false;
            } else {

                if (thisGame.moveNum == 0) {
                    errorMsg.hidden = false;
                    playsound("click.mp3");
                } else {
                    playsound("select_denied.mp3");
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
});

socket.on('winner', function (winner) {
    gameover = true;
    if (winner == "draw") {
        gameMsg.innerText = "Game Over: There is a Draw!"
        playsound("DrawGame.wav")
    } else {
        console.log("winner: " + winner);
        winningPlayer = winner;
        if (winningPlayer == username) {
            playsound("LoseGame.wav")
            gameMsg.innerText = "Game Over: You lose, " + winner + "has won!"
        } else {
            gameMsg.innerText = "Game Over: You win, " + winner + "has won!"
            playsound("WinGame.wav")
        }
    }
})

socket.on('opponentMove', function (move, playerNumber, game) {
    thisGame = game;
    if (playerNumber == 1) {
        thisGame.board[move.row][move.col] = 'X';
        gameMsg.innerText = "An 'X' had been placedon the board @: [" + move.row + "][" + move.col + "]";
        setTimeout(() => { gameMsg.innerText = "It's " + thisGame.p2 + "'s turn to make a move." }, 2500)
    } else if (playerNumber == 2) {
        thisGame.board[move.row][move.col] = 'O';
        gameMsg.innerText = "An 'O' had been placed on the board at: [" + move.row + "][" + move.col + "]";
        setTimeout(() => { gameMsg.innerText = "It's " + thisGame.p1 + "'s turn to make a move." }, 2500)
    }
    drawBoard();
    if (playerNumber == playerNum)
        playerTurn = true;
});

function drawBoard() {
    //Clear the board
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw X's and O's
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const value = thisGame.board[row][col];
            const x = col * 100 + 50;
            const y = row * 100 + 50;

            //set line thickness for the X's and O's
            context.lineWidth = 3;
            if (value == 'X') {
                //color is greenish
                context.fillStyle = "#33FF33";
                context.moveTo(x - 30, y - 30);
                context.lineTo(x + 30, y + 30);
                context.moveTo(x + 30, y - 30);
                context.lineTo(x - 30, y + 30);
                context.stroke();
            }
            if (value == 'O') {
                // color is reddish
                context.fillStyle = "#FF3333";
                context.beginPath();
                context.arc(x, y, 30, 0, Math.PI * 2);
                context.stroke();
            }
            //reset the fill color and line thickness
            context.fillStyle = "#000000";
            context.lineWidth = 1;
        }
    }

    context.beginPath();

    for (var i = 1; i < boardSize; i++) {
        // Draw vertical lines
        context.moveTo(100 * i, 0);
        context.lineTo(100 * i, canvas.height);
        // Draw horizontal lines
        context.moveTo(0, 100 * i);
        context.lineTo(canvas.width, 100 * i);
    }

    context.stroke();
}

drawBoard();

function checkWinner(board, size) {

    // Check rows
    for (let row = 0; row < size; row++) {
        const firstElement = board[row][0];
        let win = true;
        for (let col = 1; col < size; col++) {
            if (board[row][col] !== firstElement) {
                win = false;
                break;
            }
        }
        if (win) {
            return firstElement;
        }
    }

    // Check columns
    for (let col = 0; col < size; col++) {
        const firstElement = board[0][col];
        let win = true;
        for (let row = 1; row < size; row++) {
            if (board[row][col] !== firstElement) {
                win = false;
                break;
            }
        }
        if (win) {
            return firstElement;
        }
    }

    // Check diagonals
    const firstDiagonalElement = board[0][0];
    let firstDiagonalWin = true;
    for (let i = 1; i < size; i++) {
        if (board[i][i] !== firstDiagonalElement) {
            firstDiagonalWin = false;
            break;
        }
    }
    if (firstDiagonalWin) {
        return firstDiagonalElement;
    }

    const secondDiagonalElement = board[0][size - 1];
    let secondDiagonalWin = true;
    for (let i = 1; i < size; i++) {
        if (board[i][size - 1 - i] !== secondDiagonalElement) {
            secondDiagonalWin = false;
            break;
        }
    }
    if (secondDiagonalWin) {
        return secondDiagonalElement;
    }

    // No winner
    return null;
}