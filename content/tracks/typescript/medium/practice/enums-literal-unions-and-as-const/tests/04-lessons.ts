// lessonsRequired covers every grade, and a grade typed into the tablet must pass isRun first.
import { isRun, lessonsRequired, RUNS } from "./solution.js";

check.equal(RUNS.map(lessonsRequired), [0, 0, 3, 6, 10], "the lessons required for each grade");

function maySkiAlone(lessons: number, runText: string): boolean {
  if (!isRun(runText)) {
    return false;
  }
  return lessons >= lessonsRequired(runText);
}

check.equal(maySkiAlone(0, "blue"), true, "a first-timer and a blue run");
check.equal(maySkiAlone(2, "red"), false, "two lessons and a red run");
check.equal(maySkiAlone(6, "black"), true, "six lessons and a black run");
check.equal(maySkiAlone(9, "off-piste"), false, "nine lessons and off-piste");
check.equal(maySkiAlone(40, "yellow"), false, "an unknown grade");

function typeChecksOnly(runText: string): void {
  // @ts-expect-error a plain string must be checked with isRun before it is used as a Run
  lessonsRequired(runText);
}
check.true(typeof typeChecksOnly === "function", "lessonsRequired accepts only checked grades");
