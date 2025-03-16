import { InternalLink } from '#/ui/internal-link';
import { auth } from '@clerk/nextjs';
import Image from 'next/image';
import Screenshot from '#/images/cbud-1-Screenshot-04-16-2024.png';
import Link from 'next/link';
import titles from '#/titles.json';

export default async function Page() {
  // Only keep auth check if needed for other functionality
  const { userId } = auth();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {titles.title}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Streamline your Trucking management with our comprehensive solution for scheduling, 
            timecards, route optimization, and time management.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">
              Transform Your Trucking Operations
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-gray-300">
                  Efficient scheduling and resource allocation
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-gray-300">
                  Automated timecard processing and approval
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-gray-300">
                  Optimized route planning and management
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Link 
                href="/main/schedule" 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-150"
              >
                Preview our scheduling system
              </Link>
            </div>
          </div>

          <div className="relative group">
            <Link href="/main/schedule" className="block">
              <div className="relative rounded-lg overflow-hidden shadow-xl transform transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={Screenshot}
                  alt="Contractor Bud Interface"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gray-900 bg-opacity-10 group-hover:bg-opacity-0 transition-opacity duration-300"></div>
              </div>
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex rounded-md shadow">
            <InternalLink href="/main/schedule">
              <span className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150">
                Get Started Now
              </span>
            </InternalLink>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            No credit card required • Free trial available
          </p>
        </div>
      </div>
    </div>
  );
}