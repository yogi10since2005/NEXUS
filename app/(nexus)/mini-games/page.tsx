
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Game = {
  id: string;
  title: string;
  category: string;
  description: string;
  symbol: string;
  accent: string;
  glow: string;
  status: "READY TO PLAY" | "COMING SOON";
  featured?: boolean;
};

const games: Game[] = [
  {
    id: "snake",
    title: "Neon Snake",
    category: "Arcade",
    description: "Grow longer. Think faster. Don't crash.",
    symbol: "ϟ",
    accent: "#8b5cf6",
    glow: "#6d28d9",
    status: "READY TO PLAY",
    featured: true,
  },
  {
    id: "2048",
    title: "2048",
    category: "Puzzle",
    description: "Merge tiles and reach the ultimate number.",
    symbol: "2048",
    accent: "#f59e0b",
    glow: "#b45309",
    status: "READY TO PLAY",
  },
  {
    id: "tictactoe",
    title: "Tic-Tac-Toe",
    category: "Strategy",
    description: "Outsmart the computer in a classic duel.",
    symbol: "XO",
    accent: "#22d3ee",
    glow: "#0891b2",
    status: "READY TO PLAY",
  },
  {
    id: "memory",
    title: "Memory Match",
    category: "Puzzle",
    description: "Flip, remember, and match every pair.",
    symbol: "◈",
    accent: "#f472b6",
    glow: "#be185d",
    status: "READY TO PLAY",
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    category: "Casual",
    description: "Read the moment. Beat your opponent.",
    symbol: "✊",
    accent: "#34d399",
    glow: "#047857",
    status: "READY TO PLAY",
  },
  {
    id: "word",
    title: "Word Guess",
    category: "Brain",
    description: "Crack the hidden word in six attempts.",
    symbol: "Aa",
    accent: "#a78bfa",
    glow: "#6d28d9",
    status: "READY TO PLAY",
  },
  {
    id: "sequence",
    title: "Number Sequence",
    category: "Brain",
    description: "Find the pattern. Solve the next number.",
    symbol: "123",
    accent: "#fb7185",
    glow: "#be123c",
    status: "READY TO PLAY",
  },
  {
    id: "reaction",
    title: "Reaction Test",
    category: "Arcade",
    description: "How fast can your reflexes really be?",
    symbol: "⚡",
    accent: "#facc15",
    glow: "#a16207",
    status: "READY TO PLAY",
  },
];

const categories = ["All Games", "Arcade", "Puzzle", "Strategy", "Casual", "Brain"];

const GAME_BESTS_KEY = "nexus-game-high-scores-v1";
type GameBest = {
  value: number;
  metric: string;
  lowerIsBetter: boolean;
  updatedAt: string;
};

type GameBests = Record<string, GameBest>;

function readGameBests(): GameBests {
  try {
    const raw = localStorage.getItem(GAME_BESTS_KEY);
    return raw ? (JSON.parse(raw) as GameBests) : {};
  } catch {
    return {};
  }
}

const ACHIEVEMENT_QUEUE_KEY = "nexus-achievement-event-queue-v1";

function recordGamingEvent(type: string, detail: Record<string, unknown> = {}) {
  const event = {
    eventId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    ...detail,
  };

  // Keep events even when the Achievements page is not mounted.
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_QUEUE_KEY);
    const queue = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
    queue.push(event);
    localStorage.setItem(ACHIEVEMENT_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // The live event below can still be handled if storage is unavailable.
  }

  window.dispatchEvent(
    new CustomEvent("nexus:achievement-event", { detail: event }),
  );
}

