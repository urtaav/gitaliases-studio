/** One piece of a generated command and what it means, in plain words. */
export interface CommandPart {
  text: string;
  explanation: string;
  /** Option id or field uid that produced this part; used to highlight both sides. */
  source: string;
}
