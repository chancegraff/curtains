import { z } from 'zod'
import {
  ElementTypeSchema,
  ContainerInterfaceSchema,
  ElementFactorySchema,
  TextElementSchema,
  HeadingElementSchema,
  ParagraphElementSchema,
  ListElementSchema,
  LinkElementSchema,
  ImageElementSchema,
  CodeElementSchema,
  TableElementSchema,
  ElementPropsSchema,
  HTMLVisitorSchema,
  NestingValidatorSchema,
  ContainerTransformerSchema,
  ContainerValidationResultSchema,
  NestingRulesSchema,
  ContainerQuerySchema,
  ContainerStatsSchema,
} from '../schemas/containers'

// Infer types from Zod schemas - no type casting
type ElementType = z.infer<typeof ElementTypeSchema>
type ContainerInterface = z.infer<typeof ContainerInterfaceSchema>
type ElementFactory = z.infer<typeof ElementFactorySchema>
type ElementProps = z.infer<typeof ElementPropsSchema>
type HTMLVisitor = z.infer<typeof HTMLVisitorSchema>
type NestingValidator = z.infer<typeof NestingValidatorSchema>
type ContainerTransformer = z.infer<typeof ContainerTransformerSchema>
type ContainerValidationResult = z.infer<typeof ContainerValidationResultSchema>
type NestingRules = z.infer<typeof NestingRulesSchema>
type ContainerQuery = z.infer<typeof ContainerQuerySchema>
type ContainerStats = z.infer<typeof ContainerStatsSchema>

// Type-safe property accessors
const getStringProp = (props: ElementProps, key: string, defaultValue: string = ''): string => {
  const value = props[key]
  return typeof value === 'string' ? value : defaultValue
}

const getBooleanProp = (props: ElementProps, key: string, defaultValue: boolean = false): boolean => {
  const value = props[key]
  return typeof value === 'boolean' ? value : defaultValue
}

const getNumberProp = (props: ElementProps, key: string, defaultValue: number = 0): number => {
  const value = props[key]
  return typeof value === 'number' ? value : defaultValue
}

const getArrayProp = <T>(props: ElementProps, key: string, defaultValue: T[] = []): T[] => {
  const value = props[key]
  return Array.isArray(value) ? value : defaultValue
}

const getOptionalStringProp = (props: ElementProps, key: string): string | undefined => {
  const value = props[key]
  return typeof value === 'string' && value !== '' ? value : undefined
}

// Validation helpers using Zod parse
const validateElementProps = (props: unknown): ElementProps => {
  return ElementPropsSchema.parse(props ?? {})
}

const validateElementType = (type: unknown): ElementType => {
  return ElementTypeSchema.parse(type)
}

// HTML escaping utility
const escapeHtml = (text: string): string => {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => escapeMap[char] ?? char)
}

// Helper to render children safely
const renderChildren = (children: unknown[]): string => {
  return children
    .map(child => {
      if (child &&
          typeof child === 'object' &&
          'render' in child &&
          typeof child.render === 'function') {
        try {
          return String(child.render())
        } catch {
          return ''
        }
      }
      return ''
    })
    .join('')
}

// Helper to clone children safely
const cloneChildren = (children: unknown[]): unknown[] => {
  return children.map(child => {
    if (child &&
        typeof child === 'object' &&
        'clone' in child &&
        typeof child.clone === 'function') {
      try {
        return child.clone()
      } catch {
        return child
      }
    }
    return child
  })
}

// Text Element Factory
const createTextElement = (props: unknown): unknown => {
  const validatedProps = validateElementProps(props)

  const element = {
    type: 'text' as const,
    value: getStringProp(validatedProps, 'value', ''),
    bold: getBooleanProp(validatedProps, 'bold', false),
    italic: getBooleanProp(validatedProps, 'italic', false),

    render(): string {
      let text = escapeHtml(this.value)
      if (this.bold) text = `<strong>${text}</strong>`
      if (this.italic) text = `<em>${text}</em>`
      return text
    },

    clone(): unknown {
      return createTextElement({
        value: this.value,
        bold: this.bold,
        italic: this.italic
      })
    }
  }

  return TextElementSchema.parse(element)
}

