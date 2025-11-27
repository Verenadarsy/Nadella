import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white px-4">
                <h1 className="text-5xl font-bold mb-4">Welcome</h1>
                <p className="text-xl mb-8 max-w-md mx-auto">
                    A simple and elegant landing page to get you started
                </p>
                <div className="space-x-4">
                    <Link href="#" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                        Get Started
                    </Link>
                    <Link href="#" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
                        Learn More
                    </Link>
                </div>
            </div>
        </div>
    );
}