import express from "express";
const app: express.Application = express();

app.use(express.static(__dirname + "/assets"));

import http from "http";
const server: http.Server = http.createServer(app);

import { Server as SocketIOServer, Socket } from "socket.io";
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:4200",
  },
});

import {
  IAnswer,
  IRound,
  IContestant,
  ITracker,
  Phase,
  RoundType,
} from "@shared";

const currentAnswers: IAnswer[] = [];
let isPaused = false;
let rounds: IRound[] = [];
let contestants: IContestant[] = [];
const tracker: ITracker = {
  phase: Phase.INTRO,
  round: { ID: 0 },
  step: 0,
  timeLeft: 10,
};

import fs from "fs";
import path from "path";
fs.readFile(
  path.resolve(__dirname, "./data/quiz.json"),
  "utf8",
  function (err, data) {
    if (err) {
      console.error(err);
    } else {
      rounds = JSON.parse(data);
    }
  }
);

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

const startQuiz = async () => {
  contestants = contestants.map((contestant) => {
    contestant.points = 0;
    return contestant;
  });
  updateContestants();
  updateTracker();
  quizRunner();
};

const quizRunner = async () => {
  const timer = setInterval(() => {
    if (!isPaused) {
      if (tracker.timeLeft > 0) {
        tracker.timeLeft -= 1;
      } else {
        const round = rounds.find((r) => r.ID === tracker.round.ID) || {
          ID: 0,
        };
        const isMultiple = round.RoundType === RoundType.MULTIPLE;
        const isGrid = round.RoundType === RoundType.GRID;
        const numQuestions = round.Questions?.length || 0;
        const questionTime = isMultiple ? 30 * numQuestions : isGrid ? 60 : 30;
        let maxSteps = 1;

        if (!isMultiple) {
          maxSteps = numQuestions;
        }

        switch (tracker.phase) {
          case Phase.INTRO:
            tracker.phase = Phase.QUESTION;
            tracker.step = 1;
            tracker.timeLeft = questionTime;
            break;
          case Phase.QUESTION:
            tracker.phase = Phase.ANSWER;
            tracker.timeLeft = isMultiple ? 5 * numQuestions : 10;
            if (round.Answers) {
              assignPoints(
                round.RoundType === RoundType.MULTIPLE
                  ? round.Answers
                  : [round.Answers[tracker.step - 1]]
              );
            }
            break;
          case Phase.ANSWER:
            if (tracker.step === maxSteps) {
              const { Questions, Answers, ...rnds } = rounds.find(
                (r) => r.ID === round.ID + 1
              ) || { ID: -1 };

              tracker.phase = Phase.INTRO;
              tracker.round = rnds;
              tracker.step = 0;
              tracker.timeLeft = 10;
            } else {
              tracker.phase = Phase.QUESTION;
              tracker.step += 1;
              tracker.timeLeft = questionTime;
            }
            break;
        }

        if (round.RoundType === RoundType.MULTIPLE) {
          tracker.stageData =
            tracker.phase === Phase.ANSWER
              ? round.Questions?.map((val, i) => {
                  return `${val} = ${round.Answers?.[i].split("|")[0]}`;
                })
              : round.Questions;
        } else {
          const prop =
            tracker.phase === Phase.ANSWER &&
            round.RoundType !== RoundType.PICTURE &&
            round.RoundType !== RoundType.GRID
              ? round.Answers?.map((val) => val.split("|")[0])
              : round.RoundType === RoundType.GRID ||
                round.RoundType === RoundType.PICTURE
              ? round.Questions?.map((q, i) => q + "|" + round.Answers?.[i])
              : round.Questions;
          tracker.stageData = prop?.[tracker.step - 1];
        }
      }

      updateTracker();

      if (tracker.round.ID === -1) {
        clearInterval(timer);
      }
    }
  }, 1000);
};

const checkRange = (input: number, answer: number, range: number) => {
  return (input - (answer - range)) * (input - (answer + range)) <= 0;
};

const assignPoints = async (answers: string[]) => {
  answers.forEach((answer, index) => {
    currentAnswers.forEach((curAnswer: IAnswer) => {
      const a = curAnswer?.answer;
      if (a?.[`Answer${index + 1}`]) {
        if (tracker.round.RoundType === RoundType.GRID) {
          const userAnswer = a[`Answer${index + 1}`];
          const userAnswerParts = userAnswer.split("");
          const qAnswerParts = answer.split("");
          let points = 0;
          if (userAnswer === answer) {
            points = 3;
          } else if (
            checkRange(+userAnswerParts[0], +qAnswerParts[0], 1) &&
            checkRange(+userAnswerParts[1], +qAnswerParts[1], 1)
          ) {
            points = 1;
          }
          a.correct = [answer];
          if (points > 0) {
            contestants[
              contestants.findIndex(
                (contestant: IContestant) => contestant.id === curAnswer.id
              )
            ].points += points;
          }
        } else {
          const userAnswer = `|${a[`Answer${index + 1}`]
            .toLowerCase()
            .trim()}|`;
          const qAnswer = `|${answer.toLowerCase()}|`;

          if (qAnswer.includes(userAnswer)) {
            if (a.correct) {
              a.correct.push(`Answer${index + 1}`);
            } else {
              a.correct = [`Answer${index + 1}`];
            }
            contestants[
              contestants.findIndex(
                (contestant: IContestant) => contestant.id === curAnswer.id
              )
            ].points += 1;
          }
        }
      }
    });
  });

  updateContestants();
};

const updateContestants = async () => {
  io.emit("send-contestants", contestants);
};

const updateTracker = async () => {
  io.emit("send-tracker", tracker);
};

io.on("connection", (socket: Socket) => {
  socket.on("complete-contestant", (contestant: IContestant) => {
    contestant.id = contestants.length + 1;
    socket.emit("send-contestant-id", contestant.id);
    contestants.push(contestant);
    currentAnswers.push({
      id: contestant.id,
    });
    updateContestants();
  });

  socket.on("update-answer", (answer: IAnswer) => {
    if (answer.id) {
      currentAnswers[
        currentAnswers.findIndex((a: IAnswer) => a.id === answer.id)
      ].answer = answer.answer;
    }
  });

  socket.on("request-contestants", () => {
    updateContestants();
  });

  socket.on("update-contestant-score", async (data) => {
    contestants[
      contestants.findIndex(
        (contestant: IContestant) => contestant.id === data.id
      )
    ].points = data.score;

    updateContestants();
  });

  socket.on("get-tracker", () => {
    socket.emit("send-tracker", tracker);
  });

  socket.on("pause-state-change", () => {
    isPaused = !isPaused;
    io.emit("send-pause-state", isPaused);
  });

  socket.on("get-pause-state", () => {
    socket.emit("send-pause-state", isPaused);
  });

  socket.on("start-quiz", () => {
    const { Questions, Answers, ...round } = rounds.find((r) => r.ID === 1) || {
      ID: 0,
    };
    tracker.round = round;
    startQuiz();
  });

  socket.on("retrieve-correctness", (id: number) => {
    socket.emit(
      "send-correctness",
      currentAnswers.find((a) => a.id === id)
    );
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