function saveGameBest(
  gameId: string,
  value: number,
  metric: string,
  lowerIsBetter = false,
) {
  if (typeof window === "undefined" || !Number.isFinite(value) || value <= 0) return;

  const bests = readGameBests();
  const previous = bests[gameId];
  const isBetter = !previous ||
    (lowerIsBetter ? value < previous.value : value > previous.value);

  if (!isBetter) return;

  bests[gameId] = {
    value,
    metric,
    lowerIsBetter,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(GAME_BESTS_KEY, JSON.stringify(bests));
  recordGamingEvent("high_score", { gameId, value, metric });
  window.dispatchEvent(new CustomEvent("nexus:game-score-updated"));
}

function Icon({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={className}>{children}</span>;
}

function TicTacToe() {
  const [board, setBoard] = useState<string[]>(Array(9).fill(""));
  const [message, setMessage] = useState("Your move — you are X");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (winnerOf(board) === "X") {
      saveGameBest("tictactoe", 1, "win");
      recordGamingEvent("game_won", { gameId: "tictactoe" });
    }
  }, [board]);

  const winnerOf = (squares: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return "";
  };

  const reset = () => {
    setBoard(Array(9).fill(""));
    setMessage("Your move — you are X");
    setBusy(false);
  };

  const play = (index: number) => {
    if (board[index] || busy || winnerOf(board) || !board.includes("")) return;

    const next = [...board];
    next[index] = "X";
    setBoard(next);

    if (winnerOf(next) === "X") {
      setMessage("You win! Nicely played.");
      return;
    }
    if (!next.includes("")) {
      setMessage("It's a draw. Try again!");
      return;
    }

    setBusy(true);
    setMessage("Opponent is thinking…");

    window.setTimeout(() => {
      const after = [...next];
      const empty = after.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);

      // Take a winning move if one is available.
      let move = -1;
      for (const i of empty) {
        const test = [...after];
        test[i] = "O";
        if (winnerOf(test) === "O") {
          move = i;
          break;
        }
      }

      // Otherwise block the player's immediate winning move.
      if (move < 0) {
        for (const i of empty) {
          const test = [...after];
          test[i] = "X";
          if (winnerOf(test) === "X") {
            move = i;
            break;
          }
        }
      }

      if (move < 0) {
        const preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7];
        move = preferred.find((i) => after[i] === "") ?? empty[0];
      }

      after[move] = "O";
      setBoard(after);
      setBusy(false);

      if (winnerOf(after) === "O") setMessage("The computer wins. Rematch?");
      else if (!after.includes("")) setMessage("It's a draw. Try again!");
      else setMessage("Your move — you are X");
    }, 450);
  };

  return (
    <GameShell title="Tic-Tac-Toe" subtitle="Challenge the NEXUS opponent">
      <div className="mx-auto max-w-sm">
        <p className="mb-5 text-center text-sm text-white/60">{message}</p>
        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => play(i)}
              disabled={Boolean(cell) || busy || Boolean(winnerOf(board))}
              className="aspect-square rounded-2xl border border-white/[0.09] bg-white/[0.035] text-4xl font-bold transition hover:border-violet-400/60 hover:bg-violet-500/10 disabled:cursor-default"
              style={{ color: cell === "X" ? "#22d3ee" : "#c4b5fd" }}
            >
              {cell}
            </button>
          ))}
        </div>
        <GameButton onClick={reset} className="mt-5 w-full">New match</GameButton>
      </div>
    </GameShell>
  );
}

function MemoryMatch() {
  const symbols = ["🌙", "🚀", "💎", "🎮", "⚡", "🪐", "👾", "🔮"];
  const createDeck = () =>
    [...symbols, ...symbols].map((symbol, i) => ({
      symbol,
      id: `${symbol}-${i}`,
    })).sort(() => Math.random() - 0.5);

  const [deck, setDeck] = useState(createDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    if (matched.length === 16) {
      saveGameBest("memory", moves, "moves", true);
      recordGamingEvent("game_won", { gameId: "memory" });
    }
  }, [matched.length, moves]);

  const flip = (index: number) => {
    if (open.includes(index) || matched.includes(index) || open.length === 2) return;

    const next = [...open, index];
    setOpen(next);

    if (next.length === 2) {
      setMoves((n) => n + 1);
      if (deck[next[0]].symbol === deck[next[1]].symbol) {
        setMatched((old) => [...old, ...next]);
        setOpen([]);
      } else {
        window.setTimeout(() => setOpen([]), 650);
      }
    }
  };

  const reset = () => {
    setDeck(createDeck());
    setOpen([]);
    setMatched([]);
    setMoves(0);
  };

  return (
    <GameShell title="Memory Match" subtitle="Find all eight matching pairs">
      <div className="mb-4 flex items-center justify-between text-sm text-white/55">
        <span>Moves <b className="ml-1 text-white">{moves}</b></span>
        <span>Pairs <b className="ml-1 text-white">{matched.length / 2}/8</b></span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {deck.map((card, i) => {
          const revealed = open.includes(i) || matched.includes(i);
          return (
            <button
              key={card.id}
              onClick={() => flip(i)}
              className={`aspect-square rounded-xl border text-2xl transition-all duration-200 sm:text-3xl ${
                revealed
                  ? "border-violet-400/40 bg-violet-500/15"
                  : "border-white/[0.08] bg-white/[0.035] hover:border-violet-400/50 hover:bg-white/[0.07]"
              }`}
            >
              {revealed ? card.symbol : <span className="text-sm text-violet-300/70">✦</span>}
            </button>
          );
        })}
      </div>
      {matched.length === 16 && (
        <p className="mt-4 text-center text-sm text-emerald-300">
          All pairs matched! Great memory.
        </p>
      )}
      <GameButton onClick={reset} className="mt-5 w-full">Shuffle cards</GameButton>
    </GameShell>
  );
}

