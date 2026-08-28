import { lastValueFrom, throwError } from 'rxjs';

import {
  CoreApp,
  type DataQueryRequest,
  type DataSourceInstanceSettings,
  dateTime,
  type ScopedVars,
} from '@grafana/data';
import { type TemplateSrv } from '@grafana/runtime';

import { type DB, QueryFormat, type SQLOptions, type SQLQuery, type SqlQueryModel } from '../types';

import { SqlDatasource } from './SqlDatasource';

const fetchMock = jest.fn();

jest.mock('@grafana/runtime', () => ({
  ...(jest.requireActual('@grafana/runtime') as unknown as object),
  getBackendSrv: () => ({
    fetch: fetchMock,
  }),
  reportInteraction: jest.fn(),
}));

class TestSqlDatasource extends SqlDatasource {
  getDB(): DB {
    return {} as DB;
  }

  getQueryModel(): SqlQueryModel {
    return {
      quoteLiteral: (value: string) => `'${value.replace(/'/g, "''")}'`,
    } as SqlQueryModel;
  }
}

function createTemplateSrv(overrides: Partial<TemplateSrv> = {}): TemplateSrv {
  return {
    replace: jest.fn((query: string) => query),
    containsTemplate: jest.fn(() => false),
    getVariables: jest.fn(() => []),
    updateTimeRange: jest.fn(),
    ...overrides,
  } as TemplateSrv;
}

function createInstanceSettings(
  overrides: Partial<DataSourceInstanceSettings<SQLOptions>> = {}
): DataSourceInstanceSettings<SQLOptions> {
  return {
    uid: 'sql-ds-uid',
    id: 1,
    name: 'Test SQL',
    type: 'grafana-postgresql-datasource',
    meta: {} as DataSourceInstanceSettings<SQLOptions>['meta'],
    readOnly: false,
    jsonData: {} as SQLOptions,
    ...overrides,
  } as DataSourceInstanceSettings<SQLOptions>;
}

