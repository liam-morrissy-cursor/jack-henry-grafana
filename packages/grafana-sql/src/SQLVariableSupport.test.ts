import { type DataFrame, type DataQueryRequest, type Field, FieldType } from '@grafana/data';
import { EditorMode } from '@grafana/plugin-ui';
import { lastValueFrom, of } from 'rxjs';

import { SQLVariablesQueryEditor } from './SQLVariableEditor';
import { SQLVariableSupport } from './SQLVariableSupport';
import { migrateVariableQuery, convertFieldsToVariableFields, updateFrame, refId } from './SQLVariableUtils';
import { type SqlDatasource } from './datasource/SqlDatasource';
import { QueryFormat, type SQLQuery, type SQLQueryMeta } from './types';

const refId = 'SQLVariableQueryEditor-VariableQuery';
const sampleQuery = 'SELECT * FROM users';

describe('migrateVariableQuery', () => {
  it('should handle string query', () => {
    const result = migrateVariableQuery(sampleQuery);
    expect(result).toMatchObject({
      refId,
      rawSql: sampleQuery,
      query: sampleQuery,
      editorMode: EditorMode.Code,
      format: QueryFormat.Table,
    });
  });
  it('should handle empty string query', () => {
    const result = migrateVariableQuery('');
    expect(result).toMatchObject({
      refId,
      rawSql: '',
      query: '',
      editorMode: EditorMode.Builder,
      format: QueryFormat.Table,
    });
  });
  it('should handle SQLQuery object with rawSql', () => {
    const rawQuery: SQLQuery = {
      refId: 'A',
      rawSql: sampleQuery,
      format: QueryFormat.Timeseries,
      editorMode: EditorMode.Code,
    };
    const result = migrateVariableQuery(rawQuery);
    expect(result).toStrictEqual({ ...rawQuery, query: sampleQuery });
  });
  it('should preserve all other properties from SQLQuery', () => {
    const rawQuery: SQLQuery = {
      refId: 'C',
      rawSql: sampleQuery,
      alias: 'test_alias',
      dataset: 'test_dataset',
      table: 'test_table',
      meta: { textField: 'name', valueField: 'id' },
    };
    const result = migrateVariableQuery(rawQuery);
    expect(result).toStrictEqual({ ...rawQuery, query: sampleQuery });
  });
});

