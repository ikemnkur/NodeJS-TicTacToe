const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));

let numOfgames = 0;
let defaultBoardSize = 5;

class Game {
    constructor() {
        this.id = numOfgames;
        this.p1Socket = "";
        this.p2Socket = "";
        this.p1 = "";
        this.p2 = "";
        this.turn = "p1";
        // this.board = [3][3];
        // this.board = [
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
    }
}

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

var games = []

io.on('connection', function (socket) {
    console.log('A user connected');

    // Handle player move event
    socket.on('player-move', function (data) {
        // socket.broadcast.emit('opponent-move', data);

        socket.emit('opponent-move', data);
    });

    // Handle player move event
    socket.on('playerMove', function (row, col, nextTurn, thisGame) {
        // socket.broadcast.emit('opponent-move', data);
        let game = games[thisGame.id];
        game.turn = nextTurn;
        if (nextTurn == "p1") {
            game.board[row][col] = 'X';
        } else {
            game.board[row][col] = 'O';
        }

        game.board = thisGame.board;
        let move = { row: row, col: col }
        if (nextTurn == "p1") {
            io.to(game.p1Socket).emit('opponentMove', move, game);
        } else {
            io.to(game.p2Socket).emit('opponentMove', move, game);
        }
        // socket.emit('opponentMove', move, game);
        console.log(nextTurn, "to move");
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected');
    });

    socket.on('joinGame', function (playerUsername, boardSize) {
        let game;
        if (games[numOfgames] == null) {
            game = new Game();
            game.id = numOfgames;
            game.p1 = playerUsername;
            games[numOfgames] = game;
            // game.board = [boardSize][boardSize];

            //store the socketId for this user
            game.p1Socket = socket.id;
            socket.emit('p1-joined', game)
            console.log("Game (p1): ", game)

        } else {
            game = games[numOfgames];
            game.p2 = playerUsername;
            numOfgames++;

            //store the socketId for this user
            game.p2Socket = socket.id;
            socket.emit('p2-joined', game, false);
            console.log("Game (p2): ", game)
            io.to(game.p1Socket).emit('p2-joined', game, true);
        }
    });
});

server.listen(3000, function () {
    console.log('Server started on port 3000');
});