describe('SqlDatasource', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  describe('applyTemplateVariables', () => {
    it('replaces rawSql via templateSrv', () => {
      const replace = jest.fn((_query: string, _scopedVars?: ScopedVars, _format?: unknown) => {
        return 'SELECT * FROM users WHERE id = 1';
      });
      const templateSrv = createTemplateSrv({ replace });
      const ds = new TestSqlDatasource(createInstanceSettings(), templateSrv);

      const target: SQLQuery = {
        refId: 'A',
        rawSql: 'SELECT * FROM users WHERE id = $id',
        format: QueryFormat.Table,
      };
      const scopedVars: ScopedVars = {
        id: { text: '1', value: '1' },
      };

      const result = ds.applyTemplateVariables(target, scopedVars);

      expect(replace).toHaveBeenCalledWith(target.rawSql, scopedVars, ds.interpolateVariable);
      expect(result).toEqual({
        refId: 'A',
        datasource: { type: 'grafana-postgresql-datasource', uid: 'sql-ds-uid' },
        rawSql: 'SELECT * FROM users WHERE id = 1',
        format: QueryFormat.Table,
      });
    });
  });

  describe('filterQuery', () => {
    it('returns false when query is hidden', () => {
      const ds = new TestSqlDatasource(createInstanceSettings(), createTemplateSrv());
      expect(ds.filterQuery({ refId: 'A', hide: true })).toBe(false);
    });

    it('returns true when query is not hidden', () => {
      const ds = new TestSqlDatasource(createInstanceSettings(), createTemplateSrv());
      expect(ds.filterQuery({ refId: 'A', hide: false })).toBe(true);
      expect(ds.filterQuery({ refId: 'A' })).toBe(true);
    });
  });

  describe('targetContainsTemplate', () => {
    it('ignores MACRO_NAMES when detecting templates', () => {
      const containsTemplate = jest.fn(() => false);
      const templateSrv = createTemplateSrv({ containsTemplate });
      const ds = new TestSqlDatasource(createInstanceSettings(), templateSrv);

      const result = ds.targetContainsTemplate({
        refId: 'A',
        rawSql: 'SELECT $__timeFilter(time) FROM metrics',
      });

      expect(containsTemplate).toHaveBeenCalled();
      const queryPassedToContainsTemplate = containsTemplate.mock.calls[0][0] as string;
      expect(queryPassedToContainsTemplate).not.toContain('$__timeFilter');
      expect(result).toBe(false);
    });

    it('detects user template variables after macros are stripped', () => {
      const containsTemplate = jest.fn((query: string) => query.includes('$region'));
      const templateSrv = createTemplateSrv({ containsTemplate });
      const ds = new TestSqlDatasource(createInstanceSettings(), templateSrv);

      const result = ds.targetContainsTemplate({
        refId: 'A',
        rawSql: 'SELECT * FROM metrics WHERE $__timeFilter(time) AND region = $region',
      });

      expect(containsTemplate).toHaveBeenCalled();
      const queryPassedToContainsTemplate = containsTemplate.mock.calls[0][0] as string;
      expect(queryPassedToContainsTemplate).toContain('$region');
      expect(queryPassedToContainsTemplate).not.toContain('$__timeFilter');
      expect(result).toBe(true);
    });
  });

  describe('query() Postgres default-database guard', () => {
    it('returns an error observable when no preconfigured database is set', async () => {
      const ds = new TestSqlDatasource(
        createInstanceSettings({
          type: 'grafana-postgresql-datasource',
          jsonData: {} as SQLOptions,
        }),
        createTemplateSrv()
      );

      const request = {
        app: CoreApp.Dashboard,
        targets: [{ refId: 'A', rawSql: 'SELECT 1' }],
      } as DataQueryRequest<SQLQuery>;

      await expect(lastValueFrom(ds.query(request))).rejects.toThrow(
        /You do not currently have a default database configured/
      );
    });

    it('does not apply the Postgres guard when a default database is configured', async () => {
      const ds = new TestSqlDatasource(
        createInstanceSettings({
          type: 'grafana-postgresql-datasource',
          jsonData: { database: 'grafana' } as SQLOptions,
        }),
        createTemplateSrv()
      );

      // Avoid invoking the real backend query path; stub the parent implementation.
      const parentQuery = jest
        .spyOn(Object.getPrototypeOf(SqlDatasource.prototype), 'query')
        .mockReturnValue(throwError(() => new Error('should not reach backend in this assertion')));

      const request = {
        app: CoreApp.Explore,
        targets: [{ refId: 'A', rawSql: 'SELECT 1' }],
      } as DataQueryRequest<SQLQuery>;

      // Guard did not fire — we reach super.query (mocked) rather than the missing-database Error.
      await expect(lastValueFrom(ds.query(request))).rejects.toThrow('should not reach backend in this assertion');
      expect(parentQuery).toHaveBeenCalled();

      parentQuery.mockRestore();
    });
  });

  describe('metricFindQuery', () => {
    it('returns an empty array when range is missing', async () => {
      const ds = new TestSqlDatasource(createInstanceSettings(), createTemplateSrv());

      await expect(ds.metricFindQuery('SELECT DISTINCT city FROM cities')).resolves.toEqual([]);
      await expect(ds.metricFindQuery('SELECT DISTINCT city FROM cities', {})).resolves.toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("wraps backend errors as 'error when executing the sql query'", async () => {
      const templateSrv = createTemplateSrv({
        replace: jest.fn((query: string) => query),
      });
      const ds = new TestSqlDatasource(createInstanceSettings(), templateSrv);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      fetchMock.mockReturnValue(throwError(() => new Error('backend unavailable')));

      await expect(
        ds.metricFindQuery('SELECT DISTINCT city FROM cities', {
          range: {
            from: dateTime(0),
            to: dateTime(1),
            raw: { from: 'now-1h', to: 'now' },
          },
        })
      ).rejects.toThrow('error when executing the sql query');

      expect(fetchMock).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
