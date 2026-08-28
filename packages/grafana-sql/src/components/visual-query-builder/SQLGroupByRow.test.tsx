import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { applyQueryDefaults } from '../../defaults';
import { QueryEditorExpressionType, QueryEditorPropertyType } from '../../expressions';
import { type SQLQuery } from '../../types';
import { setGroupByField } from '../../utils/sql.utils';
import { buildMockDB } from '../SqlComponents.testHelpers';

import { SQLGroupByRow } from './SQLGroupByRow';

describe('SQLGroupByRow', () => {
  const query = applyQueryDefaults(
    Object.freeze<SQLQuery>({
      refId: 'A',
      rawSql: '',
      dataset: 'metrics',
      table: 'cpu',
      sql: {
        columns: [
          {
            name: undefined,
            parameters: [{ name: 'host', type: QueryEditorExpressionType.FunctionParameter }],
            type: QueryEditorExpressionType.Function,
          },
        ],
        groupBy: [setGroupByField()],
        limit: 50,
      },
    })
  );

  it('updates the sql model when a group column is selected', async () => {
    const onQueryChange = jest.fn();
    const db = buildMockDB();
    db.toRawSql = jest.fn((q: SQLQuery) => `GROUP BY ${q.sql?.groupBy?.[0]?.property.name ?? ''}`);

    render(
      <SQLGroupByRow
        fields={[{ label: 'region', value: 'region' }]}
        query={query}
        onQueryChange={onQueryChange}
        db={db}
      />
    );

    await userEvent.click(screen.getByLabelText('Group by'));
    await userEvent.click(screen.getByText('region'));

    expect(onQueryChange).toHaveBeenCalledWith({
      ...query,
      sql: {
        ...query.sql,
        groupBy: [
          {
            type: QueryEditorExpressionType.GroupBy,
            property: {
              type: QueryEditorPropertyType.String,
              name: 'region',
            },
          },
        ],
      },
      rawSql: 'GROUP BY region',
    });
    expect(db.toRawSql).toHaveBeenCalled();
  });
});
