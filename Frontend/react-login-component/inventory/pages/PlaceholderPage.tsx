"use client"

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-gray-800/80 border border-gray-700/50 flex items-center justify-center mb-4">
        <span className="text-2xl text-gray-500">🔧</span>
      </div>
      <h2 className="text-lg font-semibold text-gray-300 mb-1">{title}</h2>
      <p className="text-sm text-gray-500">This page is coming soon.</p>
    </div>
  )
}
