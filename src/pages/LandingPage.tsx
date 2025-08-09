import Header from '../components/Header';
import Landing from '../components/Landing';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Landing />
      </main>
      
      <Footer />
    </div>
  );
}
