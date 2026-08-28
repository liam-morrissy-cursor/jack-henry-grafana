import { QueryEditorExpressionType, QueryEditorPropertyType } from '../expressions';
import { type SQLExpression } from '../types';

import {
  createFunctionField,
  createSelectClause,
  getColumnValue,
  setGroupByField,
  setPropertyField,
} from './sql.utils';

function parameter(name?: string) {
  return { type: QueryEditorExpressionType.FunctionParameter as const, name };
}

function column(partial: Partial<{ name?: string; alias?: string; parameters?: ReturnType<typeof parameter>[] }>) {
  return { type: QueryEditorExpressionType.Function as const, ...partial };
}

describe('setGroupByField', () => {
  it('builds a GroupBy expression with an optional field name', () => {
    expect(setGroupByField()).toEqual({
      type: QueryEditorExpressionType.GroupBy,
      property: { type: QueryEditorPropertyType.String, name: undefined },
    });
    expect(setGroupByField('host')).toEqual({
      type: QueryEditorExpressionType.GroupBy,
      property: { type: QueryEditorPropertyType.String, name: 'host' },
    });
  });

  it('keeps a dotted identifier as a single field name', () => {
    expect(setGroupByField('cpu.usage').property.name).toBe('cpu.usage');
  });

  it('maps a groupBy field list into SQLExpression.groupBy entries', () => {
    // Mirrors GroupByRow: item.map((v) => setGroupByField(v.property?.name))
    const fields = ['host', 'path', 'cpu.usage'];
    const groupBy: NonNullable<SQLExpression['groupBy']> = fields.map((name) => setGroupByField(name));

    expect(groupBy).toEqual([
      {
        type: QueryEditorExpressionType.GroupBy,
        property: { type: QueryEditorPropertyType.String, name: 'host' },
      },
      {
        type: QueryEditorExpressionType.GroupBy,
        property: { type: QueryEditorPropertyType.String, name: 'path' },
      },
      {
        type: QueryEditorExpressionType.GroupBy,
        property: { type: QueryEditorPropertyType.String, name: 'cpu.usage' },
      },
    ]);
    expect(groupBy.map((g) => g.property.name)).toEqual(fields);
  });
});

describe('setPropertyField', () => {
  it('builds a Property expression with an optional field name', () => {
    expect(setPropertyField()).toEqual({
      type: QueryEditorExpressionType.Property,
      property: { type: QueryEditorPropertyType.String, name: undefined },
    });
    expect(setPropertyField('path')).toEqual({
      type: QueryEditorExpressionType.Property,
      property: { type: QueryEditorPropertyType.String, name: 'path' },
    });
  });

  it('keeps a dotted identifier as a single field name', () => {
    expect(setPropertyField('disk.io.rate').property.name).toBe('disk.io.rate');
  });
});

describe('createFunctionField', () => {
  it('builds a Function expression with empty parameters', () => {
    expect(createFunctionField()).toEqual({
      type: QueryEditorExpressionType.Function,
      name: undefined,
      parameters: [],
    });
    expect(createFunctionField('avg')).toEqual({
      type: QueryEditorExpressionType.Function,
      name: 'avg',
      parameters: [],
    });
  });
});

describe('getColumnValue', () => {
  it('returns null when the column is undefined or null', () => {
    expect(getColumnValue(undefined)).toBeNull();
    expect(getColumnValue(null as unknown as undefined)).toBeNull();
  });

  it('returns null when the column has no name', () => {
    expect(getColumnValue(parameter())).toBeNull();
    expect(getColumnValue(createFunctionField())).toBeNull();
  });

  it('returns a SelectableValue for a named parameter', () => {
    expect(getColumnValue(parameter('bytes'))).toEqual({ label: 'bytes', value: 'bytes' });
  });

  it('returns a SelectableValue for a named function expression', () => {
    expect(getColumnValue(createFunctionField('sum'))).toEqual({ label: 'sum', value: 'sum' });
  });

  it('keeps a dotted identifier as a single selectable value', () => {
    expect(getColumnValue(parameter('cpu.usage'))).toEqual({ label: 'cpu.usage', value: 'cpu.usage' });
  });
});

describe('createSelectClause', () => {
  // Happy paths only. Empty-arg / undefined-stub cases are owned by KAN-11.

  it('renders a bare column from parameters', () => {
    expect(createSelectClause([column({ parameters: [parameter('host')] })])).toBe('SELECT host ');
  });

  it('renders a function with named parameters and no alias', () => {
    expect(createSelectClause([column({ name: 'count', parameters: [parameter('id')] })])).toBe('SELECT count(id) ');
  });

  it('renders a function with alias and named parameters', () => {
    expect(createSelectClause([column({ name: 'sum', alias: 'total', parameters: [parameter('bytes')] })])).toBe(
      'SELECT sum(bytes) AS total '
    );
  });

  it('renders a bare column with an alias', () => {
    expect(createSelectClause([column({ alias: 'h', parameters: [parameter('host')] })])).toBe('SELECT host AS h ');
  });

  it('joins multiple columns', () => {
    expect(
      createSelectClause([
        column({ parameters: [parameter('host')] }),
        column({ name: 'count', parameters: [parameter('id')] }),
      ])
    ).toBe('SELECT host, count(id) ');
  });

  it('passes dotted identifiers through as a single name', () => {
    expect(createSelectClause([column({ parameters: [parameter('cpu.usage')] })])).toBe('SELECT cpu.usage ');
    expect(createSelectClause([column({ name: 'avg', parameters: [parameter('cpu.usage')] })])).toBe(
      'SELECT avg(cpu.usage) '
    );
  });
});
