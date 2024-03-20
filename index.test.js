const { promisify } = require('util');
const exec = promisify(require('child_process').exec);


describe('MyCli', () => {
        test('exec with wrong flag', async() => {
            expect(async() => (await exec('mycli ./successfulFile.md -f test'))
                .toThrow(`option '-f, --format [value]' argument 'test' is invalid. Allowed choices are html, ansi.`)
            )
        })
        test('incorrect file', async() => {
            expect(async() => (await exec('mycli ./successfulF2ile.md'))
                .toThrow(`The file cannot be found.\nMake sure it's in '.md' format and you've specified the correct`)
            )
        });
        test('incorrect format', async() => {
            expect(async() => (await exec('mycli ./wrongFormatedFile.md'))
                .toThrow(`An error occurred in the markdown syntax.\nDouble tag is provided(inside of [ ** ])`)
            )
        });
        test('correct way', async() => {
            expect(async() => (await exec('mycli ./successfulFile.md'))
                .not.toThrow()
            )
        });
    }
);
