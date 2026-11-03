import { COURSE_DAYS, formNotes, type CourseDay, type CourseForm, type CourseQuestion } from './course';
import { getIntervalAt, getMidiAt } from './fretboard';
import type { PracticeAttempt } from '../types/practice';

export function questionForKey(key: string): CourseQuestion | undefined {
  const match = /^d([1-5]):(C|F|G|Am):(low|mid|high|top):(R|3|5)$/.exec(key);
  if (!match) return undefined;
  const course = COURSE_DAYS.find((day) => day.day === Number(match[1]));
  const form = course?.forms.find((item) => item.chord === match[2] && item.pos === match[3]);
  if (!form) return undefined;
  const notes = formNotes(form);
  const target = notes.find((note) => note.degree === match[4]);
  const root = notes.find((note) => note.degree === 'R')?.note;
  if (!target || !root) return undefined;
  return {
    chord: form.chord, root, degree: target.degree,
    interval: getIntervalAt(target.string, target.fret, root),
    strings: notes.map((note) => note.string),
    fretRange: [Math.min(...form.frets), Math.max(...form.frets)],
    pos: form.pos, courseKey: key,
  };
}

export function retryQuestions(wrong: CourseQuestion[], history: PracticeAttempt[]): CourseQuestion[] {
  const unique = new Map<string, CourseQuestion>();
  for (const key of [...wrong].reverse().map((q) => q.courseKey).concat(history.map((a) => a.courseKey ?? ''))) {
    const question = questionForKey(key);
    if (question && !unique.has(key)) unique.set(key, question);
    if (unique.size === 5) break;
  }
  return [...unique.values()];
}

export interface CourseSwitch {
  id: string;
  from: CourseForm;
  to: CourseForm;
}

export function switchesForDay(course: CourseDay): CourseSwitch[] {
  const switches = new Map<string, CourseSwitch>();
  for (const pos of new Set(course.forms.map((form) => form.pos))) {
    course.progression.forEach((chord, index) => {
      const next = course.progression[(index + 1) % course.progression.length];
      const from = course.forms.find((form) => form.chord === chord && form.pos === pos);
      const to = course.forms.find((form) => form.chord === next && form.pos === pos);
      if (!from || !to || chord === next) return;
      const id = `${chord}>${next}:${pos}`;
      switches.set(id, { id, from, to });
    });
  }
  return [...switches.values()];
}

export function formMidis(form: CourseForm): number[] {
  return formNotes(form).map((note) => getMidiAt(note.string, note.fret));
}
