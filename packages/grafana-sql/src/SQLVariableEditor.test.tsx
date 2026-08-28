import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { type Field, FieldType } from '@grafana/data';

import { SQLVariablesQueryEditor } from './SQLVariableEditor';
import { type SqlDatasource } from './datasource/SqlDatasource';
import { QueryFormat, type SQLQuery } from './types';

jest.mock('./components/QueryEditorLazy', () => ({
  SqlQueryEditorLazy: ({ query, onChange }: { query: SQLQuery; onChange: (q: SQLQuery) => void }) => (
    <button type="button" onClick={() => onChange({ ...query, rawSql: 'SELECT id, name FROM users' })}>
      mock-sql-editor
    </button>
  ),
}));

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  return {
    ...actual,
    Combobox: ({
      options = [],
      value,
      onChange,
      'aria-label': ariaLabel,
    }: {
      options?: Array<{ value?: string; label?: string }>;
      value?: string;
      onChange: (option: { value?: string } | null) => void;
      'aria-label'?: string;
    }) => (
      <select
        aria-label={ariaLabel ?? 'combobox'}
        value={value ?? ''}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next ? { value: next } : null);
        }}
      >
        <option value="">clear</option>
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label ?? option.value}
          </option>
        ))}
      </select>
    ),
  };
});

describe('SQLVariablesQueryEditor', () => {
  const fields: Field[] = [
    { name: 'id', type: FieldType.number, values: [1, 2], config: {} },
    { name: 'name', type: FieldType.string, values: ['a', 'b'], config: {} },
  ];

  const makeDatasource = () =>
    ({
      dialect: 'other',
      query: jest.fn().mockReturnValue(of({ data: [{ fields, length: 2 }] })),
    }) as unknown as SqlDatasource;

  const baseQuery: SQLQuery = {
    refId: 'A',
    rawSql: 'SELECT id, name FROM users',
    format: QueryFormat.Table,
  };

  it('renders the SQL editor and value/text field mapping controls', async () => {
    render(
      <SQLVariablesQueryEditor
        datasource={makeDatasource()}
        query={baseQuery}
        onChange={jest.fn()}
        onRunQuery={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'mock-sql-editor' })).toBeInTheDocument();
    expect(screen.getByText('Value Field')).toBeInTheDocument();
    expect(screen.getByText('Text Field')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(2));
  });

  it('calls onChange when the embedded SQL editor updates the query', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <SQLVariablesQueryEditor
        datasource={makeDatasource()}
        query={baseQuery}
        onChange={onChange}
        onRunQuery={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'mock-sql-editor' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        rawSql: 'SELECT id, name FROM users',
        query: 'SELECT id, name FROM users',
      })
    );
  });

  it('calls onChange with updated meta when a value field is selected', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const datasource = makeDatasource();

    render(
      <SQLVariablesQueryEditor datasource={datasource} query={baseQuery} onChange={onChange} onRunQuery={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: 'id' }).length).toBeGreaterThan(0);
    });

    const valueFieldCombobox = screen.getAllByRole('combobox')[0];
    await user.selectOptions(valueFieldCombobox, 'id');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        rawSql: baseQuery.rawSql,
        meta: expect.objectContaining({ valueField: 'id' }),
      })
    );
  });
});
