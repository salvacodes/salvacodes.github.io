import { POST_SLUG_PARAM, WRITINGS_APP_ID } from '../../routing/post-route'
import { homeDirectory } from './home-directory'

export interface ShellResult {
  lines: string[]
  clearScreen: boolean
  openAppId?: string
  openParams?: Record<string, string>
}

const WRITING_DIRECTORY = 'writing/'

interface ShellCommand {
  name: string
  description: string
  execute(args: string[]): ShellResult
}

const output = (...lines: string[]): ShellResult => ({ lines, clearScreen: false })

const describeCommand = (command: ShellCommand): string => `${command.name.padEnd(8)}${command.description}`

export class TerminalShell {
  #files: Record<string, string>
  #postSlugs: string[]

  constructor(files: Record<string, string> = homeDirectory, postSlugs: string[] = []) {
    this.#files = files
    this.#postSlugs = postSlugs
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
      name: 'resume',
      description: 'open the Resume++ app',
      execute: () => ({ lines: ['Opening Resume++…'], clearScreen: false, openAppId: 'resume' })
    },
    {
      name: 'writing',
      description: 'open the Writings app, or one post',
      execute: (args) => this.#openWriting(args)
    },
    {
      name: 'blog',
      description: 'the same as writing',
      execute: (args) => this.#openWriting(args)
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
    return output([...names, WRITING_DIRECTORY].sort().join('  '))
  }

  #openWriting(args: string[]): ShellResult {
    const [slug] = args
    if (!slug) {
      return { lines: ['Opening Writings…'], clearScreen: false, openAppId: WRITINGS_APP_ID }
    }
    if (!this.#postSlugs.includes(slug)) {
      return output(
        `writing: ${slug}: no such post`,
        ...(this.#postSlugs.length === 0 ? ['Nothing published yet.'] : ['Published posts:', ...this.#postSlugs])
      )
    }
    return {
      lines: [`Opening ${slug}…`],
      clearScreen: false,
      openAppId: WRITINGS_APP_ID,
      openParams: { [POST_SLUG_PARAM]: slug }
    }
  }

  #readFile(args: string[]): ShellResult {
    const name = args[0]
    if (!name) {
      return output('cat: missing file operand')
    }
    if (name === WRITING_DIRECTORY) {
      return output(`cat: ${name}: Is a directory`)
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
