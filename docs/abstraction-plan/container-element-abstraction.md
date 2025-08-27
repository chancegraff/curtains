# Container-Element Abstraction

## Container Interface Definition

FUNCTION define_container_interface()
  INTERFACE IContainer
    METHOD add_child(element)
    METHOD remove_child(element)
    METHOD get_children()
    METHOD has_class(class_name)
    METHOD add_class(class_name)
    METHOD get_attributes()
    METHOD render()

## Element Interface Definition  

FUNCTION define_element_interface()
  INTERFACE IElement
    METHOD get_type()
    METHOD get_content()
    METHOD get_attributes()
    METHOD accept_visitor(visitor)
    METHOD clone()
    METHOD equals(other)

## Functional Container Factory

FUNCTION create_container(classes, children)
  LET container_state = {
    classes: classes || [],
    children: children || [],
    attributes: new Map()
  }
  
  FUNCTION add_child(element)
    IF validate_element(element) THEN
      ADD element to container_state.children
      RETURN true
    RETURN false
  
  FUNCTION remove_child(element)
    LET index = container_state.children.indexOf(element)
    IF index !== -1 THEN
      REMOVE element at index from container_state.children
      RETURN true
    RETURN false
  
  FUNCTION get_children()
    RETURN [...container_state.children]  // Return copy
  
  FUNCTION has_class(class_name)
    RETURN container_state.classes.includes(class_name)
  
  FUNCTION add_class(class_name)
    IF NOT has_class(class_name) THEN
      ADD class_name to container_state.classes
  
  FUNCTION render()
    LET html_parts = []
    
    // Build opening tag
    LET class_attr = container_state.classes.length > 0 
      ? ` class="${container_state.classes.join(' ')}"` 
      : ''
    
    ADD `<div${class_attr}>` to html_parts
    
    // Render children
    FOR each child in container_state.children DO
      IF child has render method THEN
        ADD child.render() to html_parts
      ELSE
        ADD convert_element_to_html(child) to html_parts
    
    // Closing tag
    ADD '</div>' to html_parts
    
    RETURN join html_parts
  
  RETURN {
    add_child: add_child,
    remove_child: remove_child,
    get_children: get_children,
    has_class: has_class,
    add_class: add_class,
    render: render,
    type: 'container'
  }

## Element Factory System

FUNCTION create_element_factory()
  LET element_types = new Map()
  
  // Register core element types
  FUNCTION register_core_elements()
    register_element('text', create_text_element)
    register_element('heading', create_heading_element)
    register_element('paragraph', create_paragraph_element)
    register_element('list', create_list_element)
    register_element('link', create_link_element)
    register_element('image', create_image_element)
    register_element('code', create_code_element)
    register_element('table', create_table_element)
  
  FUNCTION register_element(type, factory_function)
    SET element_types[type] = factory_function
  
  FUNCTION create_element(type, props)
    IF element_types has type THEN
      LET factory = element_types.get(type)
      RETURN factory(props)
    ELSE
      THROW Error(`Unknown element type: ${type}`)
  
  FUNCTION create_text_element(props)
    RETURN {
      type: 'text',
      value: props.value || '',
      bold: props.bold || false,
      italic: props.italic || false,
      
      render: FUNCTION()
        LET text = escape_html(this.value)
        IF this.bold THEN text = `<strong>${text}</strong>`
        IF this.italic THEN text = `<em>${text}</em>`
        RETURN text
      
      clone: FUNCTION()
        RETURN create_text_element({
          value: this.value,
          bold: this.bold,
          italic: this.italic
        })
    }
  
  FUNCTION create_heading_element(props)
    RETURN {
      type: 'heading',
      depth: props.depth || 1,
      children: props.children || [],
      
      render: FUNCTION()
        LET content = render_children(this.children)
        RETURN `<h${this.depth}>${content}</h${this.depth}>`
      
      clone: FUNCTION()
        RETURN create_heading_element({
          depth: this.depth,
          children: this.children.map(c => c.clone())
        })
    }
  
  FUNCTION create_image_element(props)
    RETURN {
      type: 'image',
      url: props.url || '',
      alt: props.alt || '',
      classes: props.classes || [],
      
      render: FUNCTION()
        LET class_attr = this.classes.length > 0
          ? ` class="${this.classes.join(' ')}"`
          : ''
        RETURN `<img src="${this.url}" alt="${this.alt}"${class_attr}>`
      
      clone: FUNCTION()
        RETURN create_image_element({
          url: this.url,
          alt: this.alt,
          classes: [...this.classes]
        })
    }
  
  // Initialize with core elements
  register_core_elements()
  
  RETURN {
    register: register_element,
    create: create_element
  }