// Heading Element Factory
const createHeadingElement = (props: unknown): unknown => {
  const validatedProps = validateElementProps(props)

  const element = {
    type: 'heading' as const,
    depth: Math.min(Math.max(getNumberProp(validatedProps, 'depth', 1), 1), 6),
    children: getArrayProp(validatedProps, 'children', []),

    render(): string {
      const content = renderChildren(this.children)
      return `<h${this.depth}>${content}</h${this.depth}>`
    },

    clone(): unknown {
      return createHeadingElement({
        depth: this.depth,
        children: cloneChildren(this.children)
      })
    }
  }

  return HeadingElementSchema.parse(element)
}

// Paragraph Element Factory
const createParagraphElement = (props: unknown): unknown => {
  const validatedProps = validateElementProps(props)

  const element = {
    type: 'paragraph' as const,
    children: getArrayProp(validatedProps, 'children', []),

    render(): string {
      const content = renderChildren(this.children)
      return `<p>${content}</p>`
    },

    clone(): unknown {
      return createParagraphElement({
        children: cloneChildren(this.children)
      })
    }
  }

  return ParagraphElementSchema.parse(element)
}

// List Element Factory
const createListElement = (props: unknown): unknown => {
  const validatedProps = validateElementProps(props)

  const element = {
    type: 'list' as const,
    ordered: getBooleanProp(validatedProps, 'ordered', false),
    children: getArrayProp(validatedProps, 'children', []),

    render(): string {
      const tag = this.ordered ? 'ol' : 'ul'
      const content = renderChildren(this.children)
      return `<${tag}>${content}</${tag}>`
    },

    clone(): unknown {
      return createListElement({
        ordered: this.ordered,
        children: cloneChildren(this.children)
      })
    }
  }

  return ListElementSchema.parse(element)
}

// Link Element Factory
const createLinkElement = (props: unknown): unknown => {
  const validatedProps = validateElementProps(props)

  const element = {
    type: 'link' as const,
    url: getStringProp(validatedProps, 'url', ''),
    title: getOptionalStringProp(validatedProps, 'title'),
    children: getArrayProp(validatedProps, 'children', []),

    render(): string {
      const titleAttr = (this.title !== null && this.title !== undefined && this.title !== '') ? ` title="${escapeHtml(this.title)}"` : ''
      const content = renderChildren(this.children)
      return `<a href="${escapeHtml(this.url)}"${titleAttr}>${content}</a>`
    },

    clone(): unknown {
      return createLinkElement({
        url: this.url,
        title: this.title,
        children: cloneChildren(this.children)
      })
    }
  }

  return LinkElementSchema.parse(element)
}

// Image Element Factory
const createImageElement = (props: unknown): unknown => {
  const validatedProps = validateElementProps(props)

  const element = {
    type: 'image' as const,
    url: getStringProp(validatedProps, 'url', ''),
    alt: getStringProp(validatedProps, 'alt', ''),
    classes: getArrayProp<string>(validatedProps, 'classes', []),

    render(): string {
      const classAttr = this.classes.length > 0
        ? ` class="${this.classes.join(' ')}"`
        : ''
      return `<img src="${escapeHtml(this.url)}" alt="${escapeHtml(this.alt)}"${classAttr}>`
    },

    clone(): unknown {
      return createImageElement({
        url: this.url,
        alt: this.alt,
        classes: [...this.classes]
      })
    }
  }

  return ImageElementSchema.parse(element)
}

// Code Element Factory
const createCodeElement = (props: unknown): unknown => {
  const validatedProps = validateElementProps(props)

  const element = {
    type: 'code' as const,
    value: getStringProp(validatedProps, 'value', ''),
    language: getOptionalStringProp(validatedProps, 'language'),
    inline: getBooleanProp(validatedProps, 'inline', false),

    render(): string {
      const escapedValue = escapeHtml(this.value)
      if (this.inline) {
        return `<code>${escapedValue}</code>`
      }
      const langClass = (this.language !== null && this.language !== undefined && this.language !== '') ? ` class="language-${this.language}"` : ''
      return `<pre><code${langClass}>${escapedValue}</code></pre>`
    },

    clone(): unknown {
      return createCodeElement({
        value: this.value,
        language: this.language,
        inline: this.inline
      })
    }
  }

  return CodeElementSchema.parse(element)
}

