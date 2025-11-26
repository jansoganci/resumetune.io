import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter, TrendingUp, Users, Star, Tag, X } from 'lucide-react';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(allBlogPosts.map(post => post.category))];
    return cats;
  }, [allBlogPosts]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allBlogPosts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [allBlogPosts]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedTags([]);
  };

  // Filter posts based on search, category, and tags
  const filteredPosts = useMemo(() => {
    return allBlogPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesTags = selectedTags.length === 0 ||
                         (post.tags && selectedTags.some(tag => post.tags!.includes(tag)));
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [allBlogPosts, searchTerm, selectedCategory, selectedTags]);

  // Get featured post (most recent) and regular posts
  const featuredPost = allBlogPosts[0];
  const isFiltering = searchTerm !== '' || selectedCategory !== 'All' || selectedTags.length > 0;

  // When filtering/searching, show all filtered results
  // When not filtering, exclude the featured post from regular posts
  const regularPosts = isFiltering ? filteredPosts : filteredPosts.slice(1);
  
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
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
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

              {/* Tag Filter */}
              {allTags.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Filter by tags:</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[36px] touch-manipulation ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white shadow-md scale-105'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filters Display */}
              {isFiltering && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {selectedCategory !== 'All' && (
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {selectedCategory}
                    </span>
                  )}
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-xs font-medium transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                </div>
              )}
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

        {/* Enhanced Featured Post */}
        {featuredPost && !isFiltering && (
          <div className="mb-16">
            <div className="flex items-center mb-6">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">Featured Article</span>
              </div>
            </div>

            <Link
              to={`/blog/${featuredPost.slug}`}
              className="group block bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden hover:shadow-2xl hover:border-blue-300 transition-all duration-300"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Featured Image */}
                {featuredPost.image && (
                  <div className="relative h-64 lg:h-auto overflow-hidden bg-gray-100">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/90 backdrop-blur-sm text-blue-800 shadow-lg">
                        {featuredPost.category}
                      </span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white shadow-sm">
                      Latest Post
                    </span>
                  </div>

                  <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                    {featuredPost.title}
                  </h3>

                  <p className="text-gray-700 text-lg mb-6 line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs">
                        {featuredPost.author.charAt(0)}
                      </div>
                      <span className="font-medium">{featuredPost.author}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(featuredPost.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                    <span>•</span>
                    <span>{featuredPost.readTime}</span>
                  </div>

                  {/* Tags */}
                  {featuredPost.tags && featuredPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {featuredPost.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-3 text-blue-600 font-semibold group-hover:text-blue-700">
                    <span>Read Full Article</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
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
          
          {regularPosts.length === 0 && (
            <div className="col-span-full">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* Message */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No articles found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm && selectedTags.length === 0 && selectedCategory === 'All' && (
                      <>We couldn't find any articles matching "<strong>{searchTerm}</strong>". Try different keywords or browse by category.</>
                    )}
                    {selectedTags.length > 0 && !searchTerm && selectedCategory === 'All' && (
                      <>No articles found with the selected tag{selectedTags.length > 1 ? 's' : ''}. Try selecting different tags or browse all articles.</>
                    )}
                    {selectedCategory !== 'All' && selectedTags.length === 0 && !searchTerm && (
                      <>No articles found in the "<strong>{selectedCategory}</strong>" category yet. Check back soon or explore other categories.</>
                    )}
                    {(searchTerm || selectedTags.length > 0) && selectedCategory !== 'All' && (
                      <>Your filter combination didn't match any articles. Try adjusting your filters or browse all articles.</>
                    )}
                    {!searchTerm && selectedTags.length === 0 && selectedCategory === 'All' && (
                      <>We don't have any articles yet. Check back soon for career tips and resume advice!</>
                    )}
                  </p>

                  {/* Suggestions */}
                  <div className="space-y-4">
                    {/* Clear Filters Button */}
                    {isFiltering && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                      >
                        <X className="w-4 h-4" />
                        <span>Clear All Filters</span>
                      </button>
                    )}

                    {/* Popular Categories */}
                    {categories.length > 1 && (
                      <div className="pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-3">Browse by category:</p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {categories.filter(cat => cat !== 'All' && cat !== selectedCategory).slice(0, 4).map((category) => (
                            <button
                              key={category}
                              onClick={() => {
                                setSelectedCategory(category);
                                setSearchTerm('');
                                setSelectedTags([]);
                              }}
                              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Tags */}
                    {allTags.length > 0 && (
                      <div className="pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-3">Or try these popular topics:</p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {allTags.filter(tag => !selectedTags.includes(tag)).slice(0, 6).map((tag) => (
                            <button
                              key={tag}
                              onClick={() => {
                                setSelectedTags([tag]);
                                setSearchTerm('');
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full text-xs font-medium transition-colors"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Back to Home CTA */}
                    <div className="pt-6 border-t border-gray-200">
                      <Link
                        to="/"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        <span>← Back to Home</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
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