## Container Visitor Pattern

FUNCTION create_visitor_system()
  INTERFACE IVisitor
    METHOD visit_container(container)
    METHOD visit_text(text_element)
    METHOD visit_heading(heading_element)
    METHOD visit_paragraph(paragraph_element)
    METHOD visit_list(list_element)
    METHOD visit_image(image_element)
    METHOD visit_code(code_element)
  
  FUNCTION create_html_visitor()
    RETURN {
      visit_container: FUNCTION(container)
        LET class_attr = container.classes.length > 0
          ? ` class="${container.classes.join(' ')}"`
          : ''
        
        LET children_html = container.children
          .map(child => child.accept(this))
          .join('')
        
        RETURN `<div${class_attr}>${children_html}</div>`
      
      visit_text: FUNCTION(text)
        LET value = escape_html(text.value)
        IF text.bold THEN value = `<strong>${value}</strong>`
        IF text.italic THEN value = `<em>${value}</em>`
        RETURN value
      
      visit_heading: FUNCTION(heading)
        LET content = heading.children
          .map(child => child.accept(this))
          .join('')
        RETURN `<h${heading.depth}>${content}</h${heading.depth}>`
      
      visit_image: FUNCTION(image)
        LET class_attr = image.classes.length > 0
          ? ` class="${image.classes.join(' ')}"`
          : ''
        RETURN `<img src="${image.url}" alt="${image.alt}"${class_attr}>`
    }

## Container Nesting Validator

FUNCTION create_nesting_validator()
  LET max_depth = 10
  LET nesting_rules = new Map()
  
  // Define nesting rules
  FUNCTION initialize_rules()
    // Containers can contain anything
    SET nesting_rules['container'] = ['*']
    
    // Paragraphs can contain inline elements
    SET nesting_rules['paragraph'] = ['text', 'link', 'image', 'strong', 'em']
    
    // Headings can contain inline elements
    SET nesting_rules['heading'] = ['text', 'link', 'strong', 'em']
    
    // Lists can contain list items
    SET nesting_rules['list'] = ['listItem']
    
    // List items can contain paragraphs and inline
    SET nesting_rules['listItem'] = ['paragraph', 'text', 'link', 'list']
    
    // Tables have specific structure
    SET nesting_rules['table'] = ['tableRow']
    SET nesting_rules['tableRow'] = ['tableCell']
    SET nesting_rules['tableCell'] = ['text', 'link', 'strong', 'em']
  
  FUNCTION validate_nesting(parent_type, child_type)
    IF NOT nesting_rules has parent_type THEN
      RETURN false
    
    LET allowed_children = nesting_rules.get(parent_type)
    
    IF allowed_children.includes('*') THEN
      RETURN true
    
    RETURN allowed_children.includes(child_type)
  
  FUNCTION validate_depth(container, current_depth)
    IF current_depth > max_depth THEN
      RETURN false
    
    FOR each child in container.children DO
      IF child.type === 'container' THEN
        IF NOT validate_depth(child, current_depth + 1) THEN
          RETURN false
    
    RETURN true
  
  FUNCTION validate_container_structure(container)
    LET validation_errors = []
    
    FUNCTION check_container(cont, depth, path)
      // Check depth
      IF depth > max_depth THEN
        ADD `Max nesting depth exceeded at ${path}` to validation_errors
      
      // Check child validity
      FOR each child, index in cont.children DO
        LET child_path = `${path}[${index}]`
        
        IF NOT validate_nesting(cont.type, child.type) THEN
          ADD `Invalid child ${child.type} in ${cont.type} at ${child_path}` to validation_errors
        
        // Recurse for containers
        IF child.type === 'container' THEN
          check_container(child, depth + 1, child_path)
    
    check_container(container, 0, 'root')
    
    RETURN {
      is_valid: validation_errors.length === 0,
      errors: validation_errors
    }
  
  initialize_rules()
  
  RETURN {
    validate_nesting: validate_nesting,
    validate_depth: validate_depth,
    validate_structure: validate_container_structure
  }

