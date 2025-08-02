// Dexie (IndexedDB) mock
const { nanoid } = require('nanoid')

class MockTable {
  constructor(name) {
    this.name = name
    this.data = []
  }

  async add(item) {
    // If item already has an id, use it; otherwise generate one
    const itemToAdd = item.id ? item : { ...item, id: `${Date.now()}-${nanoid(10)}` }
    this.data.push(itemToAdd)
    return itemToAdd.id
  }

  async put(item) {
    const index = this.data.findIndex(d => d.id === item.id)
    if (index >= 0) {
      this.data[index] = item
    } else {
      this.data.push(item)
    }
    return item.id || Date.now()
  }

  async get(id) {
    return this.data.find(item => item.id === id)
  }

  async toArray() {
    return [...this.data]
  }

  async delete(id) {
    const index = this.data.findIndex(item => item.id === id)
    if (index >= 0) {
      this.data.splice(index, 1)
    }
  }

  where(field) {
    return {
      equals: (value) => ({
        first: async() => this.data.find(item => item[field] === value),
        toArray: async() => this.data.filter(item => item[field] === value),
        count: async() => this.data.filter(item => item[field] === value).length,
        delete: async() => {
          const toDelete = this.data.filter(item => item[field] === value)
          toDelete.forEach(item => {
            const index = this.data.indexOf(item)
            if (index > -1) {
              this.data.splice(index, 1)
            }
          })
          return toDelete.length
        }
      })
    }
  }

  async update(id, updates) {
    const item = await this.get(id)
    if (item) {
      Object.assign(item, updates)
      return 1
    }
    return 0
  }

  async bulkDelete(ids) {
    ids.forEach(id => {
      const index = this.data.findIndex(item => item.id === id)
      if (index >= 0) {
        this.data.splice(index, 1)
      }
    })
  }

  async count() {
    return this.data.length
  }
}

class MockDexie {
  constructor(dbName) {
    this.name = dbName
    this.tables = {}
    this.isOpen = false
  }

  version() {
    return {
      stores: (schema) => {
        Object.keys(schema).forEach(tableName => {
          this.tables[tableName] = new MockTable(tableName)
          this[tableName] = this.tables[tableName]
        })
        return this
      }
    }
  }

  async open() {
    this.isOpen = true
    return this
  }

  async close() {
    this.isOpen = false
  }

  async delete() {
    this.tables = {}
    this.isOpen = false
  }

  async transaction(mode, tables, fn) {
    try {
      return await fn()
    } catch (error) {
      throw error
    }
  }
}

module.exports = MockDexie
module.exports.default = MockDexie
