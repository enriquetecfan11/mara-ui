class LocalStorageMock {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }
}

const storage = new LocalStorageMock()

Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  writable: true,
})

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: storage },
  writable: true,
})
