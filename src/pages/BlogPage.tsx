import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter, TrendingUp, Users, Star } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BlogCard from '../components/BlogCard';
import { getAllBlogPosts } from '../utils/blogLoader';
import { useState, useMemo } from 'react';
import { SEOHead } from '../components/SEOHead';

export default function BlogPage(): JSX.Element {
  const allBlogPosts = getAllBlogPosts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(allBlogPosts.map(post => post.category))];
    return cats;
  }, [allBlogPosts]);
  
  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return allBlogPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allBlogPosts, searchTerm, selectedCategory]);
  
  // Get featured post (most recent)
  const featuredPost = allBlogPosts[0];
  const regularPosts = filteredPosts.slice(1);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Career Success Blog - Resume Tips & Job Search Advice | ResumeTune"
        description="Expert career advice, resume tips, and job search strategies. Learn how to optimize your resume for ATS, write compelling cover letters, and land more interviews."
        keywords="resume tips, cover letter advice, job search strategies, career advice, ATS optimization, interview tips, career success, job hunting"
        canonicalUrl="https://resumetune.io/blog"
        ogType="website"
        ogImage="https://resumetune.io/og-image-blog.png"
        twitterCard="summary_large_image"
      />

      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Hero Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 text-center border border-blue-100">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Career Success Hub</h1>
                <p className="text-lg text-gray-600">Expert insights to accelerate your job search</p>
              </div>
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 mb-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>10,000+ readers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>4.8/5 rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>95% success rate</span>
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="max-w-2xl mx-auto">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mt-6">
            <Link to="/" className="hover:text-gray-700 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900">Blog</span>
          </nav>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              Featured Article
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <Link to={`/blog/${featuredPost.slug}`} className="block">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {featuredPost.category}
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Featured
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-gray-600 text-lg mb-4 line-clamp-2">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>{featuredPost.readTime}</span>
                      <span>•</span>
                      <span>{new Date(featuredPost.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <span className="text-blue-600 font-medium">Read more →</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
            All Articles ({filteredPosts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {regularPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Ready to optimize your job applications?
          </h2>
          <p className="text-gray-600 mb-6">
            Use our AI-powered tools to create tailored cover letters and optimize your resume for any job.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              to="/"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Get Started Free
            </Link>
            <Link 
              to="/pricing"
              className="px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
