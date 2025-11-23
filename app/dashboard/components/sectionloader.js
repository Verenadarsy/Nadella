import { Loader2 } from 'lucide-react'

export default function SectionLoader({ darkMode, text = "Loading..." }) {
    return (
        <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {text}
            </p>
        </div>
    )
}