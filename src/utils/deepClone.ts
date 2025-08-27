// Safe deep clone using JSON serialization with custom Date handling
export const deepClone = <T>(value: T): T => {
  if (value === null || typeof value !== 'object') {
    return value
  }

  // For Date objects, create a new Date with the same time
  if (value instanceof Date) {
    const clonedDate = new Date(value.getTime())
    // Use Object.assign to maintain type safety
    return Object.assign(Object.create(Object.getPrototypeOf(value)), { ...clonedDate })
  }

  // For arrays, map through and clone each item
  if (Array.isArray(value)) {
    const clonedArray = value.map(item => deepClone(item))
    return Object.assign(Object.create(Object.getPrototypeOf(value)), clonedArray)
  }

  // For plain objects, clone properties
  if (typeof value === 'object' && value.constructor === Object) {
    const cloned = Object.create(Object.getPrototypeOf(value))
    for (const [key, val] of Object.entries(value)) {
      cloned[key] = deepClone(val)
    }
    return cloned
  }

  // For other object types, return the original value
  // This preserves object identity for complex objects that shouldn't be cloned
  return value
}
