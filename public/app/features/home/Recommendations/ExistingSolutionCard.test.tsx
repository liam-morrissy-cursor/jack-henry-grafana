import { render, screen } from 'test/test-utils';

import { createTheme } from '@grafana/data';

import { ExistingSolutionCard } from './ExistingSolutionCard';
import { type ExistingItem } from './types';

const theme = createTheme();

const baseItem: ExistingItem = {
  id: 'metrics',
  title: 'Metrics',
  icon: 'graph-bar',
  stats: { primary: '42', secondary: 'active series' },
  action: 'Open metrics',
  href: '/explore',
};

describe('ExistingSolutionCard', () => {
  it('renders the primary stat in purple', () => {
    render(<ExistingSolutionCard existing={[baseItem]} selected={baseItem} onSelect={jest.fn()} />);

    const stat = screen.getByTestId('home-stat-primary');
    expect(stat).toHaveTextContent('42');
    expect(stat).toHaveStyle({ color: theme.visualization.getColorByName('purple') });
  });
});