function RockPaperScissors() {
  const choices = [
    { name: "Rock", symbol: "✊" },
    { name: "Paper", symbol: "✋" },
    { name: "Scissors", symbol: "✌️" },
  ];
  const [player, setPlayer] = useState<number | null>(null);
  const [computer, setComputer] = useState<number | null>(null);
  const [score, setScore] = useState({ you: 0, cpu: 0 });

  useEffect(() => {
    if (score.you > 0) {
      saveGameBest("rps", score.you, "wins");
    }
  }, [score.you]);

  const play = (choice: number) => {
    const opponent = Math.floor(Math.random() * 3);
    setPlayer(choice);
    setComputer(opponent);

    if (choice !== opponent) {
      if ((choice - opponent + 3) % 3 === 1) {
        setScore((s) => ({ ...s, you: s.you + 1 }));
        recordGamingEvent("game_won", { gameId: "rps" });
      } else {
        setScore((s) => ({ ...s, cpu: s.cpu + 1 }));
      }
    }
  };

  const outcome =
    player === null || computer === null
      ? "Choose your move"
      : player === computer
        ? "It's a draw!"
        : (player - computer + 3) % 3 === 1
          ? "You win this round!"
          : "The computer wins!";

  return (
    <GameShell title="Rock Paper Scissors" subtitle="Best your opponent, one round at a time">
      <div className="mb-8 flex justify-center gap-12 text-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40">You</p>
          <p className="mt-1 text-3xl font-semibold text-cyan-300">{score.you}</p>
        </div>
        <div className="h-12 w-px bg-white/10" />
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40">CPU</p>
          <p className="mt-1 text-3xl font-semibold text-violet-300">{score.cpu}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {choices.map((choice, i) => (
          <button
            key={choice.name}
            onClick={() => play(i)}
            className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-4 transition hover:border-emerald-400/50 hover:bg-emerald-500/10"
          >
            <span className="block text-3xl">{choice.symbol}</span>
            <span className="mt-2 block text-xs text-white/60">{choice.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-center">
        <p className="text-sm text-white/75">{outcome}</p>
        {player !== null && computer !== null && (
          <p className="mt-2 text-xs text-white/40">
            You chose {choices[player].name} · CPU chose {choices[computer].name}
          </p>
        )}
      </div>
      <GameButton onClick={() => {
        setPlayer(null);
        setComputer(null);
        setScore({ you: 0, cpu: 0 });
      }} className="mt-4 w-full">Reset score</GameButton>
    </GameShell>
  );
}

const words = ["NEXUS", "PIXEL", "LASER", "QUEST", "GHOST", "ORBIT", "NINJA", "FLAME"];

function WordGuess() {
  const [target, setTarget] = useState(() => words[Math.floor(Math.random() * words.length)]);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [message, setMessage] = useState("Guess the five-letter word.");

  const finished = guesses.includes(target) || guesses.length >= 6;

  useEffect(() => {
    if (guesses.includes(target)) {
      saveGameBest("word", guesses.length, "tries", true);
      recordGamingEvent("game_won", { gameId: "word" });
    }
  }, [guesses, target]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = guess.trim().toUpperCase();
    if (value.length !== 5 || finished) {
      setMessage("Enter a five-letter word.");
      return;
    }
    const next = [...guesses, value];
    setGuesses(next);
    setGuess("");

    if (value === target) setMessage("You cracked the code!");
    else if (next.length === 6) setMessage(`Out of attempts. The word was ${target}.`);
    else setMessage(`${6 - next.length} attempts remaining.`);
  };

  const reset = () => {
    setTarget(words[Math.floor(Math.random() * words.length)]);
    setGuess("");
    setGuesses([]);
    setMessage("Guess the five-letter word.");
  };

  return (
    <GameShell title="Word Guess" subtitle="Crack the five-letter code">
      <div className="mx-auto max-w-sm">
        <div className="mb-5 space-y-2">
          {Array.from({ length: 6 }, (_, row) => (
            <div key={row} className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }, (_, col) => {
                const word = guesses[row];
                const letter = word?.[col] ?? (row === guesses.length && !finished ? guess.toUpperCase()[col] ?? "" : "");
                let color = "border-white/10 bg-white/[0.025]";
                if (word) {
                  if (letter === target[col]) color = "border-emerald-400/60 bg-emerald-500/20";
                  else if (target.includes(letter)) color = "border-amber-400/60 bg-amber-500/15";
                  else color = "border-white/10 bg-white/[0.06]";
                }
                return (
                  <div key={col} className={`flex aspect-square items-center justify-center rounded-lg border text-lg font-bold ${color}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <p className="mb-4 text-center text-sm text-white/55">{message}</p>
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value.slice(0, 5).replace(/[^a-z]/gi, ""))}
            maxLength={5}
            disabled={finished}
            placeholder="ENTER WORD"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-sm uppercase tracking-[0.2em] text-white outline-none focus:border-violet-400/60"
          />
          <button className="rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-40" disabled={finished}>
            Guess
          </button>
        </form>
        <GameButton onClick={reset} className="mt-3 w-full">New word</GameButton>
      </div>
    </GameShell>
  );
}

function Snake() {
  const SIZE = 16;
  const [snake, setSnake] = useState([{ x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }]);
  const [food, setFood] = useState({ x: 11, y: 8 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const directionRef = useRef(direction);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const snakeRef = useRef(snake);
  snakeRef.current = snake;

  const reset = useCallback(() => {
    const initial = [{ x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }];
    setSnake(initial);
    snakeRef.current = initial;
    setFood({ x: 11, y: 8 });
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    setScore(0);
    setOver(false);
    setRunning(false);
  }, []);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      const keys: Record<string, { x: number; y: number }> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };
      const next = keys[e.key];
      if (!next) return;
      e.preventDefault();
      const current = directionRef.current;
      if (next.x === -current.x && next.y === -current.y) return;
      directionRef.current = next;
      setDirection(next);
      setRunning(true);
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  useEffect(() => {
    if (over && score > 0) saveGameBest("snake", score, "pts");
  }, [over, score]);

  useEffect(() => {
    if (!running || over) return;
    const timer = window.setInterval(() => {
      const currentSnake = snakeRef.current;
      const dir = directionRef.current;
      const head = { x: currentSnake[0].x + dir.x, y: currentSnake[0].y + dir.y };
      const ate = head.x === food.x && head.y === food.y;
      const body = ate ? currentSnake : currentSnake.slice(0, -1);

      if (
        head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE ||
        body.some((part) => part.x === head.x && part.y === head.y)
      ) {
        setOver(true);
        setRunning(false);
        return;
      }

      const next = [head, ...currentSnake];
      if (!ate) next.pop();
      snakeRef.current = next;
      setSnake(next);

      if (ate) {
        setScore((s) => s + 10);
        let nextFood = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
        while (next.some((part) => part.x === nextFood.x && part.y === nextFood.y)) {
          nextFood = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
        }
        setFood(nextFood);
      }
    }, 140);
    return () => window.clearInterval(timer);
  }, [running, over, food]);

  return (
    <GameShell title="Neon Snake" subtitle="Use your arrow keys to move">
      <div className="mb-3 flex items-center justify-between text-sm text-white/55">
        <span>Score <b className="ml-1 text-cyan-300">{score}</b></span>
        <span>{over ? "Game over" : running ? "In motion" : "Ready"}</span>
      </div>
      <div className="mx-auto grid aspect-square w-full max-w-sm grid-cols-16 gap-[2px] rounded-2xl border border-white/10 bg-black/50 p-2"
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
        {Array.from({ length: SIZE * SIZE }, (_, i) => {
          const x = i % SIZE;
          const y = Math.floor(i / SIZE);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isSnake = snake.some((part) => part.x === x && part.y === y);
          const isFood = food.x === x && food.y === y;
          return (
            <div key={i} className={`aspect-square rounded-[3px] ${
              isHead ? "bg-cyan-300 shadow-[0_0_10px_#22d3ee]" :
              isSnake ? "bg-violet-500" :
              isFood ? "bg-pink-400 shadow-[0_0_8px_#f472b6]" :
              "bg-white/[0.035]"
            }`} />
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-white/40">
        {over ? "You crashed! Start a new run." : running ? "Keep moving and collect the pink orbs." : "Press an arrow key or start below."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <GameButton onClick={() => { if (over) reset(); setRunning(true); }} className="w-full">
          {over ? "Play again" : "Start game"}
        </GameButton>
        <GameButton onClick={reset} variant="secondary" className="w-full">Restart</GameButton>
      </div>
    </GameShell>
  );
}

function Game2048() {
  const newTile = (grid: number[]) => {
    const empty = grid.map((v, i) => v === 0 ? i : -1).filter((i) => i >= 0);
    if (!empty.length) return grid;
    const next = [...grid];
    next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
    return next;
  };

  const [grid, setGrid] = useState(() => newTile(newTile(Array(16).fill(0))));
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (score > 0) saveGameBest("2048", score, "pts");
  }, [score]);

  const move = useCallback((dir: string) => {
    let gained = 0;
    const next = [...grid];

    for (let line = 0; line < 4; line++) {
      const indices = Array.from({ length: 4 }, (_, i) => {
        if (dir === "left") return line * 4 + i;
        if (dir === "right") return line * 4 + (3 - i);
        if (dir === "up") return i * 4 + line;
        return (3 - i) * 4 + line;
      });

      const values = indices.map((i) => grid[i]).filter(Boolean);
      const merged: number[] = [];
      for (let i = 0; i < values.length; i++) {
        if (values[i] === values[i + 1]) {
          merged.push(values[i] * 2);
          gained += values[i] * 2;
          i++;
        } else {
          merged.push(values[i]);
        }
      }
      while (merged.length < 4) merged.push(0);
      indices.forEach((idx, i) => { next[idx] = merged[i]; });
    }

    if (next.every((v, i) => v === grid[i])) return;
    setGrid(newTile(next));
    setScore((s) => s + gained);
  }, [grid]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, string> = {
        ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
      };
      if (map[e.key]) {
        e.preventDefault();
        move(map[e.key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  const reset = () => {
    setGrid(newTile(newTile(Array(16).fill(0))));
    setScore(0);
  };

  const tileColor = (value: number) => {
    const colors: Record<number, string> = {
      0: "bg-white/[0.035] text-white/10",
      2: "bg-amber-100/90 text-amber-950",
      4: "bg-amber-200 text-amber-950",
      8: "bg-orange-400 text-white",
      16: "bg-orange-500 text-white",
      32: "bg-rose-500 text-white",
      64: "bg-pink-600 text-white",
      128: "bg-violet-500 text-white",
      256: "bg-violet-400 text-white",
      512: "bg-cyan-500 text-slate-950",
      1024: "bg-cyan-300 text-slate-950",
      2048: "bg-emerald-300 text-slate-950",
    };
    return colors[value] ?? "bg-white text-black";
  };

  return (
    <GameShell title="2048" subtitle="Merge matching tiles to reach 2048">
      <div className="mb-3 flex items-center justify-between text-sm text-white/50">
        <span>Score <b className="ml-1 text-white">{score}</b></span>
        <span>Use your arrow keys</span>
      </div>
      <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/40 p-2">
        {grid.map((value, i) => (
          <div key={i} className={`flex aspect-square items-center justify-center rounded-xl text-lg font-bold transition-all sm:text-2xl ${tileColor(value)}`}>
            {value || ""}
          </div>
        ))}
      </div>
      {grid.includes(2048) && <p className="mt-3 text-center text-sm text-emerald-300">2048 reached! Incredible.</p>}
      <GameButton onClick={reset} className="mt-4 w-full">New game</GameButton>
    </GameShell>
  );
}

function NumberSequence() {
  const makeQuestion = () => {
    const start = Math.floor(Math.random() * 8) + 2;
    const step = Math.floor(Math.random() * 7) + 2;
    return { values: [start, start + step, start + step * 2, start + step * 3], answer: start + step * 4 };
  };
  const [question, setQuestion] = useState(makeQuestion);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("What number comes next?");
  const [checked, setChecked] = useState(false);

  const check = () => {
    if (!answer.trim()) return;
    setChecked(true);
    const correct = Number(answer) === question.answer;
    setMessage(correct ? "Correct! Pattern mastered." : `Not quite — the answer was ${question.answer}.`);
    if (correct) {
      saveGameBest("sequence", 1, "solved");
      recordGamingEvent("game_won", { gameId: "sequence" });
    }
  };

  const reset = () => {
    setQuestion(makeQuestion());
    setAnswer("");
    setMessage("What number comes next?");
    setChecked(false);
  };

  return (
    <GameShell title="Number Sequence" subtitle="Spot the pattern and solve the next number">
      <div className="my-8 grid grid-cols-4 gap-2 sm:gap-3">
        {question.values.map((n, i) => (
          <div key={i} className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xl font-bold sm:text-2xl">
            {n}
          </div>
        ))}
      </div>
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="text-xl text-white/40">Next</span>
        <span className="text-3xl text-violet-300">?</span>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); check(); }} className="flex gap-2">
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={checked}
          placeholder="Your answer"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-violet-400/60"
        />
        <button disabled={checked} className="rounded-xl bg-violet-500 px-5 text-sm font-semibold hover:bg-violet-400 disabled:opacity-40">
          Check
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-white/55">{message}</p>
      <GameButton onClick={reset} className="mt-3 w-full">Next puzzle</GameButton>
    </GameShell>
  );
}

function ReactionTest() {
  const [phase, setPhase] = useState<"idle" | "waiting" | "go" | "result" | "early">("idle");
  const [result, setResult] = useState<number | null>(null);
  const started = useRef(0);
  const timeout = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeout.current) window.clearTimeout(timeout.current);
  }, []);

  const start = () => {
    if (timeout.current) window.clearTimeout(timeout.current);
    setResult(null);
    setPhase("waiting");
    timeout.current = window.setTimeout(() => {
      started.current = performance.now();
      setPhase("go");
    }, 1500 + Math.random() * 2500);
  };

  const click = () => {
    if (phase === "idle" || phase === "result" || phase === "early") return;
    if (phase === "waiting") {
      if (timeout.current) window.clearTimeout(timeout.current);
      setPhase("early");
      return;
    }
    const elapsed = Math.round(performance.now() - started.current);
    setResult(elapsed);
    setPhase("result");
    saveGameBest("reaction", elapsed, "ms", true);
  };

  return (
    <GameShell title="Reaction Test" subtitle="Wait for green, then react as quickly as possible">
      <button
        onClick={phase === "idle" || phase === "result" || phase === "early" ? start : click}
        className={`my-4 flex min-h-64 w-full flex-col items-center justify-center rounded-3xl border transition-all duration-200 ${
          phase === "go"
            ? "border-emerald-300 bg-emerald-400 text-emerald-950 shadow-[0_0_45px_rgba(52,211,153,0.22)]"
            : phase === "waiting"
              ? "border-rose-400/30 bg-rose-500/15 text-white"
              : phase === "early"
                ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                : "border-violet-400/20 bg-violet-500/10 text-white hover:bg-violet-500/15"
        }`}
      >
        <span className="text-4xl">{phase === "go" ? "⚡" : phase === "waiting" ? "…" : "✦"}</span>
        <span className="mt-4 text-lg font-semibold">
          {phase === "idle" ? "Start test" :
           phase === "waiting" ? "Wait for green…" :
           phase === "go" ? "CLICK NOW!" :
           phase === "early" ? "Too early!" :
           `${result} ms`}
        </span>
        <span className="mt-2 text-xs opacity-60">
          {phase === "result" ? "Tap to try again" :
           phase === "early" ? "Wait until the screen turns green" :
           phase === "go" ? "Quick!" : "Your reflexes, measured."}
        </span>
      </button>
      {phase === "result" && result !== null && (
        <p className="text-center text-sm text-white/55">
          {result < 200 ? "Lightning fast. You're in the zone." : result < 300 ? "Great reaction time!" : "Keep practising your reflexes."}
        </p>
      )}
    </GameShell>
  );
}

function GameButton({
  children,
  onClick,
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
        variant === "primary"
          ? "bg-violet-500 text-white hover:bg-violet-400"
          : "border border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function GameShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-300">NEXUS ARCADE</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/45">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function GameArtwork({ game, large = false }: { game: Game; large?: boolean }) {
  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden ${
        large ? "min-h-56 rounded-2xl sm:min-h-72" : "h-36 rounded-t-2xl"
      }`}
      style={{
        background: `radial-gradient(ellipse at 50% 100%, ${game.glow}70 0%, transparent 60%), linear-gradient(135deg, #11111d 0%, ${game.glow}55 55%, #09090f 100%)`,
      }}
    >
      <div className="absolute -left-10 -top-16 h-36 w-36 rounded-full border border-white/10" />
      <div className="absolute -bottom-20 -right-8 h-48 w-48 rounded-full border border-white/[0.08]" />
      <div
        className="absolute h-28 w-28 rounded-full blur-3xl"
        style={{ backgroundColor: game.accent, opacity: 0.2 }}
      />
      <div
        className={`relative z-10 flex items-center justify-center font-black tracking-tight text-white ${
          large ? "h-36 w-36 text-6xl sm:h-44 sm:w-44 sm:text-7xl" : "h-20 w-20 text-4xl"
        }`}
        style={{
          borderRadius: game.id === "2048" ? "22%" : "50%",
          border: `1px solid ${game.accent}75`,
          background: `linear-gradient(145deg, ${game.accent}30, #09090fbb)`,
          boxShadow: `0 0 55px ${game.glow}45, inset 0 0 30px ${game.accent}15`,
          color: game.accent,
          transform: game.id === "snake" ? "rotate(-8deg)" : undefined,
        }}
      >
        {game.symbol}
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: game.accent }} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/60">
          {game.category}
        </span>
      </div>
      {game.featured && (
        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[9px] font-semibold tracking-wider text-white/80 backdrop-blur">
          EDITOR&apos;S PICK
        </div>
      )}
    </div>
  );
}

export default function GamingHubPage() {
  const [category, setCategory] = useState("All Games");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [highScores, setHighScores] = useState<GameBests>({});

  const launchGame = (gameId: string) => {
    recordGamingEvent("game_played", { gameId });
    setSelected(gameId);
  };

  useEffect(() => {
    setHighScores(readGameBests());
    const refreshScores = () => setHighScores(readGameBests());
    window.addEventListener("nexus:game-score-updated", refreshScores);
    window.addEventListener("storage", refreshScores);
    return () => {
      window.removeEventListener("nexus:game-score-updated", refreshScores);
      window.removeEventListener("storage", refreshScores);
    };
  }, []);

  const filtered = games.filter((game) => {
    const matchesCategory = category === "All Games" || game.category === category;
    const matchesSearch = `${game.title} ${game.description} ${game.category}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeGame = games.find((game) => game.id === selected);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <main className="min-h-screen bg-[#08080d] text-white">
      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-7 lg:px-10 lg:pt-8">
        {/* Top bar */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-xl text-violet-300">
              <Icon>✦</Icon>
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.16em]">NEXUS <span className="text-violet-300">ARCADE</span></p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/35">Personal gaming lounge</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300/90">Arcade online</span>
          </div>
        </header>

        {/* Hero */}
        <section className="relative mb-10 overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#10101a]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_45%,rgba(124,58,237,0.22),transparent_48%),radial-gradient(ellipse_at_5%_100%,rgba(34,211,238,0.08),transparent_45%)]" />
          <div className="relative grid items-center gap-5 p-5 sm:p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <div className="relative z-10 py-2">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1.5">
                <span className="text-xs text-violet-300">✦</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-200">Your next escape starts here</span>
              </div>
              <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Enter your
                <br />
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  play zone.
                </span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/50 sm:text-base">
                A little competition. A mental reset. A new high score.
                Your personal arcade is ready when you are.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => launchGame("snake")}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(139,92,246,0.2)] transition hover:-translate-y-0.5 hover:bg-violet-400"
                >
                  <span>▶</span> Play featured game
                </button>
                <button
                  onClick={() => document.getElementById("game-library")?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]"
                >
                  Explore library <span className="ml-1 text-white/40">↓</span>
                </button>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 border-t border-white/[0.08] pt-5">
                <div>
                  <p className="text-xl font-semibold">{games.length.toString().padStart(2, "0")}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35">Games in library</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">05</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35">Game categories</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-emerald-300">∞</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35">Ways to play</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <GameArtwork game={games[0]} large />
              <div className="mt-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-sm font-semibold">01 / NEON SNAKE</p>
                  <p className="mt-1 text-xs text-white/40">The arcade classic, reimagined.</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1.5 text-[9px] font-semibold tracking-wider text-emerald-300">
                  PLAY NOW
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Library */}
        <section id="game-library" className="scroll-mt-8">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-300">The collection</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Choose your game<span className="text-violet-300">.</span></h2>
              <p className="mt-2 text-sm text-white/40">Quick sessions. Big brain energy. Zero downloads.</p>
            </div>
            <label className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3.5 py-3 sm:max-w-xs">
              <span className="text-white/35">⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search games..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                aria-label="Search games"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-xs text-white/40 hover:text-white">
                  Clear
                </button>
              )}
            </label>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition ${
                  category === item
                    ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                    : "border-white/[0.08] bg-white/[0.02] text-white/45 hover:border-white/20 hover:text-white/80"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-white/40">{filtered.length} games available</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/25">Select a game to launch</p>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filtered.map((game, index) => (
                <button
                  key={game.id}
                  onClick={() => launchGame(game.id)}
                  className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101018] text-left transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <GameArtwork game={game} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold tracking-tight text-white/90 transition group-hover:text-white">{game.title}</h3>
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: game.accent }} />
                    </div>
                    <p className="mt-2 min-h-10 text-xs leading-5 text-white/40">{game.description}</p>
                    {highScores[game.id] && (
                      <p className="mt-2 text-[10px] font-semibold tracking-wide text-cyan-200/80">
                        PERSONAL BEST · {highScores[game.id].value} {highScores[game.id].metric.toUpperCase()}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
                        {game.status}
                      </span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white/50 transition group-hover:border-violet-400/40 group-hover:bg-violet-500/15 group-hover:text-violet-200">
                        ↗
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
              <p className="text-sm text-white/60">No games found.</p>
              <button
                onClick={() => { setSearch(""); setCategory("All Games"); }}
                className="mt-3 text-xs text-violet-300 hover:text-violet-200"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-white/[0.07] pt-5 text-[10px] uppercase tracking-[0.15em] text-white/25 sm:flex-row">
          <span>NEXUS CORE · PERSONAL COMMAND CENTER</span>
          <span>Take a break. Return stronger.</span>
        </footer>
      </div>

      {/* Gameplay overlay */}
      {activeGame && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="relative my-auto w-full max-w-xl rounded-3xl border border-white/10 bg-[#0e0e17] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.6)] sm:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-xs text-white/45 transition hover:text-white">
                <span>←</span> Back to library
              </button>
              <button onClick={() => setSelected(null)} aria-label="Close game" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white">
                ×
              </button>
            </div>
            {activeGame.id === "tictactoe" && <TicTacToe />}
            {activeGame.id === "memory" && <MemoryMatch />}
            {activeGame.id === "rps" && <RockPaperScissors />}
            {activeGame.id === "word" && <WordGuess />}
            {activeGame.id === "snake" && <Snake />}
            {activeGame.id === "2048" && <Game2048 />}
            {activeGame.id === "sequence" && <NumberSequence />}
            {activeGame.id === "reaction" && <ReactionTest />}
          </div>
        </div>
      )}
    </main>
  );
}