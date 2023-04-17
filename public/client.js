const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const uInput = document.getElementById('usernameInput');
var username = "";
let boardSize = 5;
let size = canvas.width / boardSize;

class Game {
    constructor() {
        this.id = 0;
        this.p1 = "true";
        this.p2 = "";
        this.turn = "p1";
        // this.board = [boardSize][boardSize];
        this.board = [
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
        ];
    }
}

let thisGame = new Game();

const socket = io();

let playerTurn = true;
// let board=[3][3];
// let board = [
//     ['', '', ''],
//     ['', '', ''],
//     ['', '', '']
// ];
this.board = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
];

startBtn.addEventListener('click', function (e) {
    const searchMsg = document.getElementById('searchMsg');
    const seMsg = document.getElementById('startErrorMsg');
    if (uInput.value == "") {
        seMsg.hidden = false;
    } else {
        seMsg.hidden = true;
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

    if (thisGame.turn == "p1" & username == thisGame.p1) {
        if (board[row][col] === '') {
            let turn = "p2";
            thisGame.board[row][col] = 'X';
            board[row][col] = 'X';
            drawBoard();
            console.log("Move made: ", board);
            socket.emit('playerMove', row, col, turn, thisGame);
        }
    }

    if (thisGame.turn == "p2" & username == thisGame.p2) {
        if (board[row][col] === '') {
            let turn = "p1";
            thisGame.board[row][col] = "O";
            board[row][col] = 'O';
            drawBoard();
            console.log("Move made: ", board);
            socket.emit('playerMove', row, col, turn, thisGame);
        }
    }

    // if (playerTurn) {
    //     const x = event.offsetX;
    //     const y = event.offsetY;
    //     const row = Math.floor(y / 100);
    //     const col = Math.floor(x / 100);

    //     if (board[row][col] === '') {
    //         board[row][col] = 'X';
    //         drawBoard();
    //         // socket.emit('playerMove',);
    //         socket.emit('player-move', { row, col });
    //         playerTurn = false;
    //         console.log("Move made: ", board);
    //     }
    // }
});

socket.on('p1-joined', function (game) {
    var p1text = document.getElementById('p1Txt');
    var p2text = document.getElementById('p2Txt');
    console.log("p1-joined event: ", game);
    if (game.p1 == username) {
        thisGame = game;
        p1text.innerText = username;
    }
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
        p2text.innerText = username;
        p1text.innerText = game.p1;
    } else if (game.p1 == username) {
        thisGame = game;
        p2text.innerText = game.p2;
        p1text.innerText = game.p1;
    }
    searchMsg.hidden = true;
    foundMsg.hidden = false;
});


socket.on('opponentMove', function (move, game) {
    thisGame = game;
    if (thisGame.p1 == username) {
        board[move.row][move.col] = 'X';
        thisGame.board[move.row][move.col] = 'X';
    } else if (thisGame.p2 == username) {
        board[move.row][move.col] = 'O';
        thisGame.board[move.row][move.col] = 'O';
    }
    console.log("board[" + move.row + "][" + move.col + "]");
    drawBoard();
    playerTurn = true;
});


// socket.on('opponent-move', function (data) {
//     board[data.row][data.col] = 'O';
//     drawBoard();
//     playerTurn = true;
// });

function drawBoard() {
    //Clear the board
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw X's and O's
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const value = board[row][col];
            const x = col * 100 + 50;
            const y = row * 100 + 50;

            //set line thickness for the X's and O's
            context.lineWidth = 3;
            if (value === 'X') {
                //color is greenish
                context.fillStyle = "#33FF33";
                context.moveTo(x - 30, y - 30);
                context.lineTo(x + 30, y + 30);
                context.moveTo(x + 30, y - 30);
                context.lineTo(x - 30, y + 30);
            } else if (value === 'O') {
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
        context.moveTo(0, 100*i);
        context.lineTo(canvas.width, 100*i);
    }

    // // Draw vertical lines
    // context.moveTo(100, 0);
    // context.lineTo(100, canvas.height);
    // context.moveTo(200, 0);
    // context.lineTo(200, canvas.height);

    // // Draw horizontal lines
    // context.moveTo(0, 100);
    // context.lineTo(canvas.width, 100);
    // context.moveTo(0, 200);
    // context.lineTo(canvas.width, 200);

    context.stroke();
}

drawBoard();

