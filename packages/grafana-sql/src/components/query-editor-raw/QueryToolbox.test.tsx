import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type SQLQuery, type ValidationResults } from '../../types';
import { buildMockDB } from '../SqlComponents.testHelpers';

import { QueryToolbox } from './QueryToolbox';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  reportInteraction: jest.fn(),
}));

describe('QueryToolbox', () => {
  const query: SQLQuery = {
    refId: 'A',
    rawSql: 'SELECT 1',
    datasource: { type: 'grafana-postgresql-datasource', uid: 'pg' },
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('forwards format and expand callbacks when tools are shown', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onFormatCode = jest.fn();
    const onExpand = jest.fn();
    const onValidate = jest.fn();
    const db = buildMockDB();

    render(
      <QueryToolbox
        db={db}
        query={query}
        showTools
        onFormatCode={onFormatCode}
        onExpand={onExpand}
        isExpanded={false}
        onValidate={onValidate}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Format query' }));
    expect(onFormatCode).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Expand editor' }));
    expect(onExpand).toHaveBeenCalledWith(true);
  });

  it('forwards validator props and surfaces validation errors', async () => {
    const onValidate = jest.fn();
    const db = buildMockDB();
    const errorResult: ValidationResults = {
      query,
      error: 'rpc error: code = InvalidArgument desc: table not found',
      isError: true,
      isValid: false,
    };
    jest.mocked(db.validateQuery).mockResolvedValue(errorResult);

    render(<QueryToolbox db={db} query={query} showTools onValidate={onValidate} />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(db.validateQuery).toHaveBeenCalledWith(query, undefined);
    });

    expect(await screen.findByText('table not found')).toBeInTheDocument();
    expect(onValidate).toHaveBeenCalledWith(false);
  });

  it('shows collapse tooltip when expanded', () => {
    render(
      <QueryToolbox
        db={buildMockDB()}
        query={query}
        showTools
        onExpand={jest.fn()}
        isExpanded
        onValidate={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Collapse editor' })).toBeInTheDocument();
  });
});
