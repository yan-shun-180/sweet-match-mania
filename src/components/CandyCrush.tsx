import { useState, useEffect, useCallback, useRef } from "react";
import { Timer, Trophy, RotateCcw, Play, Infinity } from "lucide-react";

const CANDY_IMAGES = [
  "https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/red-candy.png",
  "https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/blue-candy.png",
  "https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/green-candy.png",
  "https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/yellow-candy.png",
  "https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/orange-candy.png",
  "https://raw.githubusercontent.com/arpit456jain/Amazing-Js-Projects/master/Candy%20Crush/utils/purple-candy.png",
];

const GRID_SIZE = 8;

type GameMode = "endless" | "timed" | null;

interface CandyCell {
  color: number;
  id: string;
  isPopping?: boolean;
  isDropping?: boolean;
}

const CandyCrush = () => {
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [board, setBoard] = useState<CandyCell[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [selectedCandy, setSelectedCandy] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const createRandomCandy = useCallback((): CandyCell => ({
    color: Math.floor(Math.random() * CANDY_IMAGES.length),
    id: Math.random().toString(36).substr(2, 9),
  }), []);

  const createBoard = useCallback(() => {
    const newBoard: CandyCell[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      newBoard.push(createRandomCandy());
    }
    return newBoard;
  }, [createRandomCandy]);

  const checkForMatches = useCallback((currentBoard: CandyCell[]): { matches: Set<number>; points: number } => {
    const matches = new Set<number>();
    let points = 0;

    // Check rows for matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col <= GRID_SIZE - 3; col++) {
        const idx = row * GRID_SIZE + col;
        const color = currentBoard[idx].color;
        if (color === -1) continue;

        let matchLength = 1;
        while (col + matchLength < GRID_SIZE && currentBoard[idx + matchLength].color === color) {
          matchLength++;
        }

        if (matchLength >= 3) {
          for (let i = 0; i < matchLength; i++) {
            matches.add(idx + i);
          }
          points += matchLength;
          col += matchLength - 1;
        }
      }
    }

    // Check columns for matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row <= GRID_SIZE - 3; row++) {
        const idx = row * GRID_SIZE + col;
        const color = currentBoard[idx].color;
        if (color === -1) continue;

        let matchLength = 1;
        while (row + matchLength < GRID_SIZE && currentBoard[(row + matchLength) * GRID_SIZE + col].color === color) {
          matchLength++;
        }

        if (matchLength >= 3) {
          for (let i = 0; i < matchLength; i++) {
            matches.add((row + i) * GRID_SIZE + col);
          }
          points += matchLength;
          row += matchLength - 1;
        }
      }
    }

    return { matches, points };
  }, []);

  const dropCandies = useCallback((currentBoard: CandyCell[]): CandyCell[] => {
    const newBoard = [...currentBoard];

    // For each column, move candies down
    for (let col = 0; col < GRID_SIZE; col++) {
      let emptyRow = GRID_SIZE - 1;

      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const idx = row * GRID_SIZE + col;
        if (newBoard[idx].color !== -1) {
          const targetIdx = emptyRow * GRID_SIZE + col;
          if (targetIdx !== idx) {
            newBoard[targetIdx] = { ...newBoard[idx], isDropping: true };
            newBoard[idx] = { color: -1, id: Math.random().toString(36).substr(2, 9) };
          }
          emptyRow--;
        }
      }

      // Fill empty spaces at top with new candies
      for (let row = emptyRow; row >= 0; row--) {
        const idx = row * GRID_SIZE + col;
        newBoard[idx] = {
          color: Math.floor(Math.random() * CANDY_IMAGES.length),
          id: Math.random().toString(36).substr(2, 9),
          isDropping: true,
        };
      }
    }

    return newBoard;
  }, []);

  const processBoard = useCallback(() => {
    setBoard(currentBoard => {
      const { matches, points } = checkForMatches(currentBoard);

      if (matches.size > 0) {
        setScore(s => s + points);

        // Mark matches for removal
        const newBoard = currentBoard.map((candy, idx) => {
          if (matches.has(idx)) {
            return { ...candy, color: -1, isPopping: true };
          }
          return { ...candy, isPopping: false, isDropping: false };
        });

        // After a short delay, drop candies
        setTimeout(() => {
          setBoard(b => dropCandies(b));
        }, 150);

        return newBoard;
      }

      return currentBoard.map(c => ({ ...c, isPopping: false, isDropping: false }));
    });
  }, [checkForMatches, dropCandies]);

  const isValidMove = (idx1: number, idx2: number): boolean => {
    const row1 = Math.floor(idx1 / GRID_SIZE);
    const col1 = idx1 % GRID_SIZE;
    const row2 = Math.floor(idx2 / GRID_SIZE);
    const col2 = idx2 % GRID_SIZE;

    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);

    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  const swapCandies = (idx1: number, idx2: number) => {
    setBoard(currentBoard => {
      const newBoard = [...currentBoard];
      const temp = newBoard[idx1];
      newBoard[idx1] = newBoard[idx2];
      newBoard[idx2] = temp;

      // Check if swap creates a match
      const { matches } = checkForMatches(newBoard);
      if (matches.size === 0) {
        // No match, revert swap
        setTimeout(() => {
          setBoard(b => {
            const revertBoard = [...b];
            const t = revertBoard[idx1];
            revertBoard[idx1] = revertBoard[idx2];
            revertBoard[idx2] = t;
            return revertBoard;
          });
        }, 200);
      }

      return newBoard;
    });
    setSelectedCandy(null);
  };

  const handleCandyClick = (idx: number) => {
    if (gameOver || board[idx].color === -1) return;

    if (selectedCandy === null) {
      setSelectedCandy(idx);
    } else if (selectedCandy === idx) {
      setSelectedCandy(null);
    } else if (isValidMove(selectedCandy, idx)) {
      swapCandies(selectedCandy, idx);
    } else {
      setSelectedCandy(idx);
    }
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setBoard(createBoard());
    setScore(0);
    setTimeLeft(120);
    setGameOver(false);
    setSelectedCandy(null);
  };

  const changeMode = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setGameMode(null);
    setGameOver(false);
  };

  // Game loop
  useEffect(() => {
    if (gameMode && !gameOver) {
      gameLoopRef.current = setInterval(processBoard, 100);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameMode, gameOver, processBoard]);

  // Timer for timed mode
  useEffect(() => {
    if (gameMode === "timed" && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setGameOver(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameMode, gameOver]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Mode selection screen
  if (!gameMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="animate-bounce-in">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2 text-center drop-shadow-lg">
            🍬 Candy Crush
          </h1>
          <p className="text-muted-foreground text-center mb-8">Match 3 or more candies to score!</p>
        </div>

        <div className="flex flex-col gap-4 animate-slide-up">
          <button
            onClick={() => startGame("endless")}
            className="game-button flex items-center gap-3 justify-center min-w-[200px]"
          >
            <Infinity className="w-6 h-6" />
            Endless Mode
          </button>
          <button
            onClick={() => startGame("timed")}
            className="game-button flex items-center gap-3 justify-center min-w-[200px]"
          >
            <Timer className="w-6 h-6" />
            Timed Mode
          </button>
        </div>
      </div>
    );
  }

  // Game over screen
  if (gameOver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="animate-bounce-in text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">⏰ Time's Up!</h1>
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl">
            <p className="text-muted-foreground mb-2">Final Score</p>
            <p className="text-5xl font-bold text-accent">{score}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => startGame("timed")}
              className="game-button flex items-center gap-2 justify-center"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
            <button
              onClick={changeMode}
              className="game-button-danger"
            >
              Change Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate cell size based on viewport
  const cellSize = Math.min((window.innerWidth - 32) / GRID_SIZE, 60);
  const gridSize = cellSize * GRID_SIZE;

  return (
    <div className="min-h-screen flex flex-col items-center py-4 px-2">
      {/* Scoreboard */}
      <div className="bg-scoreboard/90 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-primary-foreground/70 text-xs uppercase tracking-wide">Score</p>
            <p className="text-3xl font-bold text-primary-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              {score}
            </p>
          </div>
          
          {gameMode === "timed" && (
            <div className="text-center">
              <p className="text-primary-foreground/70 text-xs uppercase tracking-wide">Time</p>
              <p className="text-2xl font-bold text-primary-foreground flex items-center gap-2">
                <Timer className="w-5 h-5" />
                {formatTime(timeLeft)}
              </p>
            </div>
          )}
          
          <button
            onClick={changeMode}
            className="game-button-danger text-sm"
          >
            Change Mode
          </button>
        </div>
      </div>

      {/* Game Grid */}
      <div
        className="bg-card/50 backdrop-blur-sm rounded-xl p-2 shadow-2xl"
        style={{ width: gridSize + 16, height: gridSize + 16 }}
      >
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: gridSize,
            height: gridSize,
          }}
        >
          {board.map((candy, idx) => (
            <div
              key={candy.id}
              onClick={() => handleCandyClick(idx)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleCandyClick(idx);
              }}
              className={`candy-cell ${selectedCandy === idx ? "selected" : ""} ${
                candy.isPopping ? "candy-pop" : ""
              } ${candy.isDropping ? "candy-drop" : ""}`}
              style={{
                width: cellSize - 2,
                height: cellSize - 2,
                backgroundImage: candy.color >= 0 ? `url(${CANDY_IMAGES[candy.color]})` : "none",
                backgroundColor: candy.color < 0 ? "transparent" : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Mode indicator */}
      <div className="mt-4 text-muted-foreground text-sm flex items-center gap-2">
        {gameMode === "endless" ? (
          <>
            <Infinity className="w-4 h-4" /> Endless Mode
          </>
        ) : (
          <>
            <Timer className="w-4 h-4" /> Timed Mode
          </>
        )}
      </div>
    </div>
  );
};

export default CandyCrush;
