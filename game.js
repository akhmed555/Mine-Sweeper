/*
 * Minesweeper in JavaScript
 * Author: [Akhmed]
 * Version: 1.0 beta
 * Email: akhmedeplutus@gmail.com
 * Phone: +7(999) 311-20-61 Telegram, WhatsApp
 * Github: https://github.com/akhmed555
 * Description:
 * A simple implementation of the game "Minesweeper" in JavaScript using HTML and CSS.
 * Controls: left click to open cells, right click to flag/unflag cells.
 * The goal is to reveal all cells that do not contain mines without triggering any mines.
 */


(function () {
   class Minesweeper {
      constructor(selector, rows = 10, cols = 10, mines = 10) {
         this.selector = selector;
         this.rows = rows;
         this.cols = cols;
         this.mines = mines;
         this.field = [];
         this.gameBoard = null;
         this.isFirstMove = true;
         this.isGameOver = false;
         this.remainingFlags = mines;
         this.timer = 0;
         this.timerInterval = null;
      }

      createMine(numberOfMines, max) {
         const bombArr = new Set();
         while (bombArr.size < numberOfMines) {
            const rand = this.random(0, max - 1);
            bombArr.add(rand);
         }
         return Array.from(bombArr);
      }

      random(min, max) {
         return Math.floor(Math.random() * (max - min + 1) + min);
      }

      createField() {
         const field = [];
         for (let i = 0; i < this.rows * this.cols; i++) {
            field.push({
               isOpen: false,
               hasMine: false,
               isFlagged: false,
               surroundingMines: 0
            });
         }
         return field;
      }

      placeMines(mineIndices) {
         mineIndices.forEach(index => {
            if (index >= 0 && index < this.field.length) {
               this.field[index].hasMine = true;
            }
         });
      }

      updateSurroundingMinesAround(index, delta) {
         const directions = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1]
         ];

         const row = Math.floor(index / this.cols);
         const col = index % this.cols;

         for (const [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;

            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
               const neighborIndex = nr * this.cols + nc;
               this.field[neighborIndex].surroundingMines += delta;
            }
         }
      }

      updateDigits(container, number) {
         if (!container) return;
		 
		 if(number>999)number=999;

         const classesToRemove = ['digit-0', 'digit-1', 'digit-2', 'digit-3', 'digit-4', 'digit-5', 'digit-6', 'digit-7', 'digit-8', 'digit-9'];
         const digits = String(number).padStart(3, "0").split("");

         digits.forEach((digit, index) => {
            container.children[index].classList.remove(...classesToRemove);
            container.children[index].classList.add(`digit-${digit}`);
         });
      }

      checkFirstClick(index) {
         if (this.isFirstMove && this.field[index].hasMine) {
            let newMineIndex;

            do {
               newMineIndex = this.random(0, this.field.length - 1);
            } while (
               newMineIndex === index ||
               this.field[newMineIndex].hasMine
            );

            this.field[index].hasMine = false;
            this.field[newMineIndex].hasMine = true;

            this.updateSurroundingMinesAround(index, -1);
            this.updateSurroundingMinesAround(newMineIndex, 1);
         }

         this.isFirstMove = false;
      }

      startTimer() {

         const timerElement = document.querySelector(this.selector).querySelector('.panel-top .timer');

         if (!timerElement) {
            console.error('Timer element not found!');
            return;
         }


         if (this.timerInterval) {
           
            return;
         }

         

         this.timerInterval = setInterval(() => {
            this.timer++;
            


            this.updateDigits(timerElement, this.timer);
         }, 1000);
      }
      stopTimer() {
         clearInterval(this.timerInterval);
         this.timerInterval = null;
      }

      createGrid(mainGame) {

         const existingTopPanel = mainGame.querySelector('.panel-top');
         const existingGameBoard = mainGame.querySelector('.game-board');
         if (existingTopPanel) {
            existingTopPanel.remove();
         }
         if (existingGameBoard) {
            existingGameBoard.remove();
         }


         const topPanel = document.createElement("div");
         topPanel.innerHTML = `
        <span class="count-flags">
            <span class="digit digit-0"></span>
            <span class="digit digit-0"></span>
            <span class="digit digit-0"></span>
        </span>
        <span class="smile">🙂</span> <!-- Смайлик для новой игры -->
        <span class="timer">
            <span class="digit digit-0"></span>
            <span class="digit digit-0"></span>
            <span class="digit digit-0"></span>
        </span>
    `;
         topPanel.className = "panel-top";


         const smile = topPanel.querySelector(".smile");
         smile.addEventListener("click", () => {
            this.initGame();
            smile.textContent = '🙂';
         });


         mainGame.appendChild(topPanel);


         const gameBoard = document.createElement("div");
         gameBoard.className = "game-board";
         gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 16px)`;
         mainGame.appendChild(gameBoard);

         this.updateDigits(topPanel.querySelector(".count-flags"), this.remainingFlags);

         for (let i = 0; i < this.rows * this.cols; i++) {
            const div = document.createElement("div");
            div.className = "sprite cell cell-closed";
            gameBoard.appendChild(div);

            div.addEventListener("click", () => {
               if (this.isGameOver) return;

               const index = Array.from(gameBoard.children).indexOf(div);
               

               if (this.field[index].isFlagged) return;

               this.checkFirstClick(index);
               this.startTimer();

               if (this.field[index].hasMine) {
                  this.revealAllCells(gameBoard);
                  alert("Game Over!");
                  this.isGameOver = true;
                  this.stopTimer();
                  smile.textContent = '💥';
               } else {
                  this.openCell(index, gameBoard);
               }
            });

            div.addEventListener("contextmenu", (e) => {
               e.preventDefault();
               if (this.isGameOver) return;

               const index = Array.from(gameBoard.children).indexOf(div);
               this.toggleFlag(index, div, topPanel.querySelector(".count-flags"));
            });
         }

         this.gameBoard = gameBoard;
      }


      openCell(index, gameBoard) {
         const queue = [index];

         while (queue.length > 0) {
            const current = queue.shift();
            const cell = this.field[current];
            if (cell.isOpen || cell.hasMine || cell.isFlagged) continue;

            cell.isOpen = true;
            const div = gameBoard.children[current];
            div.classList.remove("cell-closed");
            div.classList.add("cell-open");

            if (cell.surroundingMines > 0) {
               div.classList.add(`cell-number-${cell.surroundingMines}`);
            } else {
               const row = Math.floor(current / this.cols);
               const col = current % this.cols;

               for (const [dr, dc] of [
                     [-1, -1],
                     [-1, 0],
                     [-1, 1],
                     [0, -1],
                     [0, 1],
                     [1, -1],
                     [1, 0],
                     [1, 1]
                  ]) {
                  const nr = row + dr;
                  const nc = col + dc;
                  if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                     const neighborIndex = nr * this.cols + nc;
                     if (!this.field[neighborIndex].isOpen) {
                        queue.push(neighborIndex);
                     }
                  }
               }
            }
         }

         this.checkWinCondition();
      }

      toggleFlag(index, div, flagCounterContainer) {
         const cell = this.field[index];
         if (cell.isOpen) return;

         if (!cell.isFlagged && !cell.isQuestioned) {
            cell.isFlagged = true;
            this.remainingFlags--;
            div.classList.remove("cell-closed");
            div.classList.add("cell-flag");
         } else if (cell.isFlagged) {
            cell.isFlagged = false;
            cell.isQuestioned = true;
            this.remainingFlags++;
            div.classList.remove("cell-flag");
            div.classList.add("cell-question");
         } else if (cell.isQuestioned) {
            cell.isQuestioned = false;
            div.classList.remove("cell-question");
            div.classList.add("cell-closed");
         }

         this.updateDigits(flagCounterContainer, this.remainingFlags);
         this.checkWinCondition();
      }

      revealAllCells(gameBoard) {
         this.field.forEach((cell, index) => {
            const div = gameBoard.children[index];
            div.classList.remove("cell-flag", "cell-question");

            if (cell.hasMine) {

               if (cell.isFlagged) {
                  div.classList.add("mine-x");
               } else {
                  div.classList.add("cell-mine");
               }
            } else {

               if (cell.isFlagged) {
                  div.classList.add("cell-open");
                  if (cell.surroundingMines > 0) {
                     div.classList.add(`cell-number-${cell.surroundingMines}`);
                  }
               } else {

                  div.classList.add("cell-open");
                  if (cell.surroundingMines > 0) {
                     div.classList.add(`cell-number-${cell.surroundingMines}`);
                  }
               }
            }
         });
      }


      checkWinCondition() {
         const allSafeCellsOpened = this.field.every(cell => cell.hasMine || cell.isOpen);
         if (allSafeCellsOpened) {
            alert("You win!");
            this.isGameOver = true;
            this.stopTimer();
         }
      }

      initGame() {
         
         this.remainingFlags = this.mines;
         this.isFirstMove = true;
         this.isGameOver = false;
         this.timer = 0;
         this.stopTimer();

         this.field = this.createField();
         const mineIndices = this.createMine(this.mines, this.rows * this.cols);
         this.placeMines(mineIndices);
         mineIndices.forEach(index => {
            this.updateSurroundingMinesAround(index, 1);
         });

         const mainGame = document.querySelector(this.selector);
         if (!mainGame) return;

         this.createGrid(mainGame);
      }
   }

   function gameRun(params) {
      const {
         selector = ".Sweeper", row = 10, col = 10, mines = 20
      } = params;

      const game = new Minesweeper(selector, row, col, mines);
      game.initGame();
   }

   window.Minesweeper = gameRun;


})();