import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';

import { EditorMode } from '@grafana/plugin-ui';

import { applyQueryDefaults } from '../../defaults';
import { QueryEditorExpressionType } from '../../expressions';
import { type QueryRowFilter, type SQLQuery } from '../../types';
import { setGroupByField } from '../../utils/sql.utils';
import { buildMockDB } from '../SqlComponents.testHelpers';

import { VisualEditor } from './VisualEditor';

jest.mock('../query-editor-raw/QueryToolbox', () => ({
  QueryToolbox: () => <div data-testid="query-toolbox" />,
}));

jest.mock('./Preview', () => ({
  Preview: ({ rawSql }: { rawSql: string }) => <div data-testid="sql-preview">{rawSql}</div>,
}));

jest.mock('./SQLWhereRow', () => ({
  SQLWhereRow: () => <div data-testid="sql-where-row" />,
}));

describe('VisualEditor', () => {
  const baseQuery = applyQueryDefaults(
    Object.freeze<SQLQuery>({
      refId: 'A',
      rawSql: 'SELECT 1',
      editorMode: EditorMode.Builder,
      sql: {
        columns: [
          {
            name: undefined,
            parameters: [{ name: 'createdAt', type: QueryEditorExpressionType.FunctionParameter }],
            type: QueryEditorExpressionType.Function,
          },
        ],
        groupBy: [setGroupByField()],
        limit: 50,
      },
    })
  );

  const allOff: QueryRowFilter = { filter: false, group: false, order: false, preview: false };

  const renderEditor = (queryRowFilter: QueryRowFilter, query: SQLQuery = baseQuery) => {
    const onChange = jest.fn();
    const onValidate = jest.fn();
    const db = buildMockDB();
    db.fields = jest.fn(() => Promise.resolve([{ label: 'createdAt', value: 'createdAt' }]));
    db.toRawSql = jest.fn(() => query.rawSql || '');

    render(
      <VisualEditor
        query={query}
        db={db}
        queryRowFilter={queryRowFilter}
        onChange={onChange}
        onValidate={onValidate}
      />
    );

    return { onChange, onValidate, db };
  };

  it('hides Filter, Group, Order, and Preview rows when queryRowFilter flags are off', async () => {
    renderEditor(allOff);

    await waitFor(() => {
      expect(screen.getByTestId('query-toolbox')).toBeInTheDocument();
    });

    expect(screen.queryByText('Filter by column value')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sql-where-row')).not.toBeInTheDocument();
    expect(screen.queryByText('Group by column')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Order by')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sql-preview')).not.toBeInTheDocument();
  });

  it('shows the Filter row when queryRowFilter.filter is true', async () => {
    renderEditor({ ...allOff, filter: true });

    await waitFor(() => {
      expect(screen.getByText('Filter by column value')).toBeInTheDocument();
    });
    expect(screen.getByTestId('sql-where-row')).toBeInTheDocument();
  });

  it('shows the Group row when queryRowFilter.group is true', async () => {
    renderEditor({ ...allOff, group: true });

    await waitFor(() => {
      expect(screen.getByText('Group by column')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Group by')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove group by column')).toBeInTheDocument();
  });

  it('shows the Order row when queryRowFilter.order is true', async () => {
    renderEditor({ ...allOff, order: true });

    await waitFor(() => {
      expect(screen.getByLabelText('Order by')).toBeInTheDocument();
    });
    expect(screen.getByText('Limit')).toBeInTheDocument();
  });

  it('shows Preview when queryRowFilter.preview is true and rawSql is set', async () => {
    renderEditor({ ...allOff, preview: true });

    await waitFor(() => {
      expect(screen.getByTestId('sql-preview')).toHaveTextContent('SELECT 1');
    });
  });

  it('does not show Preview when queryRowFilter.preview is true but rawSql is empty', async () => {
    renderEditor({ ...allOff, preview: true }, { ...baseQuery, rawSql: '' });

    await waitFor(() => {
      expect(screen.getByTestId('query-toolbox')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('sql-preview')).not.toBeInTheDocument();
  });
});
