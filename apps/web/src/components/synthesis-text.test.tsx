import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SynthesisText } from './synthesis-text';

const TEXT = 'Resumo.\n\nTemas:\n- Preço: caro [#atla-0001]\n- Suporte: lento [#atla-9999]';

describe('SynthesisText', () => {
  it('turns verified [#id] markers into buttons that open the source', async () => {
    const onOpen = vi.fn();
    render(<SynthesisText text={TEXT} verifiedIds={new Set(['atla-0001'])} onOpenCitation={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir resposta-fonte atla-0001' }));
    expect(onOpen).toHaveBeenCalledWith('atla-0001');
  });

  it('does not make unverified ids clickable (no invented sources)', () => {
    render(
      <SynthesisText text={TEXT} verifiedIds={new Set(['atla-0001'])} onOpenCitation={() => undefined} />,
    );
    expect(screen.queryByRole('button', { name: /atla-9999/ })).not.toBeInTheDocument();
    expect(screen.getByText('[#atla-9999]')).toBeInTheDocument();
  });

  it('renders "- " lines as a list', () => {
    render(<SynthesisText text={TEXT} verifiedIds={new Set()} onOpenCitation={() => undefined} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