// Table Element Factory
const createTableElement = (props: unknown): unknown => {
  const validatedProps = validateElementProps(props)

  const element = {
    type: 'table' as const,
    children: getArrayProp(validatedProps, 'children', []),

    render(): string {
      const content = renderChildren(this.children)
      return `<table>${content}</table>`
    },

    clone(): unknown {
      return createTableElement({
        children: cloneChildren(this.children)
      })
    }
  }

  return TableElementSchema.parse(element)
}

// Element Factory Registry
const createElementFactory = (): ElementFactory => {
  const elementTypes = new Map<string, Function>()

  // Register core element types
  const registerCoreElements = (): void => {
    elementTypes.set('text', createTextElement)
    elementTypes.set('heading', createHeadingElement)
    elementTypes.set('paragraph', createParagraphElement)
    elementTypes.set('list', createListElement)
    elementTypes.set('link', createLinkElement)
    elementTypes.set('image', createImageElement)
    elementTypes.set('code', createCodeElement)
    elementTypes.set('table', createTableElement)
  }

  const register = (type: string, factoryFunction: unknown): void => {
    if (typeof factoryFunction === 'function') {
      elementTypes.set(type, factoryFunction)
    }
  }

  const create = (type: string, props: unknown): unknown => {
    const validatedType = validateElementType(type)
    const factory = elementTypes.get(validatedType)

    if (factory) {
      return factory(props)
    }

    throw new Error(`Unknown element type: ${validatedType}`)
  }

  const getSupportedTypes = (): string[] => {
    return Array.from(elementTypes.keys())
  }

  // Initialize with core elements
  registerCoreElements()

  const factory: ElementFactory = {
    register,
    create,
    getSupportedTypes,
  }

  // Validate the complete factory against schema
  ElementFactorySchema.parse(factory)

  return factory
}

// Container Factory
const createContainer = (classes?: string[], children?: unknown[]): unknown => {
  const containerState = {
    type: 'container' as const,
    classes: classes ?? [],
    children: children ?? [],
    attributes: {} satisfies Record<string, string>,
  }

  const addChild = (element: unknown): boolean => {
    if (element && typeof element === 'object' && 'type' in element) {
      containerState.children.push(element)
      return true
    }
    return false
  }

  const removeChild = (element: unknown): boolean => {
    const index = containerState.children.indexOf(element)
    if (index !== -1) {
      containerState.children.splice(index, 1)
      return true
    }
    return false
  }

  const getChildren = (): unknown[] => {
    return [...containerState.children]
  }

  const hasClass = (className: string): boolean => {
    return containerState.classes.includes(className)
  }

  const addClass = (className: string): void => {
    if (!hasClass(className)) {
      containerState.classes.push(className)
    }
  }

  const getAttributes = (): Record<string, string> => {
    return { ...containerState.attributes }
  }

  const render = (): string => {
    const htmlParts: string[] = []

    // Build opening tag
    const classAttr = containerState.classes.length > 0
      ? ` class="${containerState.classes.join(' ')}"`
      : ''

    const attrPairs = Object.entries(containerState.attributes)
      .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
      .join(' ')
    const attrsStr = attrPairs ? ` ${attrPairs}` : ''

    htmlParts.push(`<div${classAttr}${attrsStr}>`)

    // Render children
    htmlParts.push(renderChildren(containerState.children))

    // Closing tag
    htmlParts.push('</div>')

    return htmlParts.join('')
  }

  const container: ContainerInterface = {
    type: 'container',
    classes: containerState.classes,
    children: containerState.children,
    attributes: containerState.attributes,
    addChild,
    removeChild,
    getChildren,
    hasClass,
    addClass,
    getAttributes,
    render,
  }

  // Validate the complete container against schema
  ContainerInterfaceSchema.parse(container)

  return container
}

