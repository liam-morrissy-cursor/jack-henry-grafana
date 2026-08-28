import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { selectors } from '@grafana/e2e-selectors';

import { applyQueryDefaults } from '../../defaults';
import { QueryEditorExpressionType, QueryEditorPropertyType } from '../../expressions';
import { type SQLQuery } from '../../types';
import { setPropertyField } from '../../utils/sql.utils';
import { buildMockDB } from '../SqlComponents.testHelpers';

import { SQLOrderByRow } from './SQLOrderByRow';

describe('SQLOrderByRow', () => {
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
            parameters: [{ name: 'createdAt', type: QueryEditorExpressionType.FunctionParameter }],
            type: QueryEditorExpressionType.Function,
          },
        ],
        groupBy: [],
        limit: 50,
      },
    })
  );

  const buildDb = () => {
    const db = buildMockDB();
    db.toRawSql = jest.fn(
      (q: SQLQuery) =>
        `ORDER BY ${q.sql?.orderBy?.property.name ?? ''} ${q.sql?.orderByDirection ?? ''}`.trim()
    );
    return db;
  };

  it('updates the sql model when an order column is selected', async () => {
    const onQueryChange = jest.fn();
    const db = buildDb();

    render(
      <SQLOrderByRow
        fields={[{ label: 'createdAt', value: 'createdAt' }]}
        query={query}
        onQueryChange={onQueryChange}
        db={db}
      />
    );

    await userEvent.click(screen.getByLabelText('Order by'));
    await userEvent.click(screen.getByText('createdAt'));

    expect(onQueryChange).toHaveBeenCalledWith({
      ...query,
      sql: {
        ...query.sql,
        orderBy: {
          type: QueryEditorExpressionType.Property,
          property: {
            type: QueryEditorPropertyType.String,
            name: 'createdAt',
          },
        },
      },
      rawSql: 'ORDER BY createdAt',
    });
  });

  it('updates orderByDirection when ASC/DESC is chosen', async () => {
    const onQueryChange = jest.fn();
    const db = buildDb();
    const orderedQuery = applyQueryDefaults({
      ...query,
      sql: {
        ...query.sql!,
        orderBy: setPropertyField('createdAt'),
        orderByDirection: 'ASC',
      },
    });

    render(
      <SQLOrderByRow
        fields={[{ label: 'createdAt', value: 'createdAt' }]}
        query={orderedQuery}
        onQueryChange={onQueryChange}
        db={db}
      />
    );

    await userEvent.click(screen.getByTestId(selectors.components.RadioButton.option('DESC')));

    expect(onQueryChange).toHaveBeenCalledWith({
      ...orderedQuery,
      sql: {
        ...orderedQuery.sql,
        orderBy: setPropertyField('createdAt'),
        orderByDirection: 'DESC',
      },
      rawSql: 'ORDER BY createdAt DESC',
    });
  });
});
