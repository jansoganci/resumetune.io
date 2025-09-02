import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { BlogPost } from '../utils/blogLoader';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps): JSX.Element {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Link 
      to={`/blog/${post.slug}`}
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 hover:border-blue-200 hover:-translate-y-1"
    >
      <article className="p-6 h-full flex flex-col">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3 flex-grow text-sm leading-relaxed">
          {post.excerpt}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.date)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-blue-600 group-hover:text-blue-700 transition-colors">
            <span className="text-xs font-medium">Read</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
}
