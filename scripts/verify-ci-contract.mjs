import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const REQUIRED = [
    [ /pull_request:/, 'pull_request trigger' ],
    [ /branches:\s*\[\s*Dev\s*,\s*main\s*\]/, 'Dev and main pull-request branches' ],
    [ /node-version:\s*['"]?22['"]?/, 'Node.js 22' ],
    [ /run:\s*corepack enable/, 'Corepack activation' ],
    [ /corepack yarn install --immutable/, 'immutable Yarn dependency install' ],
    [ /run:\s*yarn knip --dependencies(?:\s|$)/m, 'dependency check' ],
    [ /run:\s*yarn test(?:\s|$)/m, 'test command' ],
    [ /run:\s*yarn compile(?:\s|$)/m, 'compile command' ],
    [ /run:\s*yarn build(?:\s|$)/m, 'build command' ]
];

export function verifyRendererCi(source)
{
    const missing = REQUIRED
        .filter(([ pattern ]) => !pattern.test(source))
        .map(([, label ]) => label);

    if(missing.length)
    {
        throw new Error(`missing required CI contract: ${missing.join(', ')}`);
    }
}

export async function main()
{
    const workflow = await readFile(path.resolve('.github/workflows/ci.yml'), 'utf8');
    verifyRendererCi(workflow);
    console.log('Renderer CI contract verified.');
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    main().catch(error =>
    {
        console.error(error.message);
        process.exitCode = 1;
    });
}
