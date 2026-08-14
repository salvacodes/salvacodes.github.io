import { describe, expect, it } from 'vitest'
import { resumeContent } from '../resume/resume-content'
import { TerminalShell } from './terminal-shell'

const shell = () => new TerminalShell()

describe('running input lines', () => {
  it('echo prints its arguments joined by single spaces', () => {
    expect(shell().run('echo hello   world').lines).toEqual(['hello world'])
  })

  it('empty input produces no output', () => {
    expect(shell().run('   ')).toEqual({ lines: [], clearScreen: false })
  })

  it('unknown commands fail like bash', () => {
    expect(shell().run('rm -rf /').lines).toEqual(['bash: rm: command not found'])
  })

  it('ignores surrounding whitespace around the command', () => {
    expect(shell().run('  echo hi  ').lines).toEqual(['hi'])
  })
})

describe('identity and system commands', () => {
  it('whoami introduces Salva', () => {
    expect(shell().run('whoami').lines).toEqual([`Salva — ${resumeContent.profile.headline}`])
  })

  it('sudo denies politely', () => {
    expect(shell().run('sudo apt update').lines).toEqual([
      'user is not in the sudoers file. This incident will be reported.'
    ])
  })

  it('clear signals the screen wipe and prints nothing', () => {
    expect(shell().run('clear')).toEqual({ lines: [], clearScreen: true })
  })

  it('help lists every command with its description', () => {
    const lines = shell().run('help').lines
    expect(lines).toContain('help    list available commands')
    expect(lines).toContain('echo    print text back')
    expect(lines).toContain('whoami  who is behind this desktop')
    expect(lines).toContain('clear   clear the terminal screen')
  })
})

describe('the home directory', () => {
  it('ls lists home files but hides system paths', () => {
    expect(shell().run('ls').lines).toEqual(['about.txt  resume.txt  writing/'])
  })

  it('cat prints a file line by line', () => {
    const files = { 'notes.txt': 'first\nsecond' }
    expect(new TerminalShell(files).run('cat notes.txt').lines).toEqual(['first', 'second'])
  })

  it('cat /etc/motd greets the visitor', () => {
    expect(shell().run('cat /etc/motd').lines).toEqual([
      'Welcome to salva.codes — a zero-dependency desktop in your browser.',
      'Open apps from the dock below or the Activities overview.'
    ])
  })

  it('cat without a file complains', () => {
    expect(shell().run('cat').lines).toEqual(['cat: missing file operand'])
  })

  it('cat of a missing file fails like bash', () => {
    expect(shell().run('cat secrets.txt').lines).toEqual(['cat: secrets.txt: No such file or directory'])
  })
})

describe('resume command', () => {
  it('asks the desktop to open the resume app', () => {
    const shell = new TerminalShell()
    const result = shell.run('resume')
    expect(result.openAppId).toBe('resume')
    expect(result.lines.join(' ')).toContain('Resume++')
  })

  it('leaves other commands without an app request', () => {
    const shell = new TerminalShell()
    expect(shell.run('whoami').openAppId).toBeUndefined()
  })

  it('lists resume in help', () => {
    const shell = new TerminalShell()
    expect(shell.run('help').lines.join('\n')).toContain('resume')
  })
})

describe('writing command', () => {
  const writingShell = () => new TerminalShell(undefined, ['how-this-site-is-built', 'another-post'])

  it('asks the desktop to open the writings app', () => {
    const result = writingShell().run('writing')

    expect(result.openAppId).toBe('writings')
    expect(result.openParams).toBeUndefined()
  })

  it('opens a post by slug', () => {
    const result = writingShell().run('writing another-post')

    expect(result.openAppId).toBe('writings')
    expect(result.openParams).toEqual({ 'post-slug': 'another-post' })
  })

  it('answers to blog as well', () => {
    expect(writingShell().run('blog').openAppId).toBe('writings')
  })

  it('lists what it knows when the slug is unknown', () => {
    const result = writingShell().run('writing no-such-post')

    expect(result.openAppId).toBeUndefined()
    expect(result.lines.join('\n')).toContain('no-such-post')
    expect(result.lines.join('\n')).toContain('how-this-site-is-built')
  })

  it('says so when nothing is published', () => {
    const result = new TerminalShell().run('writing no-such-post')

    expect(result.lines.join('\n')).toMatch(/nothing published/i)
  })

  it('lists writing in help', () => {
    expect(writingShell().run('help').lines.join('\n')).toContain('writing')
  })
})

describe('the writing directory', () => {
  it('shows up in ls', () => {
    expect(new TerminalShell().run('ls').lines.join(' ')).toContain('writing/')
  })

  it('cannot be read with cat', () => {
    expect(new TerminalShell().run('cat writing/').lines).toEqual(['cat: writing/: Is a directory'])
  })
})
