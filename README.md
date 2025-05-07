# batspawn

Batspawn lets you run programs using the same interface as the `child_process`
module with the additional ability to run `.bat` and `.cmd` scripts on Windows.

Node.js disallows running `.bat` or `.cmd` scripts on Windows unless the
`shell` option is enabled, which is not recommended and can introduce
[numerous vulnerabilities](https://flatt.tech/research/posts/batbadbut-you-cant-securely-execute-commands-on-windows/).
Batspawn incorporates the necessary validation and escaping of arguments as well
as the correct `cmd` invocation to use to be able to do so safely, without
having to enable the `shell` option.

If the given command does not end with `.bat` or `.cmd`, the functions provided
by the module behave identically to the ones in `child_process`. Since
executable scripts on non-Windows platforms typically have no extension while
the equivalent ones on Windows do, an additional `extension` argument is
provided which is appended to the given command only when running on Windows. It
can also be set to `false` to let `cmd` determine the appropriate extension
based on the user's environment.

## Install

    npm install batspawn

## Usage

```javascript
// Same functions as child_process
import { execFile, execFileSync, spawn, spawnSync } from "batspawn";

// Run `foo "hello world"`
const { stdout } = await execFile("foo", false, ["hello world"]);

// Run `foo.cmd "hello world"` on Windows, `foo "hello world"` elsewhere
const { stdout } = await execFile("foo", ".cmd", ["hello world"]);

// Run `foo.exe "hello world"` on Windows, `foo "hello world"` elsewhere
const { stdout } = await execFile("foo", ["hello world"]);
```

## Implementation

The above example is equivalent to the following:

```javascript
import * as childProcess from "node:child_process";
import { promisify } from "node:util";

import { getBatSpawnArgs } from "batspawn";

const execFile = promisify(childProcess.execFile);

const isWindows = process.platform == "win32";

const command = "foo" + (isWindows ? ".cmd" : "");
const args = ["hello world"];
const options = {};

const { stdout } = await execFile(
  ...(command.endsWith(".bat") || command.endsWith(".cmd")
    ? getBatSpawnArgs(command, args, options)
    : [command, args, options])
);
```
