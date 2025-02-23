// @ts-check
const { deepEqual, throws } = require("node:assert/strict");
const { test } = require("node:test");
const os = require("node:os");
const path = require("node:path");

const {
  execFile,
  execFileSync,
  getBatSpawnArgs,
  getSpawnArgs,
  spawn,
  spawnSync,
} = require("..");

/**
 *
 * @param {string[]} args
 * @param {string | false} [extension]
 */
async function getArgs(args, extension = ".cmd") {
  const { stdout } = await execFile(
    path.join(__dirname, "forward-args"),
    extension,
    args
  );
  return stdout.replace(/\r\n/g, "\n").split("\n").slice(0, -1);
}

test("execFileSync", () => {
  const text = "hi";
  const out = execFileSync(path.join(__dirname, "forward-args"), false, ["hi"]);
  deepEqual(out.toString(), text + os.EOL);
});

test("spawn", () => {
  const text = "hi";
  const child = spawn(path.join(__dirname, "forward-args"), false, ["hi"]);
  child.stdout.on("data", (data) => deepEqual(data.toString(), text + os.EOL));
});

test("spawnSync", () => {
  const text = "hi";
  const out = spawnSync(path.join(__dirname, "forward-args"), false, ["hi"]);
  deepEqual(out.stdout.toString(), text + os.EOL);
});

test("command", () => {
  deepEqual(getSpawnArgs("test.bat"), [
    "cmd.exe",
    ["/E:ON", "/F:OFF", "/V:OFF", "/d", "/s", "/c", '""test.bat""'],
    { shell: false, windowsVerbatimArguments: true },
  ]);
});

test("command and args", () => {
  deepEqual(getSpawnArgs("test.bat", ["1"]), [
    "cmd.exe",
    ["/E:ON", "/F:OFF", "/V:OFF", "/d", "/s", "/c", '""test.bat" "1""'],
    { shell: false, windowsVerbatimArguments: true },
  ]);
});

test("command and options", () => {
  deepEqual(getSpawnArgs("test.bat", { argv0: "foo" }), [
    "cmd.exe",
    ["/E:ON", "/F:OFF", "/V:OFF", "/d", "/s", "/c", '""test.bat""'],
    { argv0: "foo", shell: false, windowsVerbatimArguments: true },
  ]);
});

test("command, args and options", () => {
  deepEqual(getSpawnArgs("test.bat", ["testing"], { argv0: "foo" }), [
    "cmd.exe",
    ["/E:ON", "/F:OFF", "/V:OFF", "/d", "/s", "/c", '""test.bat" "testing""'],
    { argv0: "foo", shell: false, windowsVerbatimArguments: true },
  ]);
});

test("reject shell option", () => {
  throws(() => getSpawnArgs('".bat', { shell: true }));
});

test("reject windowsVerbatimArguments option", () => {
  throws(() => getSpawnArgs('".bat', { windowsVerbatimArguments: false }));
});

test("escape percent", async () => {
  const args = ["%path%", "%cd%"];
  deepEqual(await getArgs(args), args);
});

test("escape spaces", async () => {
  const args = ["hello  world", "are you here"];
  deepEqual(await getArgs(args), args);
});

test("escape backslash", async () => {
  const args = ["hello \\ world", "\\ world"];
  deepEqual(await getArgs(args), args);
});

test("escape quote", async () => {
  const args = ['hello " there', 'my " world'];
  deepEqual(await getArgs(args), args);
});

test("escape backslash quote", async () => {
  const args = ['hello \\" there', 'my \\" world'];
  deepEqual(await getArgs(args), args);
});

test("escape double backslash quote", async () => {
  const args = ['hello \\\\" there', 'my \\\\" world'];
  deepEqual(await getArgs(args), args);
});

test("escape ampersand", async () => {
  const args = ["&calc"];
  deepEqual(await getArgs(args), args);
});

test("escape quote ampersand", async () => {
  const args = ['"&calc'];
  deepEqual(await getArgs(args), args);
});

