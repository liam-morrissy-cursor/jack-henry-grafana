import { formatSQL } from './formatSQL';

describe('formatSQL', () => {
  it('preserves $__time macro without inserted whitespace', () => {
    const formatted = formatSQL('SELECT $__time FROM t');

    expect(formatted).toContain('$__time');
    expect(formatted).not.toMatch(/\$\s+__/);
    expect(formatted).not.toMatch(/\$__\s+time/);
  });

  it('collapses whitespace inside ${ var } macros', () => {
    const formatted = formatSQL('SELECT ${ var } FROM t');

    expect(formatted).toContain('${var}');
    expect(formatted).not.toContain('$ {');
    expect(formatted).not.toContain('${ var }');
  });

  it('formats surrounding SQL while keeping macros intact', () => {
    const formatted = formatSQL('select $__timeFilter(created_at), ${interval} from metrics');

    expect(formatted).toMatch(/SELECT/i);
    expect(formatted).toContain('$__timeFilter(created_at)');
    expect(formatted).toContain('${interval}');
  });
});