// HTML Visitor Implementation
const createHTMLVisitor = (): HTMLVisitor => {
  const visitContainer = (container: unknown): string => {
    if (container &&
        typeof container === 'object' &&
        'render' in container &&
        typeof container.render === 'function') {
      try {
        return String(container.render())
      } catch {
        return ''
      }
    }
    return ''
  }

  const visitText = (text: unknown): string => {
    return visitContainer(text)
  }

  const visitHeading = (heading: unknown): string => {
    return visitContainer(heading)
  }

  const visitParagraph = (paragraph: unknown): string => {
    return visitContainer(paragraph)
  }

  const visitList = (list: unknown): string => {
    return visitContainer(list)
  }

  const visitImage = (image: unknown): string => {
    return visitContainer(image)
  }

  const visitCode = (code: unknown): string => {
    return visitContainer(code)
  }

  const visitTable = (table: unknown): string => {
    return visitContainer(table)
  }

  const visitor: HTMLVisitor = {
    visitContainer,
    visitText,
    visitHeading,
    visitParagraph,
    visitList,
    visitImage,
    visitCode,
    visitTable,
    escapeHtml,
    renderChildren,
  }

  // Validate the complete visitor against schema
  HTMLVisitorSchema.parse(visitor)

  return visitor
}

// Nesting Validator Implementation
const createNestingValidator = (): NestingValidator => {
  const maxDepth = 10
  const rules: NestingRules = {
    container: ['*'],
    paragraph: ['text', 'link', 'image', 'strong', 'em'],
    heading: ['text', 'link', 'strong', 'em'],
    list: ['listItem'],
    listItem: ['paragraph', 'text', 'link', 'list'],
    table: ['tableRow'],
    tableRow: ['tableCell'],
    tableCell: ['text', 'link', 'strong', 'em'],
    text: [],
    link: ['text', 'strong', 'em'],
    image: [],
    code: [],
    strong: ['text'],
    em: ['text'],
    blockquote: ['paragraph', 'text', 'heading', 'list'],
  }

  const validateNesting = (parentType: ElementType, childType: ElementType): boolean => {
    const allowedChildren = rules[parentType]
    if (!allowedChildren) {
      return false
    }

    if (allowedChildren.includes('*')) {
      return true
    }

    return allowedChildren.includes(childType)
  }

  const validateDepth = (container: unknown, currentDepth: number): boolean => {
    if (currentDepth > maxDepth) {
      return false
    }

    if (container &&
        typeof container === 'object' &&
        'children' in container &&
        Array.isArray(container.children)) {
      for (const child of container.children) {
        if (child &&
            typeof child === 'object' &&
            'type' in child &&
            typeof child.type === 'string' &&
            child.type === 'container') {
          if (!validateDepth(child, currentDepth + 1)) {
            return false
          }
        }
      }
    }

    return true
  }

  const validateStructure = (container: unknown): ContainerValidationResult => {
    const errors: string[] = []
    let maxDepthExceeded = false
    const invalidNesting: Array<{parentType: ElementType, childType: ElementType, path: string}> = []

    const checkContainer = (cont: unknown, depth: number, path: string): void => {
      // Check depth
      if (depth > maxDepth) {
        errors.push(`Max nesting depth exceeded at ${path}`)
        maxDepthExceeded = true
      }

      if (cont &&
          typeof cont === 'object' &&
          'type' in cont &&
          typeof cont.type === 'string' &&
          'children' in cont &&
          Array.isArray(cont.children)) {
        const parentType = cont.type
        const children = cont.children

        for (let index = 0; index < children.length; index++) {
          const child = children[index]
          const childPath = `${path}[${index}]`

          if (child &&
              typeof child === 'object' &&
              'type' in child &&
              typeof child.type === 'string') {
            const childType = child.type

            try {
              const validatedParentType = validateElementType(parentType)
              const validatedChildType = validateElementType(childType)

              if (!validateNesting(validatedParentType, validatedChildType)) {
                invalidNesting.push({
                  parentType: validatedParentType,
                  childType: validatedChildType,
                  path: childPath
                })
                errors.push(`Invalid child ${childType} in ${parentType} at ${childPath}`)
              }

              // Recurse for containers
              if (childType === 'container') {
                checkContainer(child, depth + 1, childPath)
              }
            } catch {
              errors.push(`Invalid element type at ${childPath}`)
            }
          }
        }
      }
    }

    checkContainer(container, 0, 'root')

    const result: ContainerValidationResult = {
      isValid: errors.length === 0,
      errors,
      maxDepthExceeded,
      invalidNesting,
    }

    return ContainerValidationResultSchema.parse(result)
  }

  const validator: NestingValidator = {
    maxDepth,
    rules,
    validateNesting,
    validateDepth,
    validateStructure,
  }

  // Validate the complete validator against schema
  NestingValidatorSchema.parse(validator)

  return validator
}

