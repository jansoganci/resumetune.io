import { useParams, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BlogArticle from '../components/BlogArticle';
import { getBlogPostBySlug, getRelatedPosts } from '../utils/blogLoader';

export default function BlogArticlePage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const [readingProgress, setReadingProgress] = useState(0);
  
  if (!slug) {
    return <Navigate to="/blog" replace />;
  }

  const post = getBlogPostBySlug(slug);
  
  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const relatedPosts = getRelatedPosts(slug, 3);

  // Reading progress tracking
  useEffect(() => {
    const updateReadingProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', updateReadingProgress);
    return () => window.removeEventListener('scroll', updateReadingProgress);
  }, []);

  // Scroll to top when slug changes (new article loaded)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-blue-600 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>
      
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogArticle post={post} relatedPosts={relatedPosts} />
      </main>
      
      <Footer />
    </div>
  );
}
