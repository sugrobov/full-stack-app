import { render, screen } from '@testing-library/react';
import PageTransition from '../PageTransition';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe('PageTransition', () => {
  it('renders children', () => {
    render(
      <PageTransition>
        <span>Transition content</span>
      </PageTransition>
    );
    expect(screen.getByText('Transition content')).toBeInTheDocument();
  });

  it('applies animation props to wrapper div', () => {
    const { container } = render(
      <PageTransition>
        <div />
      </PageTransition>
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveAttribute('initial', 'initial');
    expect(wrapper).toHaveAttribute('animate', 'in');
    expect(wrapper).toHaveAttribute('exit', 'out');
  });
});