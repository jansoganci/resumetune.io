

export default function Footer(): JSX.Element {
  return (
    <footer className="bg-white border-t border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <small className="text-xs text-gray-600">© ResumeTune.io</small>
          <nav aria-label="Legal links" className="flex items-center space-x-4">
            <a href="/pricing" className="text-xs text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a href="/content/index.html" className="text-xs text-gray-600 hover:text-gray-900">
              Guides
            </a>
            <a href="/legal/privacy-policy.html" className="text-xs text-gray-600 hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="/legal/terms-of-service.html" className="text-xs text-gray-600 hover:text-gray-900">
              Terms of Service
            </a>
            <a href="/legal/imprint.html" className="text-xs text-gray-600 hover:text-gray-900">
              Imprint
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
