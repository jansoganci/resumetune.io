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

function convertMarkdownToHtml(markdown: string): string {
  // Simple markdown to HTML converter
  // For production, you might want to use a proper markdown parser like marked or remark
  
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; white-space: pre-wrap; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial;">$1</div>')
    
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    
    // Numbered lists
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
    
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|o|l|d])/gm, '<p>')
    .replace(/(?<!>)$/gm, '</p>')
    
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '');
  
  return html;
}

export function getAllBlogPosts(): BlogPost[] {
  const posts: BlogPost[] = [];
  
  for (const [path, content] of Object.entries(blogModules)) {
    try {
      const { frontmatter, content: markdownContent } = parseMarkdownWithFrontmatter(content as string);
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
        slug: frontmatter.slug
      });
    } catch (error) {
      console.error(`Error parsing blog post ${path}:`, error);
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
