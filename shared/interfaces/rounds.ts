import { RoundType } from "../enums/roundType";

export interface IRound {
  ID: number;
  Name?: string;
  Description?: string;
  RoundType?: RoundType;
  Questions?: string[];
  Answers?: string[];
}
