import { homeDirectory } from './home-directory'

export interface ShellResult {
  lines: string[]
  clearScreen: boolean
}

interface ShellCommand {
  name: string
  description: string
  execute(args: string[]): ShellResult
}

const output = (...lines: string[]): ShellResult => ({ lines, clearScreen: false })

const describeCommand = (command: ShellCommand): string => `${command.name.padEnd(8)}${command.description}`

export class TerminalShell {
  #files: Record<string, string>

  constructor(files: Record<string, string> = homeDirectory) {
    this.#files = files
  }

  #commands: ShellCommand[] = [
    {
      name: 'help',
      description: 'list available commands',
      execute: () => output(...this.#commands.map(describeCommand))
    },
    {
      name: 'whoami',
      description: 'who is behind this desktop',
      execute: () => output('Salva — cyber security engineering lead')
    },
    {
      name: 'echo',
      description: 'print text back',
      execute: (args) => output(args.join(' '))
    },
    {
      name: 'ls',
      description: 'list files in the home directory',
      execute: () => this.#listHomeFiles()
    },
    {
      name: 'cat',
      description: 'print a file',
      execute: (args) => this.#readFile(args)
    },
    {
      name: 'sudo',
      description: 'try it and see',
      execute: () => output('user is not in the sudoers file. This incident will be reported.')
    },
    {
      name: 'clear',
      description: 'clear the terminal screen',
      execute: () => ({ lines: [], clearScreen: true })
    }
  ]

  #listHomeFiles(): ShellResult {
    const names = Object.keys(this.#files).filter((name) => !name.startsWith('/'))
    return output(names.sort().join('  '))
  }

  #readFile(args: string[]): ShellResult {
    const name = args[0]
    if (!name) {
      return output('cat: missing file operand')
    }
    const content = this.#files[name]
    if (content === undefined) {
      return output(`cat: ${name}: No such file or directory`)
    }
    return { lines: content.split('\n'), clearScreen: false }
  }

  run(line: string): ShellResult {
    const [name, ...args] = line.trim().split(/\s+/).filter(Boolean)
    if (!name) {
      return output()
    }
    const command = this.#commands.find((candidate) => candidate.name === name)
    if (!command) {
      return output(`bash: ${name}: command not found`)
    }
    return command.execute(args)
  }
}
