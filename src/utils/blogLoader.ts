import { marked } from 'marked';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  slug: string;
  headings: BlogHeading[];
}

export interface BlogHeading {
  id: string;
  text: string;
  level: number;
}

interface BlogPostFrontmatter {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  slug: string;
}

// Import all blog markdown files
const blogModules = import.meta.glob('../data/blog/*.md', {
  as: 'raw',
  eager: true
});

function parseMarkdownWithFrontmatter(markdownContent: string): { frontmatter: BlogPostFrontmatter; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdownContent.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('Invalid markdown file: missing frontmatter');
  }
  
  const frontmatterContent = match[1];
  const content = match[2];
  
  // Parse frontmatter
  const frontmatter: Partial<BlogPostFrontmatter> = {};
  const lines = frontmatterContent.split('\n');
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      frontmatter[key.trim() as keyof BlogPostFrontmatter] = value;
    }
  }
  
  // Validate required fields
  const requiredFields: (keyof BlogPostFrontmatter)[] = ['title', 'excerpt', 'author', 'date', 'category', 'readTime', 'slug'];
  for (const field of requiredFields) {
    if (!frontmatter[field]) {
      throw new Error(`Missing required frontmatter field: ${field}`);
    }
  }
  
  return {
    frontmatter: frontmatter as BlogPostFrontmatter,
    content: content.trim()
  };
}

// Generate slug from heading text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Extract headings from markdown for Table of Contents
function extractHeadings(markdown: string): BlogHeading[] {
  const headings: BlogHeading[] = [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = generateSlug(text);

    // Only include H2 and H3 for TOC
    if (level === 2 || level === 3) {
      headings.push({ id, text, level });
    }
  }

  return headings;
}

// Convert markdown to HTML with heading IDs
function convertMarkdownToHtml(markdown: string): string {
  // Configure marked options
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Line breaks become <br>
  });

  // Custom renderer to add IDs to headings
  const renderer = new marked.Renderer();
  const originalHeading = renderer.heading.bind(renderer);

  renderer.heading = ({ text, depth }) => {
    const id = generateSlug(text);
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  // Custom code block styling
  renderer.code = ({ text, lang }) => {
    return `<pre class="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto"><code class="language-${lang || 'text'}">${text}</code></pre>`;
  };

  // Custom blockquote styling
  renderer.blockquote = ({ text }) => {
    return `<blockquote class="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700">${text}</blockquote>`;
  };

  marked.use({ renderer });

  try {
    return marked.parse(markdown) as string;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return '<p>Error parsing content</p>';
  }
}

export function getAllBlogPosts(): BlogPost[] {
  const posts: BlogPost[] = [];

  for (const [path, content] of Object.entries(blogModules)) {
    try {
      const { frontmatter, content: markdownContent } = parseMarkdownWithFrontmatter(content as string);
      const headings = extractHeadings(markdownContent);
      const htmlContent = convertMarkdownToHtml(markdownContent);

      // Extract ID from filename
      const filename = path.split('/').pop()?.replace('.md', '') || '';

      posts.push({
        id: filename,
        title: frontmatter.title,
        excerpt: frontmatter.excerpt,
        content: htmlContent,
        author: frontmatter.author,
        date: frontmatter.date,
        category: frontmatter.category,
        readTime: frontmatter.readTime,
        slug: frontmatter.slug,
        headings
      });
    } catch (error) {
      // Import logger dynamically to avoid circular dependencies
      import('./logger').then(({ logger }) => {
        logger.error('Error parsing blog post', error instanceof Error ? error : new Error(String(error)), { path });
      }).catch(() => {});
    }
  }

  // Sort by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  const posts = getAllBlogPosts();
  return posts.find(post => post.slug === slug);
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  const posts = getAllBlogPosts();
  return posts
    .filter(post => post.slug !== currentSlug)
    .slice(0, limit);
}
