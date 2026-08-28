import { EditorMode } from '@grafana/plugin-ui';

import { applyQueryDefaults } from './defaults';
import { QueryEditorExpressionType, QueryEditorPropertyType } from './expressions';
import { QueryFormat } from './types';

describe('applyQueryDefaults', () => {
  it('defaults editorMode to Builder when undefined and rawSql is absent', () => {
    const result = applyQueryDefaults({ refId: 'A' });

    expect(result.editorMode).toBe(EditorMode.Builder);
  });

  it('switches to Code when editorMode is undefined and rawSql is present', () => {
    const result = applyQueryDefaults({ refId: 'A', rawSql: 'SELECT 1' });

    expect(result.editorMode).toBe(EditorMode.Code);
  });

  it('preserves an explicit Builder editorMode even when rawSql is present', () => {
    const result = applyQueryDefaults({
      refId: 'A',
      rawSql: 'SELECT 1',
      editorMode: EditorMode.Builder,
    });

    expect(result.editorMode).toBe(EditorMode.Builder);
  });

  it('applies refId, format, rawSql, and sql stub defaults', () => {
    const result = applyQueryDefaults();

    expect(result.refId).toBe('A');
    expect(result.format).toBe(QueryFormat.Table);
    expect(result.rawSql).toBe('');
    expect(result.sql).toEqual({
      columns: [
        {
          type: QueryEditorExpressionType.Function,
          name: undefined,
          parameters: [],
        },
      ],
      groupBy: [
        {
          type: QueryEditorExpressionType.GroupBy,
          property: {
            type: QueryEditorPropertyType.String,
            name: undefined,
          },
        },
      ],
      limit: 50,
    });
  });

  it('preserves provided format, refId, rawSql, and sql', () => {
    const sql = {
      columns: [],
      groupBy: [],
      limit: 10,
    };
    const result = applyQueryDefaults({
      refId: 'B',
      format: QueryFormat.Timeseries,
      rawSql: 'SELECT * FROM metrics',
      editorMode: EditorMode.Code,
      sql,
    });

    expect(result.refId).toBe('B');
    expect(result.format).toBe(QueryFormat.Timeseries);
    expect(result.rawSql).toBe('SELECT * FROM metrics');
    expect(result.editorMode).toBe(EditorMode.Code);
    expect(result.sql).toBe(sql);
  });
});
