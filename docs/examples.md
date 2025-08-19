# Examples

## Basic Presentation
```curtain
<style>
/* Global styles */
.centered { text-align: center; }
</style>

===

# Title Slide
Welcome to my presentation

===

## Content Slide
- Point 1
- Point 2
- Point 3

===

## Thank You!
```

## With Containers & Styling
```curtain
<style>
/* Global styles for all slides */
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
</style>

===

<container class="hero">
# My Presentation
</container>

<style>
/* This style only applies to slide 1 */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}
</style>

===

<container class="columns">
  <container class="column">
  ### Points
  - First
  - Second
  </container>
  
  <container class="column">
  ![image](./image.png)
  </container>
</container>
```

## Input/Output Files
```bash
# Input: presentation.curtain
# Output: presentation.html

curtains build presentation.curtain -o presentation.html --theme dark
```

## Generated HTML Structure
```html
<div class="curtains-root" data-theme="dark">
  <div class="curtains-stage">
    <section class="curtains-slide">
      <h1>Title Slide</h1>
      <p>Welcome to my presentation</p>
    </section>
    <section class="curtains-slide">
      <h2>Content Slide</h2>
      <ul>
        <li>Point 1</li>
        <li>Point 2</li>
        <li>Point 3</li>
      </ul>
    </section>
  </div>
  <div class="curtains-counter">1/3</div>
</div>
```