describe('convertOriginalFieldsToVariableFields', () => {
  describe('no fields available', () => {
    it('should throw error when no fields provided', () => {
      expect(() => convertFieldsToVariableFields([])).toThrow('at least one field expected for variable');
    });
  });
  describe('when meta fields available', () => {
    it('should respect meta.textField and meta.valueField', () => {
      const fields = [field('id', FieldType.number, [3, 4]), field('display_name'), field('category')];
      const meta: SQLQueryMeta = { textField: 'display_name', valueField: 'id' };
      const result = convertFieldsToVariableFields(fields, meta);
      expect(result.map((r) => r.name)).toStrictEqual(['text', 'value', 'id', 'display_name', 'category']);
    });
    it('should handle meta with non-existent field names', () => {
      const fields = [field('id'), field('name')];
      const meta: SQLQueryMeta = { textField: 'non_existent_field', valueField: 'also_non_existent' };
      const result = convertFieldsToVariableFields(fields, meta);
      expect(result.map((r) => r.name)).toStrictEqual(['text', 'value', 'id', 'name']);
      expect(result[0]).toStrictEqual({ ...fields[0], name: 'text' });
      expect(result[1]).toStrictEqual({ ...fields[0], name: 'value' });
    });
    it('should handle partial meta (only textField)', () => {
      const fields = [field('id'), field('label'), field('description')];
      const meta: SQLQueryMeta = { textField: 'label' };
      const result = convertFieldsToVariableFields(fields, meta);
      expect(result.map((r) => r.name)).toStrictEqual(['text', 'value', 'id', 'label', 'description']);
    });
    it('should handle partial meta (only valueField)', () => {
      const fields = [field('name'), field('id', FieldType.number), field('type')];
      const meta: SQLQueryMeta = { valueField: 'id' };
      const result = convertFieldsToVariableFields(fields, meta);
      expect(result.map((r) => r.name)).toStrictEqual(['text', 'value', 'name', 'id', 'type']);
    });
    it('should preserve field types and configurations', () => {
      const fields = [
        { name: 'id', type: FieldType.number, config: { unit: 'short', displayName: 'ID' }, values: [1, 2, 3] },
        { name: 'name', type: FieldType.string, config: { displayName: 'Name' }, values: ['A', 'B', 'C'] },
      ];
      const meta: SQLQueryMeta = { textField: 'name', valueField: 'id' };
      const result = convertFieldsToVariableFields(fields, meta);
      expect(result[0]).toStrictEqual({
        name: 'text',
        type: FieldType.string,
        config: { displayName: 'Name' },
        values: ['A', 'B', 'C'],
      });
      expect(result[1]).toStrictEqual({
        name: 'value',
        type: FieldType.number,
        config: { unit: 'short', displayName: 'ID' },
        values: [1, 2, 3],
      });
    });
  });
  describe('when __text or __value fields present', () => {
    it('should handle fields with __text and __value names', () => {
      const fields = [field('__text'), field('__value'), field('other_field')];
      expect(convertFieldsToVariableFields(fields).map((r) => r.name)).toStrictEqual(['text', 'value', 'other_field']);
    });
    describe('should handle as legacy support', () => {
      it('should handle fields with only __text', () => {
        const fields = [field('__text'), field('other_field')];
        expect(convertFieldsToVariableFields(fields).map((r) => r.name)).toStrictEqual(['text', 'value']);
      });
      it('should handle fields with only __value', () => {
        const fields = [field('__value'), field('other_field')];
        expect(convertFieldsToVariableFields(fields).map((r) => r.name)).toStrictEqual(['text', 'value']);
      });
    });
  });
  describe('legacy support', () => {
    it('should combine all fields when no __text or __value present and no meta field present', () => {
      const fields = [
        field('id', FieldType.string, ['A', 'B', 'C']),
        field('name', FieldType.string, ['D', 'D']),
        field('category', FieldType.string, ['F', 'G', 'H']),
      ];
      let out = convertFieldsToVariableFields(fields);
      expect(out.map((r) => r.name)).toStrictEqual(['text', 'value']);
      expect(out[0].values.length).toStrictEqual(7);
    });
    it('should not include duplicate "value" or "text" fields in otherFields', () => {
      const fields = [field('value'), field('text'), field('other')];
      expect(convertFieldsToVariableFields(fields).map((r) => r.name)).toStrictEqual(['text', 'value']);
    });
  });
});

describe('updateFrame', () => {
  it('should update frame length to match deduplicated values in legacy scenario', () => {
    const inputFrame: DataFrame = {
      name: 'test',
      length: 6,
      fields: [field('id', FieldType.string, ['A', 'B', 'A', 'C', 'B', 'D'])],
    };
    const result = updateFrame(inputFrame);
    expect(result.length).toBe(4);
    expect(result.fields[0].values).toEqual(['A', 'B', 'C', 'D']);
  });

  it('should update frame length when multiple fields have duplicates across them', () => {
    const inputFrame: DataFrame = {
      name: 'test',
      length: 9,
      fields: [
        field('id', FieldType.string, ['A', 'B', 'C']),
        field('name', FieldType.string, ['D', 'D']),
        field('category', FieldType.string, ['F', 'G', 'H']),
      ],
    };
    const result = updateFrame(inputFrame);
    expect(result.length).toBe(7);
    expect(result.fields[0].values).toEqual(['A', 'B', 'C', 'D', 'F', 'G', 'H']);
  });

  it('should update frame length with meta fields', () => {
    const inputFrame: DataFrame = {
      name: 'test',
      length: 3,
      fields: [
        field('display_name', FieldType.string, ['Alice', 'Bob', 'Charlie']),
        field('id', FieldType.number, [1, 2, 3]),
      ],
    };
    const result = updateFrame(inputFrame, { textField: 'display_name', valueField: 'id' });
    expect(result.length).toBe(3);
    expect(result.fields[0].name).toBe('text');
    expect(result.fields[1].name).toBe('value');
  });

  it('should update frame length with __text and __value fields', () => {
    const inputFrame: DataFrame = {
      name: 'test',
      length: 2,
      fields: [field('__text', FieldType.string, ['a', 'b']), field('__value', FieldType.string, ['1', '2'])],
    };
    const result = updateFrame(inputFrame);
    expect(result.length).toBe(2);
    expect(result.fields[0].name).toBe('text');
    expect(result.fields[1].name).toBe('value');
  });
});

