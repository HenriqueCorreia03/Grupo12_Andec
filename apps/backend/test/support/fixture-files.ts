import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Nome do ficheiro CSV → conteúdo exato (bytes incluídos: BOM, CRLF). */
export type FixtureFiles = Record<string, string>;

/** Linhas no formato do CO, do PW e do Product originais: BOM e CRLF. */
export const crlf = (lines: string[]): string => '\uFEFF' + lines.join('\r\n') + '\r\n';

/** Linhas no formato do Storage_Location original: sem BOM, LF. */
export const lf = (lines: string[]): string => lines.join('\n') + '\n';

/** Escreve os CSV de uma fixture numa pasta temporária nova e devolve o caminho. */
export async function writeFixture(files: FixtureFiles): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'andec-fixture-'));
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(dir, name), content, 'utf8');
  }
  return dir;
}

export async function removeFixture(dir: string | undefined): Promise<void> {
  if (dir) await rm(dir, { recursive: true, force: true });
}
