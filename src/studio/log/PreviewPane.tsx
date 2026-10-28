import { copy } from '../../copy';
import { TermPreview } from '../../components/TermPreview';
import { renderPreview } from '../../core/preview';
import { SAMPLE_COMMITS } from '../../data/sampleCommits';
import type { LogRecipe } from '../../core/logFormat';

interface Props {
  recipe: LogRecipe;
  meName: string;
  terminalBg: string;
  terminalFg: string;
  aliasName: string;
  focusUid: string | null;
}

export function PreviewPane({ recipe, meName, terminalBg, terminalFg, aliasName, focusUid }: Props) {
  return (
    <TermPreview
      lines={renderPreview(recipe, SAMPLE_COMMITS, meName)}
      title={`$ git ${aliasName || 'alias'}`}
      note={copy.log.previewNote}
      bg={terminalBg}
      fg={terminalFg}
      focus={focusUid}
    />
  );
}