const field = (name: string, type: FieldType = FieldType.string, values: unknown[] = [1, 2, 3]): Field => ({
  name,
  type,
  values,
  config: {},
});

describe('SQLVariableSupport', () => {
  const makeDatasource = (response: DataFrame[] = []) =>
    ({
      query: jest.fn().mockReturnValue(of({ data: response })),
    }) as unknown as SqlDatasource;

  const makeRequest = (targets: Array<string | SQLQuery>): DataQueryRequest<SQLQuery> =>
    ({
      targets,
    }) as DataQueryRequest<SQLQuery>;

  it('uses SQLVariablesQueryEditor as the custom variable editor', () => {
    const support = new SQLVariableSupport(makeDatasource());
    expect(support.editor).toBe(SQLVariablesQueryEditor);
  });

  it('getDefaultQuery returns a builder-mode table query with the variable refId', () => {
    const support = new SQLVariableSupport(makeDatasource());
    expect(support.getDefaultQuery()).toMatchObject({
      refId,
      editorMode: EditorMode.Builder,
      format: QueryFormat.Table,
      rawSql: '',
    });
  });

  it('throws when query is submitted with no targets', () => {
    const support = new SQLVariableSupport(makeDatasource());
    expect(() => support.query(makeRequest([]))).toThrow('no variable query found');
  });

  it('migrates the target and submits it to the datasource', async () => {
    const frame: DataFrame = {
      name: 'users',
      length: 2,
      fields: [field('id', FieldType.number, [1, 2]), field('name', FieldType.string, ['a', 'b'])],
    };
    const datasource = makeDatasource([frame]);
    const support = new SQLVariableSupport(datasource);

    const result = await lastValueFrom(support.query(makeRequest([sampleQuery])));

    expect(datasource.query).toHaveBeenCalledTimes(1);
    const submitted = (datasource.query as jest.Mock).mock.calls[0][0] as DataQueryRequest<SQLQuery>;
    expect(submitted.targets).toHaveLength(1);
    expect(submitted.targets[0]).toMatchObject({
      refId,
      rawSql: sampleQuery,
      query: sampleQuery,
      editorMode: EditorMode.Code,
      format: QueryFormat.Table,
    });
    expect(result.data[0].fields[0].name).toBe('text');
    expect(result.data[0].fields[1].name).toBe('value');
  });

  it('applies meta value/text field mapping when transforming the response frame', async () => {
    const frame: DataFrame = {
      name: 'users',
      length: 2,
      fields: [field('id', FieldType.number, [1, 2]), field('name', FieldType.string, ['a', 'b'])],
    };
    const datasource = makeDatasource([frame]);
    const support = new SQLVariableSupport(datasource);
    const target: SQLQuery = {
      refId: 'A',
      rawSql: sampleQuery,
      meta: { valueField: 'id', textField: 'name' },
    };

    const result = await lastValueFrom(support.query(makeRequest([target])));

    expect(result.data[0].fields[0]).toMatchObject({ name: 'text', values: ['a', 'b'] });
    expect(result.data[0].fields[1]).toMatchObject({ name: 'value', values: [1, 2] });
  });
});