test("microsoft examples", async () => {
  // https://learn.microsoft.com/en-us/cpp/c-language/parsing-c-command-line-arguments
  const examples = [
    ["a b c", "d", "e"],
    ['ab"c', "\\", "d"],
    ["a\\\\\\b", "de fg", "h"],
    ['a\\"b', "c", "d"],
    ["a\\\\b c", "d", "e"],
    ['ab" c d'],
  ];
  for (const args of examples) deepEqual(await getArgs(args), args);
});

test("rust cases", async () => {
  // https://github.com/rust-lang/rust/blob/master/tests/ui/std/windows-bat-args.rs
  const examples = [
    ["a", "b"],
    ["c is for cat", "d is for dog"],
    ['"', ' "'],
    ["\\", "\\"],
    [">file.txt"],
    ["whoami.exe"],
    ["&a.exe"],
    ["&echo hello "],
    ["&echo hello", "&whoami", ">file.txt"],
    ["!TMP!"],
    ["key=value"],
    ['"key=value"'],
    ["key = value"],
    ['key=["value"],'],
    ["", "a=b"],
    ['key="foo bar"'],
    ['key=["my_value],'],
    ['key=["my_value","other-value"],'],
    ["key\\=value"],
    ['key="&whoami"'],
    ['key="value"=5'],
    ['key=[">file.txt"],'],
    ["%hello"],
    ["%PATH%"],
    ["%%cd:~,%"],
    ["%PATH%PATH%"],
    ['">file.txt'],
    ['abc"&echo hello'],
    ['123">file.txt'],
    ['"&echo hello&whoami.exe'],
    ['"hello^"world"', "hello &echo oh no >file.txt"],
  ];
  for (const args of examples) deepEqual(await getArgs(args), args);
});

test("getBatSpawnArgs", () => {
  getBatSpawnArgs("test.bat", [], {}),
    [
      "cmd.exe",
      ["/E:ON", "/F:OFF", "/V:OFF", "/d", "/s", "/c", '""test.bat""'],
      { shell: false, windowsVerbatimArguments: true },
    ];
});

test("reject quote in command", () => {
  throws(() => getBatSpawnArgs('".bat', [], {}));
});

test("reject null", () => {
  throws(() => getBatSpawnArgs("test.bat", ["\0"], {}));
});

test("reject carriage return", () => {
  throws(() => getBatSpawnArgs("test.bat", ["\r"], {}));
});

test("reject newline", () => {
  throws(() => getBatSpawnArgs("test.bat", ["\n"], {}));
});

if (process.platform == "win32") {
  test("command and extension", () => {
    deepEqual(getSpawnArgs("test", ".bat"), [
      "cmd.exe",
      ["/E:ON", "/F:OFF", "/V:OFF", "/d", "/s", "/c", '""test.bat""'],
      { shell: false, windowsVerbatimArguments: true },
    ]);
  });

  test("command, extension and args", () => {
    deepEqual(getSpawnArgs("test", ".bat", ["1"]), [
      "cmd.exe",
      ["/E:ON", "/F:OFF", "/V:OFF", "/d", "/s", "/c", '""test.bat" "1""'],
      { shell: false, windowsVerbatimArguments: true },
    ]);
  });

  test("command, extension and options", () => {
    deepEqual(getSpawnArgs("test", ".bat", { argv0: "foo" }), [
      "cmd.exe",
      ["/E:ON", "/F:OFF", "/V:OFF", "/d", "/s", "/c", '""test.bat""'],
      { argv0: "foo", shell: false, windowsVerbatimArguments: true },
    ]);
  });

  test("command, extension, args and options", () => {
    deepEqual(getSpawnArgs("test", ".bat", ["testing"], { argv0: "foo" }), [
      "cmd.exe",
      ["/E:ON", "/F:OFF", "/V:OFF", "/d", "/s", "/c", '""test.bat" "testing""'],
      { argv0: "foo", shell: false, windowsVerbatimArguments: true },
    ]);
  });

  test("command and no extension", async () => {
    const args = ["hello world"];
    deepEqual(await getArgs(args, false), args);
  });
}
