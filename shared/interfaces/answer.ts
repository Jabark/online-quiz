export interface IAnswer {
  id: number;
  answer?: IAnswerList & { correct: string[] };
}

export interface IAnswerList {
  [key: string]: string;
}
