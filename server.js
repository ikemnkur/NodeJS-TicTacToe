const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));

let numOfgames = 1;
let defaultBoardSize = 5;

class Game {
    constructor() {
        this.id = numOfgames;
        this.p1Socket = "";
        this.p2Socket = "";
        this.p1 = "";
        this.p2 = "";
        this.turn = "p1";
        this.moveNum = 0;
        this.BoardSize = 5;
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

function checkWinner(board, size, playerNum) {
    let marksInaRow = 0;
    let element;
    if (playerNum == 2) {
        element = 'O'
    } else if (playerNum == 1) {
        element = 'X'
    }

    // Check rows
    for (let row = 0; row < size; row++) {
        let win = false;
        for (let col = 0; col < size; col++) {
            if (marksInaRow > 3) {
                win = true;
                break;
            }
            if (board[row][col] == element) {
                marksInaRow++;
            } else {
                marksInaRow = 0;
            }
        }
        if (win) {
            console.log(element, " wins!!!")
            return element;
        }
    }

    // Check columns
    for (let col = 0; col < size; col++) {
        let win = false;
        marksInaRow = 0;
        for (let row = 0; row < size; row++) {
            if (marksInaRow > 3) {
                win = true;
                break;
            }
            if (board[row][col] == element) {
                marksInaRow++;
            } else {
                marksInaRow = 0;
            }
        }
        if (win) {
            return element;
        }
    }

    // let element;
    // if (playerNum == 2) {
    //     element = 'O'
    // } else if (playerNum == 1) {
    //     element = 'X'
    // }

    // Check diagonals
    let diagWin = false;
    marksInaRow = 0;
    for (let i = 0; i < size; i++) {
        if (marksInaRow > 3) {
            diagWin = true;
            break;
        }
        if (board[i][i] == element) {
            marksInaRow++;
        } else {
            marksInaRow = 0;
        }
        marksInaRow++;
    }
    if (diagWin) {
        return element;
    }

    // let secondDiagonalElement;
    // if (playerNum == 2) {
    //     secondDiagonalElement = 'O'
    // } else if (playerNum == 1) {
    //     secondDiagonalElement = 'X'
    // }
    diagWin = false;
    marksInaRow = 0;
    for (let i = 0; i < size; i++) {
        if (marksInaRow > 3) {
            diagWin = true;
            break;
        }
        if (board[i][size - 1 - i] == element) {
            marksInaRow++;
        } else {
            marksInaRow = 0;
        }
        marksInaRow++;
    }
    if (diagWin) {
        return diagWin;
    }

    // No winner
    return null;
}

var games = []

io.on('connection', function (socket) {
    console.log('A user connected');

    socket.emit("serverConnected", numOfgames);

    // // Handle player move event
    // socket.on('player-move', function (data) {
    //     // socket.broadcast.emit('opponent-move', data);

    //     socket.emit('opponent-move', data);
    // });

    // Handle player move event
    socket.on('playerMove', function (row, col, nextTurn, playerNum, thisGame) {

        let game = games[thisGame.id];
        if (game == null) {
            return 0; //
        }
        game.turn = nextTurn;
        game.moveNum++;

        if (nextTurn == "p1") {
            game.board[row][col] = 'X';
            game.moves[row][col] = 'X#' + game.moveNum;
        }

        if (nextTurn == "p2") {
            game.board[row][col] = 'O';
            game.moves[row][col] = 'O#' + game.moveNum;
        }

        game.board = thisGame.board;
        let move = { row: row, col: col }

        if (nextTurn == "p1") {
            io.to(game.p1Socket).emit('opponentMove', move, playerNum, game);
            io.to(game.p2Socket).emit('opponentMove', move, playerNum, game);
        }

        if (nextTurn == "p2") {
            io.to(game.p2Socket).emit('opponentMove', move, playerNum, game);
            io.to(game.p1Socket).emit('opponentMove', move, playerNum, game);
        }

        console.log(nextTurn, "to move");

        if (checkWinner(game.board, 5, 1) == 'X') {
            io.to(game.p1Socket).emit('winner', game.p1);
            io.to(game.p2Socket).emit('winner', game.p1);
        }
        if (checkWinner(game.board, 5, 2) == 'O') {
            io.to(game.p1Socket).emit('winner', game.p2);
            io.to(game.p2Socket).emit('winner', game.p2);
        }
        if (game.moveNum >= (game.boardSize * game.boardSize - 2)) {
            io.to(game.p1Socket).emit('winner', "draw");
            io.to(game.p2Socket).emit('winner', "draw");
        }

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
