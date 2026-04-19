import { MAX_WORDS } from "../../../shared/game";

interface WordCounterProps {
  text: string;
  maxWords?: number;
}

export function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function WordCounter({ text, maxWords = MAX_WORDS }: WordCounterProps) {
  const count = countWords(text);
  const remaining = maxWords - count;

  let cls = "ok";
  if (remaining <= 20 && remaining > 0) cls = "warning";
  if (remaining <= 0) cls = "over";

  return (
    <div className={`word-counter ${cls}`} title={`${count}/${maxWords} words`}>
      {remaining <= 0 ? `+${Math.abs(remaining)}` : remaining}
    </div>
  );
}
