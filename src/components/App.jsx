import React from 'react';
import {
  COLOR, Chessboard, MOVE_INPUT_MODE, INPUT_EVENT_TYPE,
} from 'cm-chessboard';
import _ from 'lodash';
import Chess from '../chess';
import DialogColorSelection from './DialogColorSelection';
import DialogLevelSelection from './DialogLevelSelection';
import Game from './Game';
import Mate from './Mate';
import './App.css';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      color: 'white', // white or black
      level: 1,
      isSelectedColor: false,
      isSelectedLevel: false,
      isCheckmate: false,
    };
    this.chessboard = null;
    this.matchGame = null;
    this.valuePieces = {
      pawn: 10,
      knight: 30,
      bishop: 30,
      rook: 50,
      queen: 90,
      king: 900,
    };
  }

  handleChoiceColor = (color) => {
    this.setState({
      color,
      isSelectedColor: true,
    });
  }

  handleChoiceLevel = (level) => {
    this.setState({
      level,
      isSelectedLevel: true,
    });
  }

  componentDidUpdate = () => {
    if (this.state.isSelectedColor && this.state.isSelectedLevel) {
      const orientation = this.state.color === 'white' ? COLOR.white : COLOR.black;
      this.matchGame = new Chess();
      this.chessboard = new Chessboard(document.getElementById('board'), {
        position: this.matchGame.fen(),
        orientation,
        style: {
          cssClass: 'default',
          showCoordinates: true,
          showBorder: false,
        },
        responsive: false,
        animationDuration: 300,
        moveInputMode: MOVE_INPUT_MODE.dragPiece,
        sprite: {
          url: './assets/images/chessboard-sprite.svg',
          grid: 40,
        },
      });
      if (this.state.color === 'black') {
        const nextMove = this.calculateBestMove(this.matchGame);
        if (nextMove !== null) {
          this.matchGame.move(nextMove);
          this.chessboard.enableMoveInput(this.inputHandler, orientation);
          this.chessboard.setPosition(this.matchGame.fen());
        }
      }
      this.chessboard.enableMoveInput(this.inputHandler, orientation);
    }
  }

  getPieceValue = (piece, color) => {
    const getAbsoluteValue = (_piece) => {
      switch (_piece) {
        case 'p':
          return this.valuePieces.pawn;
        case 'r':
          return this.valuePieces.rook;
        case 'n':
          return this.valuePieces.knight;
        case 'b':
          return this.valuePieces.bishop;
        case 'q':
          return this.valuePieces.queen;
        case 'k':
          return this.valuePieces.queen;
        default:
          throw new Error(`Unknown piece type: ${_piece}`);
      }
    };
    return color === 'w' ? getAbsoluteValue(piece) : -getAbsoluteValue(piece);
  };

  /**
   *
   * @param {Array[]} board
   * @param {String} currentSide
   */
  evaluateBoard = (board) => {
    let totalEvaluation = 0;
    for (let row = 0; row < board.length; row += 1) {
      for (let column = 0; column < board[row].length; column += 1) {
        if (board[row][column] !== null) {
          totalEvaluation += this.getPieceValue(board[row][column].type, board[row][column].color);
        }
      }
    }
    return totalEvaluation;
  };

  minimax = (depth, game, alpha, beta, isMaximisingPlayer) => {
    if (depth === 0) {
      return this.evaluateBoard(game.board());
    }
    const possibleMoves = game.moves();
    if (isMaximisingPlayer) {
      let bestMove = -9999;
      for (let index = 0; index < possibleMoves.length; index += 1) {
        game.move(possibleMoves[index]);
        bestMove = Math.max(bestMove, this.minimax(depth - 1, game, alpha, beta, false));
        game.undo();
        alpha = Math.max(alpha, bestMove);
        if (beta <= alpha) {
          return bestMove;
        }
      }
      return bestMove;
    } else {
      let bestMove = 9999;
      for (let index = 0; index < possibleMoves.length; index += 1) {
        game.move(possibleMoves[index]);
        bestMove = Math.min(bestMove, this.minimax(depth - 1, game, alpha, beta, true));
        game.undo();
        beta = Math.min(beta, bestMove);
        if (beta <= alpha) {
          return bestMove;
        }
      }
      return bestMove;
    }
  };

  /**
   *
   * @param {Chess} game
   */
  calculateBestMove = (game) => {
    const calculateBestMoveForBlack = (_game) => {
      let minValue = 9999;
      let bestMove = null;
      const possibleMoves = _game.moves({ verbose: true });
      for (let index = 0; index < possibleMoves.length; index += 1) {
        _game.move(possibleMoves[index]);
        const newMinValue = this.minimax(2, _game, -10000, 10000, true);
        _game.undo();
        if (newMinValue <= minValue) {
          minValue = newMinValue;
          bestMove = possibleMoves[index];
        }
      }
      return bestMove;
    };

    const calculateBestMoveForWhite = (_game) => {
      let maxValue = -9999;
      let bestMove = null;
      const possibleMoves = _game.moves({ verbose: true });
      for (let index = 0; index < possibleMoves.length; index += 1) {
        _game.move(possibleMoves[index]);
        const newMaxValue = this.evaluateBoard(_game.board());
        _game.undo();
        if (newMaxValue > maxValue) {
          maxValue = newMaxValue;
          bestMove = possibleMoves[index];
        }
      }
      return bestMove;
    };

    const calculateRandomMove = (_game) => {
      const possibleMoves = _game.moves({ verbose: true });
      if (possibleMoves.length === 0) {
        return null;
      } else {
        return possibleMoves[_.random(0, possibleMoves.length - 1)];
      }
    };

    switch (this.state.level) {
      case 1: {
        return calculateRandomMove(game);
      }
      case 2: {
        return null;
      }
      case 3: {
        return null;
      }
      default: {
        if (this.state.color === 'white') {
          return calculateBestMoveForWhite(game);
        } else {
          return calculateBestMoveForBlack(game);
        }
      }
    }
  };

  inputHandler = (event) => {
    if (event.type === INPUT_EVENT_TYPE.moveDone) {
      if (this.matchGame.in_checkmate()) {
        this.setState({
          isCheckmate: true,
        });
      } else {
        const move = { from: event.squareFrom, to: event.squareTo, promotion: 'q' };
        const result = this.matchGame.move(move);
        if (result) {
          event.chessboard.disableMoveInput();
          event.chessboard.setPosition(this.matchGame.fen());
          const nextMove = this.calculateBestMove(this.matchGame);
          if (nextMove !== null) {
            this.matchGame.move(nextMove);
            const orientation = this.state.color === 'white' ? COLOR.white : COLOR.black;
            event.chessboard.enableMoveInput(this.inputHandler, orientation);
            event.chessboard.setPosition(this.matchGame.fen());
          }
        }
        return result;
      }
    }
    return true;
  }

  render = () => {
    if (!this.state.isSelectedColor) {
      return <div className="app"><DialogColorSelection handleChoiceColor={this.handleChoiceColor} /></div>;
    } if (!this.state.isSelectedLevel) {
      return <div className="app"><DialogLevelSelection handleChoiceLevel={this.handleChoiceLevel} /></div>;
    } if (this.state.isCheckmate) {
      return <div className="app"><Mate /></div>;
    }
    return <div className="app"><Game /></div>;
  }
}

export default App;
