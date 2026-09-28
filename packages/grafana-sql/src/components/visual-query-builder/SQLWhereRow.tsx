import { useAsync } from 'react-use';

import { type SelectableValue, type TypedVariableModel } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';

import { type QueryWithDefaults } from '../../defaults';
import { type DB, type SQLExpression, type SQLQuery, type SQLSelectableValue } from '../../types';
import { useSqlChange } from '../../utils/useSqlChange';

import { type Config } from './AwesomeQueryBuilder';
import { WhereRow } from './WhereRow';

interface WhereRowProps {
  query: QueryWithDefaults;
  fields: SelectableValue[];
  onQueryChange: (query: SQLQuery) => void;
  db: DB;
}

export function SQLWhereRow({ query, fields, onQueryChange, db }: WhereRowProps) {
  const state = useAsync(async () => {
    return mapFieldsToTypes(fields);
  }, [fields]);

  const { onSqlChange } = useSqlChange({ query, onQueryChange, db });

  return (
    <WhereRow
      // TODO: fix key that's used to force clean render or SQLWhereRow - otherwise it doesn't render operators correctly
      key={JSON.stringify(state.value)}
      config={{ fields: state.value || {} }}
      sql={query.sql!}
      onSqlChange={(val: SQLExpression) => {
        const templateVars = getTemplateSrv().getVariables();

        removeQuotesForMultiVariables(val, templateVars);

        onSqlChange(val);
      }}
    />
  );
}

// needed for awesome query builder
function mapFieldsToTypes(columns: SQLSelectableValue[]) {
  const fields: Config['fields'] = {};
  for (const col of columns) {
    fields[col.value] = {
      type: col.raqbFieldType || 'text',
      valueSources: ['value'],
      mainWidgetProps: { customProps: { icon: col.icon } },
    };
  }
  return fields;
}

// Multi-value variables already expand to quoted literals ('a','b'). The builder
// wraps the variable in quotes, which would double-quote it. Strip only that
// wrapper. A global replace of (' and ') also rewrites unrelated literals.
export function removeQuotesForMultiVariables(val: SQLExpression, templateVars: TypedVariableModel[]) {
  if (!val.whereString) {
    return;
  }

  let whereString = val.whereString;

  for (const tv of templateVars) {
    if (!('multi' in tv) || !tv.multi || !tv.name) {
      continue;
    }

    const escapedName = escapeRegExp(tv.name);
    const quotedVariable = [
      // ('${name}')
      new RegExp(`\\('(\\$\\{${escapedName}\\})'\\)`, 'g'),
      // ('$name'), but not a longer identifier such as ('$nameSuffix')
      new RegExp(`\\('(\\$${escapedName})(?![A-Za-z0-9_])'\\)`, 'g'),
    ];

    for (const pattern of quotedVariable) {
      whereString = whereString.replaceAll(pattern, '($1)');
    }
  }

  val.whereString = whereString;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
