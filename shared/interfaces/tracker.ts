import { Phase } from "../enums/phase";
import { IRound } from "./rounds";

export interface ITracker {
  phase: Phase;
  round: IRound;
  stageData?: string | string[];
  step: number;
  timeLeft: number;
}
