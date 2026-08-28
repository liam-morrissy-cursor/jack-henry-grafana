import { type SelectableValue } from '@grafana/data';

import { QueryEditorExpressionType } from '../expressions';
import { type SQLQuery } from '../types';

import { getColumnsWithIndices } from './getColumnsWithIndices';

describe('getColumnsWithIndices', () => {
  const fields: SelectableValue[] = [
    { label: 'host', value: 'host' },
    { label: 'value', value: 'value' },
  ];

  it('returns fields unchanged when query has no sql columns', () => {
    expect(getColumnsWithIndices({ refId: 'A' }, fields)).toBe(fields);
    expect(getColumnsWithIndices({ refId: 'A', sql: {} }, fields)).toBe(fields);
  });

  it('prepends selected-column options with 1-based indices for named functions', () => {
    const query: SQLQuery = {
      refId: 'A',
      sql: {
        columns: [
          {
            type: QueryEditorExpressionType.Function,
            name: 'avg',
            parameters: [{ type: QueryEditorExpressionType.FunctionParameter, name: 'cpu' }],
          },
          {
            type: QueryEditorExpressionType.Function,
            name: 'sum',
            parameters: [
              { type: QueryEditorExpressionType.FunctionParameter, name: 'mem' },
              { type: QueryEditorExpressionType.FunctionParameter, name: 'disk' },
            ],
          },
        ],
      },
    };

    const result = getColumnsWithIndices(query, fields);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      value: '',
      label: 'Selected columns',
      expanded: true,
      options: [
        { value: 'avg(cpu)', label: '1 - avg(cpu)' },
        { value: 'sum(mem, disk)', label: '2 - sum(mem, disk)' },
      ],
    });
    expect(result.slice(1)).toEqual(fields);
  });

  it('formats columns without a function name as joined parameter names', () => {
    const query: SQLQuery = {
      refId: 'A',
      sql: {
        columns: [
          {
            type: QueryEditorExpressionType.Function,
            parameters: [{ type: QueryEditorExpressionType.FunctionParameter, name: 'hostname' }],
          },
        ],
      },
    };

    const result = getColumnsWithIndices(query, fields);

    expect(result[0].options).toEqual([{ value: 'hostname', label: '1 - hostname' }]);
  });
});
