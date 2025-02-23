# batspawn

Node.js disallows spawning `.bat` or `.cmd` programs on Windows unless the
`shell` option is true, which is not recommended and can introduce
[numerous vulnerabilities](https://flatt.tech/research/posts/batbadbut-you-cant-securely-execute-commands-on-windows/).

This module lets you call spawn/execFile safely with Windows batch files by
validating and escaping all arguments provided, and providing the correct
`cmd` invocation to use.

If the given command does not end with `.bat` or `.cmd`, no modification is done
to the provided arguments. This lets you use the library in a cross-platform
manner.

## Install

    npm install batspawn

## Usage

```javascript
import { execFile } from "batspawn";

// .bat extension is appended and program is run via cmd on Windows
const { stdout } = await execFile("foo", ".bat", ["hello world"]);

// .exe program is run on Windows (same as child_process)
const { stdout } = await execFile("foo", ["hello world"]);

// program is run via cmd on Windows based on PATHEXT environment variable
// not recommended unless the extension is unknown
const { stdout } = await execFile("foo", false, ["hello world"]);
```

## Implementation

The above example is equivalent to the following:

```javascript
import * as childProcess from "node:child_process";
import { promisify } from "node:util";

import { getBatSpawnArgs } from "batspawn";

const execFile = promisify(childProcess.execFile);

const isWindows = process.platform == "win32";

const command = "foo" + (isWindows ? ".bat" : "");
const args = ["hello world"];
const options = {};

const { stdout } = await execFile(
  ...(command.endsWith(".bat") || command.endsWith(".cmd")
    ? getBatSpawnArgs(command, args, options)
    : [command, args, options])
);
```