// Container Transformer Implementation
const createContainerTransformer = (): ContainerTransformer => {
  const transformers: unknown[] = []

  const addTransformer = (transformer: unknown): void => {
    transformers.push(transformer)
  }

  const transform = (container: unknown): unknown => {
    let result = container

    for (const transformer of transformers) {
      if (typeof transformer === 'function') {
        result = transformer(result)
      }
    }

    return result
  }

  const flattenSingleChild = (container: unknown): unknown => {
    if (container &&
        typeof container === 'object' &&
        'type' in container &&
        'children' in container &&
        'classes' in container &&
        typeof container.type === 'string' &&
        Array.isArray(container.children) &&
        Array.isArray(container.classes)) {

      if (container.type === 'container' &&
          container.children.length === 1 &&
          container.classes.length === 0) {
        return container.children[0]
      }

      // Recursively transform children
      const transformedChildren = container.children.map(child => {
        if (child &&
            typeof child === 'object' &&
            'type' in child &&
            typeof child.type === 'string' &&
            child.type === 'container') {
          return flattenSingleChild(child)
        }
        return child
      })

      return {
        ...container,
        children: transformedChildren
      }
    }

    return container
  }

  const mergeText = (container: unknown): unknown => {
    if (container &&
        typeof container === 'object' &&
        'children' in container &&
        Array.isArray(container.children)) {
      const mergedChildren: unknown[] = []
      let currentTextElement: unknown = null
      let pendingTextValue = ''

      for (const child of container.children) {
        if (child &&
            typeof child === 'object' &&
            'type' in child &&
            'value' in child &&
            typeof child.type === 'string' &&
            typeof child.value === 'string') {
          if (child.type === 'text') {
            if (currentTextElement !== null) {
              // We already have a text element, merge values
              pendingTextValue += child.value
            } else {
              // This is the first text element we've encountered
              currentTextElement = child
              pendingTextValue = child.value
            }
          } else {
            // Non-text element, push any pending text first
            if (currentTextElement !== null) {
              if (currentTextElement &&
                  typeof currentTextElement === 'object' &&
                  'value' in currentTextElement &&
                  typeof currentTextElement.value === 'string' &&
                  pendingTextValue !== currentTextElement.value) {
                // Text was actually merged, create new merged element
                mergedChildren.push({
                  type: 'text',
                  value: pendingTextValue
                })
              } else {
                // Text was not merged, preserve original element
                mergedChildren.push(currentTextElement)
              }
              currentTextElement = null
              pendingTextValue = ''
            }
            mergedChildren.push(child)
          }
        } else {
          // Invalid element, push any pending text first
          if (currentTextElement !== null) {
            if (currentTextElement &&
                typeof currentTextElement === 'object' &&
                'value' in currentTextElement &&
                typeof currentTextElement.value === 'string' &&
                pendingTextValue !== currentTextElement.value) {
              // Text was actually merged, create new merged element
              mergedChildren.push({
                type: 'text',
                value: pendingTextValue
              })
            } else {
              // Text was not merged, preserve original element
              mergedChildren.push(currentTextElement)
            }
            currentTextElement = null
            pendingTextValue = ''
          }
          mergedChildren.push(child)
        }
      }

      // Handle any remaining text element
      if (currentTextElement !== null) {
        if (currentTextElement &&
            typeof currentTextElement === 'object' &&
            'value' in currentTextElement &&
            typeof currentTextElement.value === 'string' &&
            pendingTextValue !== currentTextElement.value) {
          // Text was actually merged, create new merged element
          mergedChildren.push({
            type: 'text',
            value: pendingTextValue
          })
        } else {
          // Text was not merged, preserve original element
          mergedChildren.push(currentTextElement)
        }
      }

      return { ...container, children: mergedChildren }
    }

    return container
  }

  const applyClasses = (container: unknown, _classMap: unknown): unknown => {
    // Class application logic would be implemented here
    // For now, return container unchanged
    return container
  }

  const transformer: ContainerTransformer = {
    transformers,
    addTransformer,
    transform,
    flattenSingleChild,
    mergeText,
    applyClasses,
  }

  // Validate the complete transformer against schema
  ContainerTransformerSchema.parse(transformer)

  return transformer
}

