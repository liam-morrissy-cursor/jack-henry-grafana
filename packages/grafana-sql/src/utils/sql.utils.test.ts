import {
  QueryEditorExpressionType,
  type QueryEditorFunctionExpression,
  type QueryEditorFunctionParameterExpression,
  QueryEditorPropertyType,
} from '../expressions';

import {
  createFunctionField,
  createSelectClause,
  getColumnValue,
  haveColumns,
  setGroupByField,
  setPropertyField,
} from './sql.utils';

function param(name: string): QueryEditorFunctionParameterExpression {
  return { type: QueryEditorExpressionType.FunctionParameter, name };
}

function column(partial: Partial<QueryEditorFunctionExpression> = {}): QueryEditorFunctionExpression {
  return {
    type: QueryEditorExpressionType.Function,
    ...partial,
  };
}

describe('createSelectClause', () => {
  it('renders a bare column from parameters', () => {
    expect(createSelectClause([column({ parameters: [param('id')] })])).toBe('SELECT id ');
  });

  it('renders a function with a single parameter', () => {
    expect(createSelectClause([column({ name: 'AVG', parameters: [param('value')] })])).toBe('SELECT AVG(value) ');
  });

  it('renders a function with an alias', () => {
    expect(createSelectClause([column({ name: 'AVG', parameters: [param('value')], alias: 'avg_value' })])).toBe(
      'SELECT AVG(value) AS avg_value '
    );
  });

  it('renders a column alias without a function name', () => {
    expect(createSelectClause([column({ parameters: [param('id')], alias: 'user_id' })])).toBe('SELECT id AS user_id ');
  });

  it('joins multiple columns with a comma and space', () => {
    expect(
      createSelectClause([
        column({ parameters: [param('host')] }),
        column({ name: 'SUM', parameters: [param('bytes')], alias: 'total_bytes' }),
      ])
    ).toBe('SELECT host, SUM(bytes) AS total_bytes ');
  });

  it('passes dotted identifiers through without quoting', () => {
    expect(
      createSelectClause([
        column({ parameters: [param('metrics.cpu')] }),
        column({ name: '$__timeGroup', parameters: [param('time.createdAt'), param('$__interval')], alias: 'time' }),
      ])
    ).toBe('SELECT metrics.cpu, $__timeGroup(time.createdAt,$__interval) AS time ');
  });

  it('joins multiple function parameters with commas and no spaces', () => {
    expect(
      createSelectClause([
        column({
          name: '$__timeGroup',
          parameters: [param('createdAt'), param('$__interval')],
          alias: 'time',
        }),
      ])
    ).toBe('SELECT $__timeGroup(createdAt,$__interval) AS time ');
  });
});

describe('GROUP BY from groupBy array', () => {
  it('builds a GROUP BY field list from setGroupByField expressions', () => {
    const groupBy = [setGroupByField('host'), setGroupByField('region'), setGroupByField('metrics.cpu')];
    const fields = groupBy.map((expression) => expression.property.name).filter((name): name is string => Boolean(name));

    expect(fields).toEqual(['host', 'region', 'metrics.cpu']);
    expect(`GROUP BY ${fields.join(', ')}`).toBe('GROUP BY host, region, metrics.cpu');
  });

  it('omits unnamed group-by fields from the clause', () => {
    const groupBy = [setGroupByField(), setGroupByField('host')];
    const fields = groupBy.map((expression) => expression.property.name).filter((name): name is string => Boolean(name));

    expect(fields).toEqual(['host']);
    expect(`GROUP BY ${fields.join(', ')}`).toBe('GROUP BY host');
  });
});

describe('setGroupByField', () => {
  it('creates a string GroupBy expression for a field name', () => {
    expect(setGroupByField('host')).toEqual({
      type: QueryEditorExpressionType.GroupBy,
      property: {
        type: QueryEditorPropertyType.String,
        name: 'host',
      },
    });
  });

  it('preserves dotted identifiers as the property name', () => {
    expect(setGroupByField('metrics.cpu').property.name).toBe('metrics.cpu');
  });
});

describe('setPropertyField', () => {
  it('creates a string Property expression for a field name', () => {
    expect(setPropertyField('createdAt')).toEqual({
      type: QueryEditorExpressionType.Property,
      property: {
        type: QueryEditorPropertyType.String,
        name: 'createdAt',
      },
    });
  });
});

describe('createFunctionField', () => {
  it('creates an empty Function expression when no name is given', () => {
    expect(createFunctionField()).toEqual({
      type: QueryEditorExpressionType.Function,
      name: undefined,
      parameters: [],
    });
  });

  it('sets the function name and starts with no parameters', () => {
    expect(createFunctionField('AVG')).toEqual({
      type: QueryEditorExpressionType.Function,
      name: 'AVG',
      parameters: [],
    });
  });
});

describe('getColumnValue', () => {
  it('returns a selectable option for a named column or function', () => {
    expect(getColumnValue(param('createdAt'))).toEqual({ label: 'createdAt', value: 'createdAt' });
    expect(getColumnValue(createFunctionField('AVG'))).toEqual({ label: 'AVG', value: 'AVG' });
  });

  it('returns null when the name is missing', () => {
    expect(getColumnValue(undefined)).toBeNull();
    expect(getColumnValue(param(''))).toBeNull();
    expect(getColumnValue(createFunctionField())).toBeNull();
  });
});

describe('haveColumns', () => {
  it('is false for missing or empty column lists', () => {
    expect(haveColumns(undefined)).toBe(false);
    expect(haveColumns([])).toBe(false);
    expect(haveColumns([column()])).toBe(false);
  });

  it('is true when a column has parameters or a function name', () => {
    expect(haveColumns([column({ parameters: [param('id')] })])).toBe(true);
    expect(haveColumns([column({ name: 'AVG' })])).toBe(true);
  });
});
