import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type SQLQuery } from '../../types';
import { applyQueryDefaults } from '../../defaults';
import { buildMockDB } from '../SqlComponents.testHelpers';

import { RawEditor } from './RawEditor';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  reportInteraction: jest.fn(),
}));

jest.mock('react-virtualized-auto-sizer', () => ({
  __esModule: true,
  default: ({ children }: { children: (size: { width: number; height: number }) => unknown }) =>
    children({ width: 800, height: 300 }),
}));

const formatQuery = jest.fn();

jest.mock('@grafana/plugin-ui', () => ({
  ...jest.requireActual('@grafana/plugin-ui'),
  SQLEditor: jest.fn(({ query, onChange, children }) => (
    <div>
      <div data-testid="mock-sql-editor">{query}</div>
      <button type="button" onClick={() => onChange('SELECT 2', false)}>
        Change query
      </button>
      <button type="button" onClick={() => onChange('SELECT 2', true)}>
        Change and run
      </button>
      {children?.({ formatQuery })}
    </div>
  )),
}));

describe('RawEditor', () => {
  const query = applyQueryDefaults({
    refId: 'A',
    rawSql: 'SELECT 1',
    datasource: { type: 'grafana-postgresql-datasource', uid: 'pg' },
  } as SQLQuery);

  beforeEach(() => {
    formatQuery.mockClear();
  });

  it('wires onChange from the SQL editor (edit without run)', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onRunQuery = jest.fn();
    const onValidate = jest.fn();

    render(
      <RawEditor
        db={buildMockDB()}
        query={query}
        queryToValidate={query}
        onChange={onChange}
        onRunQuery={onRunQuery}
        onValidate={onValidate}
      />
    );

    expect(screen.getByTestId('mock-sql-editor')).toHaveTextContent('SELECT 1');

    await user.click(screen.getByRole('button', { name: 'Change query' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        refId: 'A',
        rawSql: 'SELECT 2',
        rawQuery: true,
      }),
      false
    );
    // onRunQuery is accepted by RawEditor but run is signaled via onChange(..., true)
    expect(onRunQuery).not.toHaveBeenCalled();
  });

  it('wires onChange with processQuery=true for the run path', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onRunQuery = jest.fn();

    render(
      <RawEditor
        db={buildMockDB()}
        query={query}
        queryToValidate={query}
        onChange={onChange}
        onRunQuery={onRunQuery}
        onValidate={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Change and run' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        rawSql: 'SELECT 2',
        rawQuery: true,
      }),
      true
    );
    expect(onRunQuery).not.toHaveBeenCalled();
  });

  it('forwards formatQuery from the editor into the toolbox', async () => {
    const user = userEvent.setup();

    render(
      <RawEditor
        db={buildMockDB()}
        query={query}
        queryToValidate={query}
        onChange={jest.fn()}
        onRunQuery={jest.fn()}
        onValidate={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Format query' }));
    expect(formatQuery).toHaveBeenCalledTimes(1);
  });

  it('expands the editor via the toolbox', async () => {
    const user = userEvent.setup();

    render(
      <RawEditor
        db={buildMockDB()}
        query={query}
        queryToValidate={query}
        onChange={jest.fn()}
        onRunQuery={jest.fn()}
        onValidate={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Expand editor' }));

    expect(screen.getByText('Editing in expanded code editor')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
