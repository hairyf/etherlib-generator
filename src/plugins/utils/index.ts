import { readFile, writeFile } from 'node:fs/promises'
import dedent from 'dedent'

export function getBannerContent({ name }: { name: string }): string {
  return dedent`
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // ${name}
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  `
}

export async function readCachedFile(key: string): Promise<any> {
  const cachedFile = await readFile(`.cache/${key}.json`, 'utf8').catch(() => 'null')
  const parsed = JSON.parse(cachedFile)
  if (!parsed)
    return undefined
  return parsed.timestamp > Date.now() ? parsed.content : undefined
}

export async function writeCachedFile(keyfile: string, content: any, timestamp = Date.now() + 1_800_000): Promise<void> {
  const parsed = JSON.parse(await readFile(`.cache/${keyfile}.json`, 'utf8').catch(() => 'null'))
  if (parsed && parsed.timestamp < Date.now())
    return
  await writeFile(`.cache/${keyfile}.json`, JSON.stringify({ content, timestamp }), 'utf8')
}
