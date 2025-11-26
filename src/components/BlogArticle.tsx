import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Share2, Bookmark, BookOpen, Twitter, Facebook, Linkedin, Copy, Check } from 'lucide-react';
import { BlogPost } from '../utils/blogLoader';
import { useState, useEffect, useRef, useMemo } from 'react';
import { SOCIAL_SHARE_URLS } from '../config/constants';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';

interface BlogArticleProps {
  post: BlogPost;
  relatedPosts?: BlogPost[];
}

export default function BlogArticle({ post, relatedPosts = [] }: BlogArticleProps): JSX.Element {
  const { t, i18n } = useTranslation(['pages']);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML content with DOMPurify
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(post.content, {
      ADD_ATTR: ['target', 'rel'], // Allow target and rel attributes for links
      ADD_TAGS: ['iframe'], // Allow iframes for embeds
    });
  }, [post.content]);

  // Load bookmark status from localStorage on mount
  useEffect(() => {
    const bookmarkKey = `bookmark:${post.slug}`;
    const isBookmarkedInStorage = localStorage.getItem(bookmarkKey) === 'true';
    setIsBookmarked(isBookmarkedInStorage);
  }, [post.slug]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = post.title;
    const text = post.excerpt;

    if (platform === 'twitter') {
      window.open(SOCIAL_SHARE_URLS.TWITTER(url), '_blank');
    } else if (platform === 'facebook') {
      window.open(SOCIAL_SHARE_URLS.FACEBOOK(url), '_blank');
    } else if (platform === 'linkedin') {
      window.open(SOCIAL_SHARE_URLS.LINKEDIN(url), '_blank');
    } else if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        // User likely cancelled the share, which is normal behavior
        import('../utils/logger').then(({ logger }) => {
          logger.debug('Share cancelled or failed', { error });
        }).catch(() => {});
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowShareMenu(false);
  };

  const toggleBookmark = () => {
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);

    // Persist to localStorage
    const bookmarkKey = `bookmark:${post.slug}`;
    if (newBookmarkState) {
      localStorage.setItem(bookmarkKey, 'true');
    } else {
      localStorage.removeItem(bookmarkKey);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back to Blog */}
      <div className="mb-8">
        <Link
          to="/blog"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t('pages:blogArticle.backToBlog')}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Article Content */}
        <article className="lg:col-span-3">
          {/* Article Header */}
          <header className="mb-12">
            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <div className="flex items-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleBookmark}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                
                <div className="relative" ref={shareMenuRef}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{t('pages:blogArticle.share')}</span>
                  </button>
                  
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                      <button
                        onClick={() => handleShare('twitter')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Twitter className="w-4 h-4 text-blue-400" />
                        <span>{t('pages:blogArticle.twitter')}</span>
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Facebook className="w-4 h-4 text-blue-600" />
                        <span>{t('pages:blogArticle.facebook')}</span>
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Linkedin className="w-4 h-4 text-blue-700" />
                        <span>{t('pages:blogArticle.linkedin')}</span>
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? t('pages:blogArticle.copied') : t('pages:blogArticle.copyLink')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Excerpt */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 rounded-r-xl">
              <p className="text-gray-700 text-lg leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          </header>

          {/* Hero Image */}
          {post.image && (
            <div className="mb-12 rounded-xl overflow-hidden shadow-lg">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-auto max-h-96 object-cover"
                loading="eager"
              />
            </div>
          )}

          {/* Article Content */}
          <div
            className="prose prose-lg max-w-none mb-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            style={{
              color: '#374151',
              lineHeight: '1.8',
              fontSize: '18px'
            }}
          />
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1 mt-8 lg:mt-0">
          <div className="sticky top-8 space-y-6">
            {/* Table of Contents - Dynamic */}
            {post.headings.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                  {t('pages:blogArticle.quickNavigation')}
                </h3>
                <nav className="space-y-2 text-sm">
                  {post.headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={`block text-gray-600 hover:text-blue-600 transition-colors py-1 ${
                        heading.level === 3 ? 'pl-4' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById(heading.id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          // Update URL without triggering navigation
                          window.history.pushState(null, '', `#${heading.id}`);
                        }
                      }}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Reading Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages:blogArticle.readingInfo')}</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>{t('pages:blogArticle.readingTime')}</span>
                  <span className="font-medium">{post.readTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('pages:blogArticle.category')}</span>
                  <span className="font-medium">{post.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('pages:blogArticle.published')}</span>
                  <span className="font-medium">{formatDate(post.date)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages:blogArticle.quickActions')}</h3>
              <div className="space-y-3">
                <Link
                  to="/"
                  className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {t('pages:blogArticle.tryResumeTune')}
                </Link>
                <Link
                  to="/blog"
                  className="block w-full px-4 py-2 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {t('pages:blogArticle.moreArticles')}
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
            <span className="w-3 h-3 bg-blue-600 rounded-full mr-3"></span>
            {t('pages:blogArticle.relatedArticles')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link 
                key={relatedPost.id}
                to={`/blog/${relatedPost.slug}`}
                className="group block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors">
                    {relatedPost.category}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {relatedPost.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {relatedPost.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(relatedPost.date)}</span>
                  <span>{relatedPost.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Enhanced Call to Action */}
      <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 text-center border border-blue-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {t('pages:blogArticle.ctaTitle')}
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          {t('pages:blogArticle.ctaDescription')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
          >
            {t('pages:blogArticle.getStartedFree')}
          </Link>
          <Link
            to="/pricing"
            className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
          >
            {t('pages:blogArticle.viewPricing')}
          </Link>
        </div>
      </div>
    </div>
  );
}