// Container Query Implementation
const createContainerQuery = (): ContainerQuery => {
  const query = (root: unknown, selector: string): unknown[] => {
    const results: unknown[] = []

    const matchesSelector = (container: unknown, selectorParts: string[]): boolean => {
      if (!container || typeof container !== 'object') return false

      for (const part of selectorParts) {
        if (part.startsWith('.')) {
          // Class selector
          const className = part.substring(1)
          if ('hasClass' in container && typeof container.hasClass === 'function') {
            if (!container.hasClass(className)) {
              return false
            }
          }
        } else if ('type' in container && typeof container.type === 'string') {
          // Type selector
          if (part !== container.type) {
            return false
          }
        }
      }

      return true
    }

    const traverse = (container: unknown): void => {
      const selectorParts = selector.trim().split(/\s+/)

      if (matchesSelector(container, selectorParts)) {
        results.push(container)
      }

      if (container &&
          typeof container === 'object' &&
          'children' in container &&
          Array.isArray(container.children)) {
        for (const child of container.children) {
          if (child &&
              typeof child === 'object' &&
              'type' in child &&
              typeof child.type === 'string' &&
              child.type === 'container') {
            traverse(child)
          }
        }
      }
    }

    traverse(root)
    return results
  }

  const findByClass = (root: unknown, className: string): unknown[] => {
    return query(root, `.${className}`)
  }

  const findByType = (root: unknown, type: string): unknown[] => {
    const results: unknown[] = []

    const traverse = (element: unknown): void => {
      if (element &&
          typeof element === 'object' &&
          'type' in element &&
          typeof element.type === 'string' &&
          element.type === type) {
        results.push(element)
      }

      if (element &&
          typeof element === 'object' &&
          'children' in element &&
          Array.isArray(element.children)) {
        for (const child of element.children) {
          traverse(child)
        }
      }
    }

    traverse(root)
    return results
  }

  const getStats = (root: unknown): ContainerStats => {
    const stats: ContainerStats = {
      totalContainers: 0,
      maxDepth: 0,
      classDistribution: {},
      elementCounts: {},
    }

    const analyze = (container: unknown, depth: number): void => {
      if (container &&
          typeof container === 'object' &&
          'type' in container &&
          typeof container.type === 'string') {
        const elementType = container.type

        if (elementType === 'container') {
          stats.totalContainers += 1
          stats.maxDepth = Math.max(stats.maxDepth, depth)

          if ('classes' in container && Array.isArray(container.classes)) {
            for (const className of container.classes) {
              if (typeof className === 'string') {
                stats.classDistribution[className] = (stats.classDistribution[className] ?? 0) + 1
              }
            }
          }
        }

        // Count element type
        stats.elementCounts[elementType] = (stats.elementCounts[elementType] ?? 0) + 1

        // Recurse
        if ('children' in container && Array.isArray(container.children)) {
          for (const child of container.children) {
            analyze(child, depth + 1)
          }
        }
      }
    }

    analyze(root, 0)
    return stats
  }

  const containerQuery: ContainerQuery = {
    query,
    findByClass,
    findByType,
    getStats,
  }

  // Validate the complete query system against schema
  ContainerQuerySchema.parse(containerQuery)

  return containerQuery
}

// Main Container Factory Export
export const createContainerFactory = (): {
  createContainer: typeof createContainer
  createElementFactory: typeof createElementFactory
  createHTMLVisitor: typeof createHTMLVisitor
  createNestingValidator: typeof createNestingValidator
  createContainerTransformer: typeof createContainerTransformer
  createContainerQuery: typeof createContainerQuery
} => {
  return {
    createContainer,
    createElementFactory,
    createHTMLVisitor,
    createNestingValidator,
    createContainerTransformer,
    createContainerQuery,
  }
}

// Export individual functions for direct use
export {
  createContainer,
  createElementFactory,
  createHTMLVisitor,
  createNestingValidator,
  createContainerTransformer,
  createContainerQuery,
}