## Container Transformation Pipeline

FUNCTION create_container_transformer()
  LET transformers = []
  
  FUNCTION add_transformer(transformer_function)
    ADD transformer_function to transformers
  
  FUNCTION transform(container)
    LET result = container
    
    FOR each transformer in transformers DO
      result = transformer(result)
    
    RETURN result
  
  // Built-in transformers
  FUNCTION flatten_single_child_containers(container)
    IF container.type === 'container' AND 
       container.children.length === 1 AND
       container.classes.length === 0 THEN
      RETURN container.children[0]
    
    // Recursively transform children
    container.children = container.children.map(child => {
      IF child.type === 'container' THEN
        RETURN flatten_single_child_containers(child)
      RETURN child
    })
    
    RETURN container
  
  FUNCTION merge_adjacent_text_nodes(container)
    LET merged_children = []
    LET current_text = null
    
    FOR each child in container.children DO
      IF child.type === 'text' AND current_text !== null THEN
        // Merge with previous text node
        current_text.value += child.value
      ELSE
        IF current_text !== null THEN
          ADD current_text to merged_children
        
        IF child.type === 'text' THEN
          current_text = clone(child)
        ELSE
          ADD child to merged_children
          current_text = null
    
    IF current_text !== null THEN
      ADD current_text to merged_children
    
    container.children = merged_children
    RETURN container
  
  FUNCTION apply_container_classes(container, class_map)
    FOR each class_name in container.classes DO
      IF class_map has class_name THEN
        LET class_config = class_map.get(class_name)
        
        // Apply transformations based on class
        IF class_config.wrapper THEN
          container = wrap_container(container, class_config.wrapper)
        
        IF class_config.attributes THEN
          FOR each [key, value] in class_config.attributes DO
            container.attributes.set(key, value)
    
    RETURN container
  
  RETURN {
    add_transformer: add_transformer,
    transform: transform,
    flatten_single_child: flatten_single_child_containers,
    merge_text: merge_adjacent_text_nodes,
    apply_classes: apply_container_classes
  }

## Container Query System

FUNCTION create_container_query()
  FUNCTION query_containers(root, selector)
    LET results = []
    
    FUNCTION matches_selector(container, selector_parts)
      FOR each part in selector_parts DO
        IF part.startsWith('.') THEN
          LET class_name = part.substring(1)
          IF NOT container.has_class(class_name) THEN
            RETURN false
        ELSE IF part === container.type THEN
          CONTINUE
        ELSE
          RETURN false
      
      RETURN true
    
    FUNCTION traverse(container)
      LET selector_parts = selector.split(' ')
      
      IF matches_selector(container, selector_parts) THEN
        ADD container to results
      
      FOR each child in container.children DO
        IF child.type === 'container' THEN
          traverse(child)
    
    traverse(root)
    RETURN results
  
  FUNCTION find_by_class(root, class_name)
    RETURN query_containers(root, `.${class_name}`)
  
  FUNCTION find_by_type(root, type)
    LET results = []
    
    FUNCTION traverse(element)
      IF element.type === type THEN
        ADD element to results
      
      IF element.children EXISTS THEN
        FOR each child in element.children DO
          traverse(child)
    
    traverse(root)
    RETURN results
  
  FUNCTION get_container_stats(root)
    LET stats = {
      total_containers: 0,
      max_depth: 0,
      class_distribution: new Map(),
      element_counts: new Map()
    }
    
    FUNCTION analyze(container, depth)
      IF container.type === 'container' THEN
        stats.total_containers += 1
        stats.max_depth = max(stats.max_depth, depth)
        
        FOR each class_name in container.classes DO
          LET count = stats.class_distribution.get(class_name) || 0
          stats.class_distribution.set(class_name, count + 1)
      
      // Count element type
      LET type_count = stats.element_counts.get(container.type) || 0
      stats.element_counts.set(container.type, type_count + 1)
      
      // Recurse
      IF container.children EXISTS THEN
        FOR each child in container.children DO
          analyze(child, depth + 1)
    
    analyze(root, 0)
    RETURN stats
  
  RETURN {
    query: query_containers,
    find_by_class: find_by_class,
    find_by_type: find_by_type,
    get_stats: get_container_stats
  }