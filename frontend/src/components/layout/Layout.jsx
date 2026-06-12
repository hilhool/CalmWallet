import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-cream flex justify-center">
      <div className="w-full max-w-[430px] relative flex flex-col min-h-screen pb-[72px]">
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
      <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50">
        <div className="w-full max-w-[430px]">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
