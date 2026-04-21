import { describe, expect, it } from 'vitest'
import { parseFrontmatter, stripQuotes } from './frontmatter.js'

describe('parseFrontmatter', () => {
  it('parses valid frontmatter', () => {
    const content = `---
id: "CONCEPT--TEST"
phase: 1
status: "raw"
---

# Body

hello`
    const { frontmatter, body } = parseFrontmatter(content)
    expect(frontmatter.id).toBe('CONCEPT--TEST')
    expect(frontmatter.phase).toBe(1)
    expect(frontmatter.status).toBe('raw')
    expect(body.trim()).toContain('# Body')
  })

  it('returns empty frontmatter when absent', () => {
    const { frontmatter, body } = parseFrontmatter('no frontmatter here')
    expect(frontmatter).toEqual({})
    expect(body).toBe('no frontmatter here')
  })

  it('gracefully handles malformed YAML', () => {
    const content = `---
id: "bad
phase: not yaml::
---

body here`
    const { body } = parseFrontmatter(content)
    expect(body).toBeTruthy()
  })
})

describe('stripQuotes', () => {
  it('removes surrounding double quotes', () => {
    expect(stripQuotes('"hello"')).toBe('hello')
  })

  it('removes surrounding single quotes', () => {
    expect(stripQuotes("'hello'")).toBe('hello')
  })

  it('leaves unquoted strings alone', () => {
    expect(stripQuotes('hello')).toBe('hello')
  })

  it('coerces non-string to string', () => {
    expect(stripQuotes(42)).toBe('42')
    expect(stripQuotes(null)).toBe('')
    expect(stripQuotes(undefined)).toBe('')
  })
})
