const childProcess = require("node:child_process");
const util = require("node:util");

/**
 *
 * @param {string} arg
 */
function escapeCMDArg(arg) {
  if (/[\0\r\n]/.test(arg)) throw new Error("Invalid character in argument");
  return `"${arg
    .replace(/\\+(?="|$)/g, "$&$&")
    .replace(/"/g, '""')
    .replace(/%/g, "%%cd:~,%")}"`;
}

/**
 * @typedef {(
 * | childProcess.ExecFileOptions
 * | childProcess.SpawnOptions
 * | childProcess.ExecFileSyncOptions
 * | childProcess.SpawnSyncOptions
 * )} SpawnExecFileOptions
 */

/**
 *
 * @template {SpawnExecFileOptions | undefined} T
 * @param {string} command
 * @param {string[]} args
 * @param {T} options
 * @returns {[string, string[], T]}
 */
function getBatSpawnArgs(command, args, options) {
  if (/"/.test(command)) throw new Error("Invalid character in command");
  return [
    "cmd.exe",
    [
      "/E:ON",
      "/F:OFF",
      "/V:OFF",
      "/d",
      "/s",
      "/c",
      `"${[command, ...args].map(escapeCMDArg).join(" ")}"`,
    ],
    { ...options, shell: false, windowsVerbatimArguments: true },
  ];
}

/**
 *
 * @template {SpawnExecFileOptions} T
 * @param {(
 *  | [string]
 *  | [string, T]
 *  | [string, string | false]
 *  | [string, string[]]
 *  | [string, string | false, T]
 *  | [string, string[], T]
 *  | [string, string | false, string[]]
 *  | [string, string | false, string[], T]
 * )} a
 * @returns {[string, string[], T | undefined]}
 */
function getSpawnArgs(...[command, extension, args, options]) {
  if (typeof extension != "string" && typeof extension != "boolean") {
    options = /** @type {T} */ (args);
    args = extension;
    extension = "";
  }

  if (!Array.isArray(args)) {
    options = args;
    args = [];
  }

  if (options?.shell != null) {
    throw new Error("shell option is not supported");
  }

  if (
    /** @type {childProcess.SpawnOptions} */ (options)
      ?.windowsVerbatimArguments != null
  ) {
    throw new Error("windowsVerbatimArguments option is not supported");
  }

  if (process.platform == "win32" && typeof extension != "boolean")
    command = `${command}${extension}`;

  return (process.platform == "win32" && extension == false) ||
    command.endsWith(".bat") ||
    command.endsWith(".cmd")
    ? getBatSpawnArgs(command, args, options)
    : [command, args, options];
}

const promisifiedExecFile = util.promisify(childProcess.execFile);

/**
 * @typedef {(
 * | childProcess.ExecFileOptionsWithBufferEncoding
 * | childProcess.ExecFileOptionsWithStringEncoding
 * | childProcess.ExecFileOptions
 * | undefined
 * )} ExecFileOptionsWithEncoding
 */
/**
 * @template {ExecFileOptionsWithEncoding} O
 * @typedef {(
 * O extends childProcess.ExecFileOptionsWithBufferEncoding
 * ? childProcess.PromiseWithChild<{
 *     stdout: Buffer;
 *     stderr: Buffer;
 *   }>
 * : O extends
 *     | childProcess.ExecFileOptionsWithStringEncoding
 *     | childProcess.ExecFileOptions
 *     | unknown
 * ? childProcess.PromiseWithChild<{
 *     stdout: string;
 *     stderr: string;
 *   }>
 * : childProcess.PromiseWithChild<{
 *     stdout: string | Buffer;
 *     stderr: string | Buffer;
 *   }>
 * )} ExecFileResult
 */
/**
 * @type {{
 * <T extends ExecFileOptionsWithEncoding = undefined>(command: string, options?: T): ExecFileResult<T>
 * <T extends ExecFileOptionsWithEncoding = undefined>(command: string, args?: string[], options?: T): ExecFileResult<T>
 * <T extends ExecFileOptionsWithEncoding = undefined>(command: string, extension?: string | false, options?: T): ExecFileResult<T>
 * <T extends ExecFileOptionsWithEncoding = undefined>(command: string, extension?: string | false, args?: string[], options?: T): ExecFileResult<T>
 * }}
 */
const execFile = function execFile(...args) {
  //@ts-expect-error ignore
  return promisifiedExecFile(...getSpawnArgs(...args));
};

/**
 * @template {childProcess.SpawnOptions | undefined} O
 * @typedef {(
 * O extends childProcess.SpawnOptionsWithStdioTuple<
 * infer A,
 * infer B,
 * infer C
 * >
 * ? (typeof childProcess)["spawn"] extends (
 *     c: string,
 *     o: childProcess.SpawnOptionsWithStdioTuple<A, B, C>
 *   ) => childProcess.ChildProcessByStdio<infer X, infer Y, infer Z>
 *   ? childProcess.ChildProcessByStdio<X, Y, Z>
 *   : childProcess.ChildProcess
 * : O extends childProcess.SpawnOptionsWithoutStdio | unknown
 * ? childProcess.ChildProcessWithoutNullStreams
 * : childProcess.ChildProcess
 * )} SpawnResult
 */
/**
 * @type {{
 * <T extends childProcess.SpawnOptions | undefined = undefined>(command: string, options?: T): SpawnResult<T>
 * <T extends childProcess.SpawnOptions | undefined = undefined>(command: string, args?: string[], options?: T): SpawnResult<T>
 * <T extends childProcess.SpawnOptions | undefined = undefined>(command: string, extension?: string | false, options?: T): SpawnResult<T>
 * <T extends childProcess.SpawnOptions | undefined = undefined>(command: string, extension?: string | false, args?: string[], options?: T): SpawnResult<T>
 * }}
 */
const spawn = function spawn(...args) {
  //@ts-expect-error ignore
  return childProcess.spawn(...getSpawnArgs(...args));
};

/**
 * @template {childProcess.ExecFileSyncOptions | undefined} O
 * @typedef {(
 * O extends childProcess.ExecFileSyncOptionsWithStringEncoding
 * ? string
 * : O extends childProcess.ExecFileSyncOptionsWithBufferEncoding | unknown
 * ? Buffer
 * : string | Buffer
 * )} ExecFileSyncResult
 */
/**
 * @type {{
 * <T extends childProcess.ExecFileSyncOptions | undefined = undefined>(command: string, options?: T): ExecFileSyncResult<T>
 * <T extends childProcess.ExecFileSyncOptions | undefined = undefined>(command: string, args?: string[], options?: T): ExecFileSyncResult<T>
 * <T extends childProcess.ExecFileSyncOptions | undefined = undefined>(command: string, extension?: string | false, options?: T): ExecFileSyncResult<T>
 * <T extends childProcess.ExecFileSyncOptions | undefined = undefined>(command: string, extension?: string | false, args?: string[], options?: T): ExecFileSyncResult<T>
 * }}
 */
const execFileSync = function execFileSync(...args) {
  //@ts-expect-error ignore
  return childProcess.execFileSync(...getSpawnArgs(...args));
};

/**
 * @template {childProcess.SpawnSyncOptions | undefined} O
 * @typedef {(
 * O extends childProcess.SpawnSyncOptionsWithStringEncoding
 * ? childProcess.SpawnSyncReturns<string>
 * : O extends childProcess.SpawnSyncOptionsWithBufferEncoding | unknown
 * ? childProcess.SpawnSyncReturns<Buffer>
 * : childProcess.SpawnSyncReturns<string | Buffer>
 * )} SpawnSyncResult
 */
/**
 * @type {{
 * <T extends childProcess.SpawnSyncOptions | undefined = undefined>(command: string, options?: T): SpawnSyncResult<T>
 * <T extends childProcess.SpawnSyncOptions | undefined = undefined>(command: string, args?: string[], options?: T): SpawnSyncResult<T>
 * <T extends childProcess.SpawnSyncOptions | undefined = undefined>(command: string, extension?: string | false, options?: T): SpawnSyncResult<T>
 * <T extends childProcess.SpawnSyncOptions | undefined = undefined>(command: string, extension?: string | false, args?: string[], options?: T): SpawnSyncResult<T>
 * }}
 */
const spawnSync = function spawnSync(...args) {
  //@ts-expect-error ignore
  return childProcess.spawnSync(...getSpawnArgs(...args));
};

module.exports.execFile = execFile;
module.exports.spawn = spawn;
module.exports.execFileSync = execFileSync;
module.exports.spawnSync = spawnSync;
module.exports.getBatSpawnArgs = getBatSpawnArgs;
module.exports.getSpawnArgs = getSpawnArgs;
