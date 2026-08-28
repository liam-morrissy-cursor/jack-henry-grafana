import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';

import { type SQLQuery, type ValidationResults } from '../../types';
import { buildMockDB } from '../SqlComponents.testHelpers';

import { QueryValidator } from './QueryValidator';

describe('QueryValidator', () => {
  const query: SQLQuery = {
    refId: 'A',
    rawSql: 'SELECT 1',
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('surfaces validation errors from db.validateQuery', async () => {
    const onValidate = jest.fn();
    const db = buildMockDB();
    const errorResult: ValidationResults = {
      query,
      error: 'rpc error: code = InvalidArgument desc: syntax error near FROM',
      isError: true,
      isValid: false,
    };
    jest.mocked(db.validateQuery).mockResolvedValue(errorResult);

    render(<QueryValidator db={db} query={query} onValidate={onValidate} />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(db.validateQuery).toHaveBeenCalledWith(query, undefined);
    });

    expect(await screen.findByText('syntax error near FROM')).toBeInTheDocument();
    expect(onValidate).toHaveBeenCalledWith(false);
  });

  it('surfaces success from db.validateQuery and calls onValidate(true)', async () => {
    const onValidate = jest.fn();
    const db = buildMockDB();
    const successResult: ValidationResults = {
      query,
      error: '',
      isError: false,
      isValid: true,
      statistics: { TotalBytesProcessed: 1024 },
    };
    jest.mocked(db.validateQuery).mockResolvedValue(successResult);

    render(<QueryValidator db={db} query={query} onValidate={onValidate} />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(db.validateQuery).toHaveBeenCalledWith(query, undefined);
    });

    expect(await screen.findByText(/This query will process/i)).toBeInTheDocument();
    expect(onValidate).toHaveBeenCalledWith(true);
  });

  it('skips validation when rawSql is empty', async () => {
    const onValidate = jest.fn();
    const db = buildMockDB();

    render(<QueryValidator db={db} query={{ refId: 'A', rawSql: '   ' }} onValidate={onValidate} />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      // validateQuery is invoked by useAsyncFn wrapper, but empty SQL returns null without calling db
      expect(db.validateQuery).not.toHaveBeenCalled();
    });

    expect(onValidate).not.toHaveBeenCalled();
    expect(screen.queryByText(/Validating query/i)).not.toBeInTheDocument();
  });
});
