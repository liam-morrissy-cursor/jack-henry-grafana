import { act, renderHook } from '@testing-library/react';

import { QueryEditorExpressionType } from '../expressions';
import { type DB, type SQLExpression, type SQLQuery } from '../types';

import { useSqlChange } from './useSqlChange';

describe('useSqlChange', () => {
  it('calls db.toRawSql and updates rawSql on sql change', () => {
    const toRawSql = jest.fn().mockReturnValue('SELECT col FROM dataset.table');
    const db = { toRawSql } as unknown as DB;
    const onQueryChange = jest.fn();
    const query: SQLQuery = {
      refId: 'A',
      dataset: 'dataset',
      table: 'table',
      rawSql: 'SELECT 1',
    };
    const sql: SQLExpression = {
      columns: [
        {
          type: QueryEditorExpressionType.Function,
          parameters: [{ type: QueryEditorExpressionType.FunctionParameter, name: 'col' }],
        },
      ],
    };

    const { result } = renderHook(() => useSqlChange({ query, onQueryChange, db }));

    act(() => {
      result.current.onSqlChange(sql);
    });

    expect(toRawSql).toHaveBeenCalledWith({
      sql,
      dataset: 'dataset',
      table: 'table',
      refId: 'A',
    });
    expect(onQueryChange).toHaveBeenCalledWith({
      ...query,
      sql,
      rawSql: 'SELECT col FROM dataset.table',
    });
  });
});
